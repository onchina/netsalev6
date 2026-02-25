"""
订单 / 订单明细 ORM 模型
对齐前端 types/index.ts: Order, OrderItem
"""
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, AuditMixin


class OrderItem(Base, AuditMixin):
    """
    订单明细行
    对齐前端 OrderItem: productId, productName, spec, price, quantity, subtotal
    """
    __tablename__ = "order_items"

    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(100), nullable=False)
    spec: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)


class Order(Base, AuditMixin):
    """
    订单表
    对齐前端 Order: id, orderNo, customerId, customerName, orderType, paymentMethod,
                     shipNow, items, totalAmount, paidAmount, codAmount, paidRatio,
                     remark, commission, status, createdBy
    状态枚举: draft | pending | approved | rejected | shipped | completed | cancelled
    """
    __tablename__ = "orders"

    order_no: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, comment="订单编号")
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("customers.id"), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(50), nullable=False, comment="冗余客户姓名")
    order_type: Mapped[str] = mapped_column(String(20), nullable=False, comment="订单类型 code")
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False, comment="支付方式 code")
    ship_now: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否立即发货")
    total_amount: Mapped[float] = mapped_column(Float, default=0, comment="订单总额")
    paid_amount: Mapped[float] = mapped_column(Float, default=0, comment="已付金额")
    cod_amount: Mapped[float] = mapped_column(Float, default=0, comment="货到付款金额")
    paid_ratio: Mapped[float] = mapped_column(Float, default=0, comment="已付比例")
    remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
    commission: Mapped[float | None] = mapped_column(Float, nullable=True, comment="佣金")
    actual_price: Mapped[float | None] = mapped_column(Float, nullable=True, comment="实际成交价")
    apply_reason: Mapped[str | None] = mapped_column(Text, nullable=True, comment="申请原因/备注")
    
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="发货时间")
    signed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="签收时间")
    tracking_no: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="快递单号")
    courier_company: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="快递公司")

    status: Mapped[str] = mapped_column(
        String(30), default="draft",
        comment="状态: draft/manager_pending/finance_pending/approved/shipped/signed/completed/manager_rejected/finance_rejected/voided/cancelled"
    )
    created_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, comment="创建人ID"
    )

    # 关联明细行
    items: Mapped[list["OrderItem"]] = relationship(lazy="selectin")
    
    # 关联创建者 (销售)
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by], lazy="selectin")
