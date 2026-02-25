"""
WebSocket 连接管理器 + 心跳 + 互踢
对齐 BACKEND_CONTEXT.md § 4.4 / § 4.6
"""
import json
import time
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    """
    单例连接管理器
    - 维护 Dict[user_id, WebSocket] — 单设备在线 (§ 4.6)
    - 心跳: 接收 ping 回复 pong (§ 4.4)
    - 互踢: 新连接建立时，旧连接收到 sys.kick 后关闭
    """

    def __init__(self):
        # 单设备: Dict[user_id, WebSocket]
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        """建立连接 — 若已有旧连接则互踢"""
        await websocket.accept()

        # 互踢: 旧连接存在则发送 sys.kick 并关闭
        if user_id in self.active_connections:
            old_ws = self.active_connections[user_id]
            try:
                await old_ws.send_json(self._build_event(
                    event_type="sys.kick",
                    data={"reason": "logged_in_elsewhere"},
                ))
                await old_ws.close(code=1000)
            except Exception:
                pass  # 旧连接可能已断开

        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        """断开连接"""
        self.active_connections.pop(user_id, None)

    async def send_personal(self, user_id: str, event_type: str, data: Any):
        """向指定用户发送消息"""
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(self._build_event(event_type, data))
            except Exception:
                self.disconnect(user_id)

    async def broadcast(self, event_type: str, data: Any, exclude: str | None = None):
        """广播消息"""
        disconnected = []
        for uid, ws in self.active_connections.items():
            if uid == exclude:
                continue
            try:
                await ws.send_json(self._build_event(event_type, data))
            except Exception:
                disconnected.append(uid)
        for uid in disconnected:
            self.disconnect(uid)

    async def handle_heartbeat(self, websocket: WebSocket) -> bool:
        """处理心跳: 收到 ping 回复 pong, 返回 True 继续, False 断开"""
        try:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg.get("type") == "ping":
                await websocket.send_json(self._build_event("pong", {}))
                return True

            return True
        except Exception:
            return False

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections

    def online_users(self) -> list[str]:
        return list(self.active_connections.keys())

    async def kick_user(self, user_id: str, reason: str = "account_disabled"):
        """强制踢掉指定用户的 WebSocket 连接"""
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(self._build_event(
                    event_type="sys.kick",
                    data={"reason": reason},
                ))
                await ws.close(code=1000)
            except Exception:
                pass
            self.disconnect(user_id)

    @staticmethod
    def _build_event(event_type: str, data: Any, event_id: str | None = None) -> dict:
        """
        构建标准 WSEvent 负载 — 对齐 § 4.4
        { type, data, timestamp, eventId? }
        """
        event = {
            "type": event_type,
            "data": data,
            "timestamp": int(time.time() * 1000),
        }
        if event_id:
            event["eventId"] = event_id
        return event


# 全局单例
manager = ConnectionManager()
