from sqlalchemy import String, Text, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, AuditMixin

class Task(Base, AuditMixin):
    """
    待办任务
    """
    __tablename__ = "tasks"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, comment="执行人ID")
    type: Mapped[str] = mapped_column(String(50), nullable=False, comment="任务类型 (如: 回访/跟进)")
    content: Mapped[str] = mapped_column(Text, nullable=False, comment="任务内容")
    status: Mapped[str] = mapped_column(String(20), default="pending", comment="状态 (pending/completed/cancelled)")
    deadline: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="截止日期 (YYYY-MM-DD)")

    # 关联
    user: Mapped["User"] = relationship("User", lazy="selectin")
