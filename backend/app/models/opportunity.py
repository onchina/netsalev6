from sqlalchemy import String, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, AuditMixin

class Opportunity(Base, AuditMixin):
    """
    商机管理
    """
    __tablename__ = "opportunities"

    customer_name: Mapped[str] = mapped_column(String(50), nullable=False, comment="客户姓名")
    source: Mapped[str] = mapped_column(String(50), nullable=True, comment="来源 (如: 抖音)")
    intention: Mapped[str] = mapped_column(String(20), default="中", comment="意向度 (高/中/低)")
    estimated_amount: Mapped[float] = mapped_column(Float, default=0, comment="预估金额")
    status: Mapped[str] = mapped_column(String(20), default="new", comment="状态 (new/following/converted/closed)")
    remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, comment="归属人ID")

    # 关联
    owner: Mapped["User"] = relationship("User", lazy="selectin")
