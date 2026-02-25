from sqlalchemy import String, Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, AuditMixin

class Stock(Base, AuditMixin):
    """
    库存明细模型 (具体到每个仓库每个商品)
    """
    __tablename__ = "stocks"

    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False)
    warehouse_id: Mapped[str] = mapped_column(String(36), ForeignKey("warehouses.id"), nullable=False)
    
    current: Mapped[int] = mapped_column(Integer, default=0, comment="当前库存")
    available: Mapped[int] = mapped_column(Integer, default=0, comment="可用库存")
    warning_value: Mapped[int] = mapped_column(Integer, default=50, comment="库存预警值")

    # 关联
    product: Mapped["Product"] = relationship("Product", lazy="selectin")
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", lazy="selectin")

class StockLog(Base, AuditMixin):
    """
    出入库记录模型
    """
    __tablename__ = "stock_logs"

    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False)
    warehouse_id: Mapped[str] = mapped_column(String(36), ForeignKey("warehouses.id"), nullable=False)
    
    type: Mapped[str] = mapped_column(String(20), comment="操作类型: in/out/transfer/return")
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, comment="变动数量")
    before_stock: Mapped[int] = mapped_column(Integer, default=0, comment="操作前库存")
    after_stock: Mapped[int] = mapped_column(Integer, default=0, comment="操作后库存")
    unit_price: Mapped[float | None] = mapped_column(Float, nullable=True, comment="入库单价")
    
    related_no: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="关联单号")
    target_warehouse_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("warehouses.id"), nullable=True, comment="目标仓库ID(调库时必填)")
    
    operator_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, comment="操作人ID")
    remark: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="备注")
    
    # 关联
    product: Mapped["Product"] = relationship("Product", lazy="selectin")
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", foreign_keys=[warehouse_id], lazy="selectin")
    target_warehouse: Mapped["Warehouse | None"] = relationship("Warehouse", foreign_keys=[target_warehouse_id], lazy="selectin")
    operator: Mapped["User"] = relationship("User", lazy="selectin")
