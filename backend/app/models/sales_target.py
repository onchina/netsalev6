from sqlalchemy import String, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, AuditMixin

class SalesTarget(Base, AuditMixin):
    """
    业绩目标
    """
    __tablename__ = "sales_targets"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, comment="归属人ID")
    year: Mapped[int] = mapped_column(Integer, nullable=False, comment="年度")
    month: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="月份 (如果为None则为年级/季度目标?)")
    quarter: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="季度 (1/2/3/4)")
    
    amount: Mapped[float] = mapped_column(Float, default=0, comment="目标金额")
    type: Mapped[str] = mapped_column(String(20), default="month", comment="目标类型 (month/quarter/year)")

    # 关联
    user: Mapped["User"] = relationship("User", lazy="selectin")
