from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, AuditMixin

class AuditLog(Base, AuditMixin):
    """
    审计日志 (操作日志)
    """
    __tablename__ = "audit_logs"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False, comment="操作动作 (如: 创建订单)")
    target: Mapped[str] = mapped_column(String(100), nullable=True, comment="操作对象 (如: 订单ID/编号)")
    type: Mapped[str] = mapped_column(String(50), nullable=False, comment="操作类型 (如: 订单操作)")
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True, comment="IP地址")
    details: Mapped[str | None] = mapped_column(Text, nullable=True, comment="详细信息 (JSON)")

    # 关联
    user: Mapped["User"] = relationship("User", lazy="selectin")
