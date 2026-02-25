"""
IM 会话/群组 ORM 模型
对齐前端 chat/index.tsx 中的 Conversation 接口
"""
from sqlalchemy import String, Boolean, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY

from app.db.base import Base, AuditMixin


class IMConversation(Base, AuditMixin):
    """
    IM 会话 (私聊 / 群聊)
    type: single / group
    """
    __tablename__ = "im_conversations"

    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="会话名称")
    type: Mapped[str] = mapped_column(String(20), default="single", comment="类型: single/group")
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="头像URL")
    avatar_label: Mapped[str | None] = mapped_column(String(10), nullable=True, comment="头像文字")
    avatar_color: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="头像背景色")
    last_message: Mapped[str | None] = mapped_column(Text, nullable=True, comment="最后一条消息")
    last_time: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="最后消息时间")
    # 群组成员 ID 列表 (JSON 格式存储)
    member_ids: Mapped[list[str] | None] = mapped_column(PG_ARRAY(String), nullable=True, comment="成员ID列表")
    # 关联的用户 ID (私聊时使用 — 对方用户)
    peer_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True, comment="私聊对方用户ID")
    # 会话创建者 ID
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True, comment="创建者用户ID")
    department: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="所属部门")
    employee_id: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="工号")
