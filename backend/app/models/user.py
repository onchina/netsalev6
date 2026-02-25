"""
用户 / 角色 / 权限 ORM 模型
对齐前端 types/index.ts: User, UserRole
对齐 BACKEND_CONTEXT.md § 4.5 RBAC
"""
from sqlalchemy import String, Boolean, ForeignKey, Table, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, AuditMixin


# 角色-权限多对多关联表
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", String(36), ForeignKey("permissions.id"), primary_key=True),
)


class Permission(Base, AuditMixin):
    """权限标识 — 格式: resource:action (如 order:create)"""
    __tablename__ = "permissions"

    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="权限标识符")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="权限名称")
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Role(Base, AuditMixin):
    """角色模型 — admin 为系统固定角色，不可删除"""
    __tablename__ = "roles"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, comment="角色编码")
    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="角色显示名")
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, comment="系统内置角色不可删除")

    permissions: Mapped[list["Permission"]] = relationship(secondary=role_permissions, lazy="selectin")
    users: Mapped[list["User"]] = relationship(back_populates="role_obj", lazy="selectin")


class User(Base, AuditMixin):
    """
    用户/员工表
    对齐前端 User 接口: id, name, role, roleLabel, employeeNo, email, phone, avatar, permissionList
    """
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="姓名")
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, comment="登录用户名")
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    plain_password: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="原始密码(仅演示脱敏展示用)")
    employee_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, comment="工号")
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    department: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="部门")
    last_active_time: Mapped[str | None] = mapped_column(String(30), nullable=True, comment="上次在线时间")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否启用")

    # 外键关联角色
    role_id: Mapped[str] = mapped_column(String(36), ForeignKey("roles.id"), nullable=False)
    role_obj: Mapped["Role"] = relationship(back_populates="users", lazy="selectin")

    @property
    def role(self) -> str:
        """对齐前端 user.role 字段 — 返回角色 code"""
        return self.role_obj.code if self.role_obj else ""

    @property
    def role_label(self) -> str:
        """对齐前端 user.roleLabel 字段 — 返回角色显示名"""
        return self.role_obj.name if self.role_obj else ""

    @property
    def permission_list(self) -> list[str]:
        """对齐前端 user.permissionList — 返回所有权限标识符列表"""
        if self.role_obj:
            if self.role_obj.code == "admin":
                return ["*"]
            if self.role_obj.permissions:
                return [p.code for p in self.role_obj.permissions]
        return []
