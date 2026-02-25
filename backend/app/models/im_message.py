"""
IM 消息 ORM 模型
对齐 BACKEND_CONTEXT.md § 4.4 IMMessage 数据模型
扩展: 文件名/文件大小/发送方向 等前端 chat 所需字段
"""
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, AuditMixin


class IMMessage(Base, AuditMixin):
    """
    IM 即时通讯消息持久化
    对齐前端 Message 接口:
      id, senderId, senderName, direction, type, content, time
      可选: fileName, fileSize, senderExt, senderDept, senderAvatar
    """
    __tablename__ = "im_messages"

    conversation_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="所属会话ID (im_conversations.id)"
    )
    sender_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    receiver_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="用户ID或群组ID"
    )
    sender_name: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="发送者姓名(冗余)"
    )
    sender_ext: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="发送者工号"
    )
    sender_dept: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="发送者部门"
    )
    sender_avatar: Mapped[str | None] = mapped_column(
        String(500), nullable=True, comment="发送者头像"
    )
    direction: Mapped[str] = mapped_column(
        String(10), default="sent", comment="消息方向: sent/received"
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(
        String(20), default="text", comment="消息类型: text/image/file/audio"
    )
    file_name: Mapped[str | None] = mapped_column(
        String(255), nullable=True, comment="文件名"
    )
    file_size: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="文件大小"
    )
    scene: Mapped[str] = mapped_column(
        String(20), default="private", comment="场景: private/group"
    )
    status: Mapped[str] = mapped_column(
        String(20), default="sent", comment="消息状态: sending/sent/read/failed"
    )
    display_time: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="显示时间 (如 10:30, 昨天)"
    )

    # 关联
    sender: Mapped["User"] = relationship("User", lazy="selectin")
