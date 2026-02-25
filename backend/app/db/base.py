"""
SQLAlchemy 声明式基类 + 审计混入
对齐 BACKEND_CONTEXT.md § 4.3 — 所有模型必须包含 created_at, updated_at, is_deleted
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """所有 ORM 模型的根基类"""
    pass


class AuditMixin:
    """审计字段混入 — 对齐 § 4.3"""
    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
