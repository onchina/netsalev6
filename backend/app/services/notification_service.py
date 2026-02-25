from datetime import datetime, timezone
from typing import Any

from app.db.session import AsyncSessionLocal
from app.models.notification import Notification
from app.services.ws_manager import manager

class NotificationService:
    """
    通用消息通知服务
    - 负责保存通知到数据库
    - 负责实时推送通知到在线客户端
    """

    async def notify(
        self, 
        user_id: str, 
        title: str, 
        content: str, 
        type: str = "info"
    ) -> Notification:
        # 1. 持久化到数据库
        async with AsyncSessionLocal() as db:
            notification = Notification(
                user_id=user_id,
                title=title,
                content=content,
                type=type,
                read=False
            )
            db.add(notification)
            await db.commit()
            await db.refresh(notification)
            
            notif_id = notification.id
            created_at = notification.created_at

        # 2. 如果用户在线，通过 WebSocket 实时推送
        if manager.is_online(user_id):
            await manager.send_personal(user_id, "sys.notification", {
                "id": notif_id,
                "title": title,
                "content": content,
                "type": type,
                "read": False,
                "createdAt": created_at.isoformat()
            })
            
        return notification

notification_service = NotificationService()
