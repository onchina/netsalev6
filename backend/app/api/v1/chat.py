"""
即时通讯 HTTP 路由
前端 chat/index.tsx 请求路径:
  GET    /api/v1/chat/employees       — 员工列表 (可聊天对象)
  GET    /api/v1/chat/conversations   — 会话列表
  GET  /api/v1/chat/groups          — 群组列表
  GET  /api/v1/chat/messages        — 指定会话的消息记录
  GET  /api/v1/chat/messages/all    — 所有消息 (IM 审计)
  POST /api/v1/chat/groups          — 创建群聊
  POST /api/v1/chat/conversations   — 获取或创建私聊会话

权限对齐 seed.py — office:chat
"""
import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, require_permission
from app.db.session import get_db
from app.models.user import User
from app.models.im_conversation import IMConversation
from app.models.im_message import IMMessage
from app.schemas.response import success_response
from app.services.ws_manager import manager

router = APIRouter(prefix="/chat", tags=["即时通讯"])


# ---------- 辅助函数 ----------

def _user_to_employee(u: User, online_ids: set[str]) -> dict:
    """将 User 对象转为前端 employee 格式"""
    return {
        "id": u.id,
        "name": u.name,
        "employeeNo": u.employee_no,
        "department": u.department,
        "avatar": u.avatar,
        "role": u.role,
        "phone": u.phone,
        "email": u.email,
        "online": u.id in online_ids,
    }


# ---------- GET 路由 ----------

@router.get("/employees")
async def get_chat_employees(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("office:chat"))],
):
    """
    可聊天的员工列表
    - ADMIN 对所有人可见（不排除）
    - 在线状态从 ws_manager 实时读取
    """
    result = await db.execute(select(User).where(User.is_deleted == False))
    users = result.scalars().all()
    online_ids = set(manager.online_users())

    data = []
    for u in users:
        # 排除当前用户自己（但 admin 角色的用户始终保留给其他人）
        if u.id == current_user.id:
            continue
        data.append(_user_to_employee(u, online_ids))

    return success_response(data=data)


@router.get("/conversations")
async def get_conversations(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("office:chat"))],
):
    """
    会话列表 — 返回当前用户相关的会话
    - 私聊: peer_user_id == current_user.id 或 created_by == current_user.id
    - 群聊: current_user.id 在 member_ids 中
    - 关联真实 User 信息、同步在线状态
    """
    result = await db.execute(
        select(IMConversation)
        .where(IMConversation.is_deleted == False)
        .order_by(IMConversation.created_at.desc())
    )
    items = result.scalars().all()
    online_ids = set(manager.online_users())

    # 收集需要查询的用户 ID
    user_ids_to_fetch = set()
    for c in items:
        if c.type == "single" and c.peer_user_id:
            user_ids_to_fetch.add(c.peer_user_id)

    # 批量获取用户信息
    user_map: dict[str, User] = {}
    if user_ids_to_fetch:
        user_result = await db.execute(
            select(User).where(User.id.in_(user_ids_to_fetch))
        )
        for u in user_result.scalars().all():
            user_map[u.id] = u

    data = []
    for c in items:
        # 过滤: 只返回当前用户参与的会话
        if c.type == "single":
            if c.peer_user_id != current_user.id and c.created_by != current_user.id:
                # 也不是这个用户创建的私聊
                continue
        elif c.type == "group":
            # 群聊：检查成员列表
            if c.member_ids and current_user.id not in c.member_ids:
                continue

        # 组装数据
        item_data = {
            "id": c.id,
            "name": c.name,
            "type": c.type,
            "lastMessage": c.last_message or "",
            "time": c.last_time or "",
            "unread": 0,
            "avatarLabel": c.avatar_label,
            "avatarColor": c.avatar_color,
            "avatar": c.avatar,
            "department": c.department,
            "employeeId": c.employee_id,
            "members": c.member_ids or [],
            "online": False,
        }

        # 私聊: 补充对方用户的在线状态和真实信息
        if c.type == "single" and c.peer_user_id:
            peer = user_map.get(c.peer_user_id)
            if peer:
                item_data["online"] = peer.id in online_ids
                item_data["name"] = peer.name
                item_data["avatar"] = peer.avatar
                item_data["department"] = peer.department
                item_data["employeeId"] = peer.employee_no

        data.append(item_data)

    return success_response(data=data)


@router.get("/groups")
async def get_groups(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("office:chat"))],
):
    """群组列表"""
    result = await db.execute(
        select(IMConversation)
        .where(IMConversation.type == "group", IMConversation.is_deleted == False)
        .order_by(IMConversation.created_at.asc())
    )
    items = result.scalars().all()
    data = []
    for c in items:
        # 只返回当前用户是成员的群聊
        if c.member_ids and current_user.id not in c.member_ids:
            continue
        data.append({
            "id": c.id,
            "name": c.name,
            "type": "group",
            "lastMessage": c.last_message or "",
            "time": c.last_time or "",
            "unread": 0,
            "avatarLabel": c.avatar_label,
            "avatarColor": c.avatar_color,
            "avatar": c.avatar,
            "members": c.member_ids or [],
        })
    return success_response(data=data)


@router.get("/messages")
async def get_messages(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("office:chat"))],
    conversation_id: str = Query(None, description="会话ID"),
):
    """指定会话的消息记录"""
    if not conversation_id:
        return success_response(data=[])

    result = await db.execute(
        select(IMMessage)
        .where(
            IMMessage.conversation_id == conversation_id,
            IMMessage.is_deleted == False,
        )
        .order_by(IMMessage.created_at.asc())
    )
    items = result.scalars().all()
    data = [{
        "id": m.id,
        "senderId": m.sender_id,
        "senderName": m.sender_name or "",
        "senderExt": m.sender_ext or "",
        "senderDept": m.sender_dept or "",
        "senderAvatar": m.sender_avatar or "",
        "direction": "sent" if m.sender_id == current_user.id else "received",
        "type": m.content_type,
        "content": m.content,
        "time": m.display_time or "",
        "fileName": m.file_name,
        "fileSize": m.file_size,
    } for m in items]
    return success_response(data=data)


@router.get("/messages/all")
async def get_all_messages(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("office:chat"))],
):
    """所有会话的消息 (设置页面 IM 审计用) — 返回 {conversationId: messages[]}"""
    result = await db.execute(
        select(IMMessage)
        .where(IMMessage.is_deleted == False)
        .order_by(IMMessage.created_at.asc())
    )
    items = result.scalars().all()
    grouped: dict[str, list] = {}
    for m in items:
        cid = m.conversation_id
        if cid not in grouped:
            grouped[cid] = []
        grouped[cid].append({
            "id": m.id,
            "senderId": m.sender_id,
            "senderName": m.sender_name or "",
            "senderExt": m.sender_ext or "",
            "senderDept": m.sender_dept or "",
            "senderAvatar": m.sender_avatar or "",
            "direction": "sent" if m.sender_id == current_user.id else "received",
            "type": m.content_type,
            "content": m.content,
            "time": m.display_time or "",
            "fileName": m.file_name,
            "fileSize": m.file_size,
        })
    return success_response(data=grouped)


# ---------- POST 路由 ----------

class CreateGroupRequest(BaseModel):
    name: str
    member_ids: list[str]


@router.post("/groups")
async def create_group(
    body: CreateGroupRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("office:chat"))],
):
    """
    创建群聊
    - 自动把当前用户加入成员列表
    - 生成头像标签和颜色
    """
    # 确保当前用户也在成员列表中
    all_member_ids = list(set([current_user.id] + body.member_ids))

    # 生成头像信息
    colors = ["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#0ea5e9"]
    avatar_label = body.name[0] if body.name else "群"
    avatar_color = colors[len(body.name) % len(colors)]

    group = IMConversation(
        name=body.name,
        type="group",
        avatar_label=avatar_label,
        avatar_color=avatar_color,
        member_ids=all_member_ids,
        last_message="群聊已创建",
        last_time="刚刚",
        created_by=current_user.id,
    )
    db.add(group)
    await db.flush()
    await db.commit()

    return success_response(data={
        "id": group.id,
        "name": group.name,
        "type": "group",
        "avatarLabel": avatar_label,
        "avatarColor": avatar_color,
        "members": all_member_ids,
    })


class GetOrCreateConversationRequest(BaseModel):
    peer_user_id: str


@router.post("/conversations")
async def get_or_create_conversation(
    body: GetOrCreateConversationRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("office:chat"))],
):
    """
    获取或创建私聊会话
    - 如果已存在当前用户与目标用户的私聊会话，直接返回
    - 否则创建新会话
    """
    peer_id = body.peer_user_id

    # 查找已存在的私聊会话 (双向查找)
    result = await db.execute(
        select(IMConversation)
        .where(
            IMConversation.type == "single",
            IMConversation.is_deleted == False,
        )
    )
    existing = result.scalars().all()

    for c in existing:
        # 检查是不是这两个人的会话
        if (c.peer_user_id == peer_id and c.created_by == current_user.id) or \
           (c.peer_user_id == current_user.id and c.created_by == peer_id):
            return success_response(data={"id": c.id, "existed": True})

    # 获取对方用户信息
    peer_result = await db.execute(select(User).where(User.id == peer_id))
    peer_user = peer_result.scalar_one_or_none()
    if not peer_user:
        return success_response(data={"error": "用户不存在"})

    # 创建新会话
    conv = IMConversation(
        name=peer_user.name,
        type="single",
        avatar=peer_user.avatar,
        avatar_label=peer_user.name[0] if peer_user.name else "?",
        avatar_color="#6366f1",
        peer_user_id=peer_id,
        department=peer_user.department,
        employee_id=peer_user.employee_no,
        created_by=current_user.id,
    )
    db.add(conv)
    await db.flush()
    await db.commit()

    return success_response(data={"id": conv.id, "existed": False})


# ---------- 管理路由 ----------

@router.delete("/reset-seed")
async def reset_im_seed(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("settings:system"))],
):
    """
    重置 IM 种子数据 (仅管理员)
    - 删除所有 IM 会话和消息
    - 重新运行种子脚本中 IM 部分的逻辑
    """
    from sqlalchemy import delete

    # 删除所有消息和会话
    await db.execute(delete(IMMessage))
    await db.execute(delete(IMConversation))
    await db.commit()

    # 重新运行种子脚本
    from app.db.seed import seed
    await seed()

    return success_response(message="IM 数据已重置")

