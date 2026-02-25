"""
WebSocket 路由
接入点: ws://<host>/api/v1/ws/connect?token=<jwt>
对齐 BACKEND_CONTEXT.md § 4.4, § 4.6

IM 消息流:
  前端 send → { type: "im.message", data: { conversationId, content, contentType, scene } }
  后端处理:
    1. 持久化到 im_messages
    2. 更新 im_conversations.last_message / last_time
    3. 私聊 → 转发给 peer_user_id
    4. 群聊 → 转发给所有 member_ids (排除发送者)
    5. 回执给发送者 im.ack
"""
import json
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError
from sqlalchemy import select

from app.core.security import decode_access_token
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.im_conversation import IMConversation
from app.models.im_message import IMMessage
from app.services.ws_manager import manager

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/connect")
async def ws_connect(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket 入口
    1. 握手阶段校验 JWT (Code 1008: Policy Violation)
    2. 互踢 (§ 4.6)
    3. 消息循环: 处理 ping / im.message / screen.*
    """
    # === 鉴权 ===
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.accept()
        await websocket.close(code=1008)
        return

    # === 查询用户信息 (用于消息冗余字段) ===
    sender_info = {"name": "", "ext": "", "dept": "", "avatar": ""}
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                sender_info = {
                    "name": user.name or "",
                    "ext": user.employee_no or "",
                    "dept": user.department or "",
                    "avatar": user.avatar or "",
                }
    except Exception:
        pass

    # === 建立连接 (含互踢) ===
    await manager.connect(user_id, websocket)

    try:
        # 上线通知
        await manager.broadcast(
            "status.change",
            {"userId": user_id, "status": "online"},
            exclude=user_id,
        )

        # === 消息循环 ===
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type", "")

            # 心跳
            if msg_type == "ping":
                await websocket.send_json(manager._build_event("pong", {}))
                continue

            # 大屏初始数据请求
            if msg_type == "screen.v1.init":
                from app.services.screen_service import screen_service
                data = await screen_service.get_v1_data()
                await websocket.send_json(manager._build_event("screen.v1.update", data))
                continue

            if msg_type == "screen.v2.init":
                from app.services.screen_service import screen_service
                data = await screen_service.get_v2_data()
                await websocket.send_json(manager._build_event("screen.v2.update", data))
                continue

            if msg_type == "screen.ranking.init":
                from app.services.screen_service import screen_service
                data = await screen_service.get_ranking_data()
                await websocket.send_json(manager._build_event("screen.ranking.update", data))
                continue

            # ============================================================
            # IM 消息转发 + 持久化
            # ============================================================
            if msg_type == "im.message":
                data = msg.get("data", {})
                conversation_id = data.get("conversationId", "")
                content = data.get("content", "")
                content_type = data.get("contentType", "text")
                file_name = data.get("fileName")
                file_size = data.get("fileSize")

                if not conversation_id or not content:
                    continue

                # 查询会话信息 (判断私聊/群聊, 获取接收者列表)
                conv = None
                async with AsyncSessionLocal() as db:
                    result = await db.execute(
                        select(IMConversation).where(IMConversation.id == conversation_id)
                    )
                    conv = result.scalar_one_or_none()

                if not conv:
                    # 会话不存在, 跳过
                    await websocket.send_json(manager._build_event("im.error", {
                        "message": "会话不存在",
                        "conversationId": conversation_id,
                    }))
                    continue

                scene = "group" if conv.type == "group" else "private"
                display_time = time.strftime("%H:%M", time.localtime())

                # 持久化到数据库
                msg_id = ""
                async with AsyncSessionLocal() as db:
                    im_msg = IMMessage(
                        conversation_id=conversation_id,
                        sender_id=user_id,
                        receiver_id=conversation_id,  # 统一用 conversation_id
                        sender_name=sender_info["name"],
                        sender_ext=sender_info["ext"],
                        sender_dept=sender_info["dept"],
                        sender_avatar=sender_info["avatar"],
                        direction="sent",
                        content=content,
                        content_type=content_type,
                        file_name=file_name,
                        file_size=file_size,
                        scene=scene,
                        status="sent",
                        display_time=display_time,
                    )
                    db.add(im_msg)

                    # 更新会话的最后消息和时间
                    conv_result = await db.execute(
                        select(IMConversation).where(IMConversation.id == conversation_id)
                    )
                    conv_obj = conv_result.scalar_one_or_none()
                    if conv_obj:
                        # 群聊前缀显示发送者姓名
                        if conv_obj.type == "group":
                            conv_obj.last_message = f"{sender_info['name']}: {content[:50]}"
                        else:
                            conv_obj.last_message = content[:50]
                        conv_obj.last_time = display_time

                    await db.commit()
                    msg_id = im_msg.id

                # 构建转发给接收者的消息体
                forward_payload = {
                    "id": msg_id,
                    "conversationId": conversation_id,
                    "senderId": user_id,
                    "senderName": sender_info["name"],
                    "senderExt": sender_info["ext"],
                    "senderDept": sender_info["dept"],
                    "senderAvatar": sender_info["avatar"],
                    "direction": "received",  # 对接收方来说是 received
                    "type": content_type,
                    "content": content,
                    "time": display_time,
                    "fileName": file_name,
                    "fileSize": file_size,
                }

                # 根据会话类型转发
                if conv.type == "single":
                    # 私聊: 找到对方用户 ID
                    peer_id = None
                    if conv.peer_user_id == user_id:
                        peer_id = conv.created_by
                    else:
                        peer_id = conv.peer_user_id

                    if peer_id:
                        await manager.send_personal(peer_id, "im.message", forward_payload)

                elif conv.type == "group":
                    # 群聊: 转发给所有成员 (排除发送者)
                    member_ids = conv.member_ids or []
                    for member_id in member_ids:
                        if member_id != user_id:
                            await manager.send_personal(member_id, "im.message", forward_payload)

                # 回执给发送者
                await websocket.send_json(manager._build_event("im.ack", {
                    "messageId": msg_id,
                    "conversationId": conversation_id,
                    "status": "sent",
                    "time": display_time,
                }))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] Error for user {user_id}: {e}")
    finally:
        manager.disconnect(user_id)
        # 下线通知
        await manager.broadcast(
            "status.change",
            {"userId": user_id, "status": "offline"},
        )
