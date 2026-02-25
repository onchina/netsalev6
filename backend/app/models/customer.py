"""
客户 ORM 模型
对齐前端 types/index.ts: Customer
"""
from sqlalchemy import String, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, AuditMixin


class Customer(Base, AuditMixin):
    """
    客户表
    字段严格对齐前端 Customer: id, name, phone, address, height, age, weight, channel, entryDate, ownerId
    """
    __tablename__ = "customers"

    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="客户姓名")
    phone: Mapped[str] = mapped_column(String(20), nullable=False, comment="手机号")
    address: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="地址")
    height: Mapped[float | None] = mapped_column(Float, nullable=True, comment="身高(cm)")
    age: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="年龄")
    weight: Mapped[float | None] = mapped_column(Float, nullable=True, comment="体重(kg)")
    customer_type: Mapped[str | None] = mapped_column(String(20), default="new", comment="客户类型: new/old/vip/repurchase")
    channel: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="进线渠道 code")
    entry_date: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="进线日期")
    owner_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True, comment="归属销售ID"
    )

    # 关联归属人
    owner: Mapped["User"] = relationship("User", lazy="selectin")
