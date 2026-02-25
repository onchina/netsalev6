from sqlalchemy import String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, AuditMixin

class Dictionary(Base, AuditMixin):
    """
    字典管理 (类型管理)
    用于管理: 进线渠道, 客户类型, 订单类型, 支付类型, 判责类型
    """
    __tablename__ = "dictionaries"

    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="名称")
    code: Mapped[str] = mapped_column(String(50), nullable=False, comment="编码")
    group: Mapped[str] = mapped_column(String(50), nullable=False, comment="分组 (channel/customer_type/order_type/payment_method/responsibility_type)")
    color: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="标签颜色")
    sort: Mapped[int] = mapped_column(Integer, default=0, comment="排序")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否启用")
