from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, AuditMixin

class SystemSetting(Base, AuditMixin):
    """
    系统配置模型
    """
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="配置键")
    value: Mapped[str] = mapped_column(Text, nullable=False, comment="配置值 (JSON)")
    group: Mapped[str] = mapped_column(String(50), default="global", comment="配置分组")
    type: Mapped[str] = mapped_column(String(20), default="string", comment="数据类型")
    description: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="描述")
