from sqlalchemy import String, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, AuditMixin

class Warehouse(Base, AuditMixin):
    """
    仓库模型
    """
    __tablename__ = "warehouses"

    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="仓库名称")
    address: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="地址")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否默认仓库")
