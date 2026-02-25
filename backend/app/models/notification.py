"""
消息通知 ORM 模型
对齐前端 types/index.ts: Notification
"""
from sqlalchemy import String, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, AuditMixin


class Notification(Base, AuditMixin):
    """
    消息通知
    对齐前端 Notification: id, title, content, type, read, createdAt
    类型枚举: info | warning | success | error
    """
    __tablename__ = "notifications"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(
        String(20), default="info", comment="通知类型: info/warning/success/error"
    )
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    user_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="接收用户ID"
    )
