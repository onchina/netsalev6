from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableList, MutableDict

from app.db.base import Base, AuditMixin

class DailyReport(Base, AuditMixin):
    """
    工作日报模型
    对齐前端 DailyReport 接口: id, date, status, todayWork, tomorrowPlan, problems, attachments
    """
    __tablename__ = "daily_reports"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, comment="填报人")
    
    date: Mapped[str] = mapped_column(String(20), nullable=False, comment="日报日期 (YYYY-MM-DD)")
    status: Mapped[str] = mapped_column(String(20), default="draft", comment="状态: draft/submitted")
    
    today_work: Mapped[str] = mapped_column(Text, nullable=False, default="", comment="今日工作内容")
    tomorrow_plan: Mapped[str] = mapped_column(Text, nullable=False, default="", comment="明日工作计划")
    problems: Mapped[str] = mapped_column(Text, nullable=False, default="", comment="问题与反馈")
    
    # 将电子表格附件以 JSON 格式存储 (由于 SQLite/MySQL 支持 JSON，PostgreSQL 支持 JSONB，我们在通用侧可直接用 JSON 类型处理)
    # 为兼容，如果使用的是 PostgreSQL，可以使用 JSONB。此处为了简单通用，直接存为 JSON
    from sqlalchemy import JSON
    attachments: Mapped[list[dict] | None] = mapped_column(MutableList.as_mutable(JSON), nullable=True, default=list, comment="电子表格附件及数据")

    user: Mapped["User"] = relationship("User", lazy="selectin")
