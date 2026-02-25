"""
商品 ORM 模型
对齐前端 types/index.ts: Product
"""
from sqlalchemy import String, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, AuditMixin


class Product(Base, AuditMixin):
    """
    商品表
    字段对齐: id, name, image, spec, price, cost, status, stock
    """
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="商品名称")
    image: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="商品图片URL")
    spec: Mapped[str] = mapped_column(String(100), nullable=False, comment="规格")
    price: Mapped[float] = mapped_column(Float, nullable=False, comment="售价")
    cost: Mapped[float | None] = mapped_column(Float, nullable=True, comment="成本价")
    department: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="所属部门")
    sort: Mapped[int] = mapped_column(Integer, default=0, comment="排序序号")
    status: Mapped[str] = mapped_column(String(10), default="on", comment="上架状态: on/off")
    stock: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="库存数量")
