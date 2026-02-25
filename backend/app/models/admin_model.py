from sqlalchemy import String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, AuditMixin

class Department(Base, AuditMixin):
    """部门管理模型"""
    __tablename__ = "departments"

    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="部门名称")
    code: Mapped[str] = mapped_column(String(50), nullable=False, comment="部门编码")
    manager: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="负责人")
    member_count: Mapped[int] = mapped_column(Integer, default=0, comment="成员数量")
    
    show_in_performance_v1: Mapped[bool] = mapped_column(Boolean, default=True)
    show_in_performance_v2: Mapped[bool] = mapped_column(Boolean, default=True)
    show_in_ranking: Mapped[bool] = mapped_column(Boolean, default=True)
    show_in_analytics: Mapped[bool] = mapped_column(Boolean, default=True)


class IpWhitelist(Base, AuditMixin):
    """IP白名单模型"""
    __tablename__ = "ip_whitelists"

    ip: Mapped[str] = mapped_column(String(50), nullable=False, comment="IP或CIDR地址")
    remark: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="备注")
    status: Mapped[bool] = mapped_column(Boolean, default=True, comment="启用状态")


class LogisticsCompany(Base, AuditMixin):
    """物流公司配置模型"""
    __tablename__ = "logistics_companies"

    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="公司名称")
    code: Mapped[str] = mapped_column(String(50), nullable=False, comment="公司编码")
    status: Mapped[bool] = mapped_column(Boolean, default=True, comment="启用状态")


class SensitiveWord(Base, AuditMixin):
    """敏感词库模型"""
    __tablename__ = "sensitive_words"

    word: Mapped[str] = mapped_column(String(100), nullable=False, comment="敏感词")
    type: Mapped[str] = mapped_column(String(50), nullable=False, comment="违规类型")
    level: Mapped[str] = mapped_column(String(20), nullable=False, comment="告警等级")
