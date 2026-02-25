"""
售后 ORM 模型
对齐前端 types/index.ts: AfterSale
"""
from sqlalchemy import String, ForeignKey, Text, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY

from app.db.base import Base, AuditMixin


class AfterSale(Base, AuditMixin):
    """
    售后单
    对齐前端 AfterSale: id, orderId, orderNo, customerId, customerName,
                         type, reason, images, status
    类型枚举: refund | return | exchange
    状态枚举: pending | approved | rejected | completed
    """
    __tablename__ = "after_sales"

    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id"), nullable=False)
    order_no: Mapped[str] = mapped_column(String(30), nullable=False, comment="冗余订单编号")
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("customers.id"), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(50), nullable=False, comment="冗余客户姓名")
    type: Mapped[str] = mapped_column(String(20), nullable=False, comment="售后类型: refund/return/exchange")
    reason: Mapped[str] = mapped_column(Text, nullable=False, comment="售后原因")
    images: Mapped[list[str] | None] = mapped_column(PG_ARRAY(String), nullable=True, comment="图片URL数组")
    status: Mapped[str] = mapped_column(
        String(20), default="pending",
        comment="状态: pending/approved/rejected/completed"
    )
