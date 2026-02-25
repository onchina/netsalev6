"""
用户 / 认证 Pydantic Schema
对齐前端 types/index.ts: User 接口
"""
from pydantic import BaseModel, computed_field


# ========== 认证 ==========

class LoginRequest(BaseModel):
    """登录请求 — POST /api/v1/auth/login"""
    username: str
    password: str


class TokenResponse(BaseModel):
    """登录成功响应"""
    token: str
    user: "UserOut"


# ========== 用户 Schema ==========

class UserCreate(BaseModel):
    """创建用户请求"""
    name: str
    username: str
    password: str
    employeeNo: str
    email: str | None = None
    phone: str | None = None
    avatar: str | None = None
    department: str | None = None
    roleId: str


class UserUpdate(BaseModel):
    """更新用户请求"""
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    avatar: str | None = None
    department: str | None = None
    roleId: str | None = None


class UserOut(BaseModel):
    """
    用户响应 — 严格对齐前端 User 接口
    id, name, role, roleLabel, employeeNo, email, phone, avatar, permissionList
    """
    id: str
    name: str
    username: str | None = None
    maskedPassword: str | None = None
    role: str
    roleId: str | None = None
    roleLabel: str
    employeeNo: str
    email: str | None = None
    phone: str | None = None
    avatar: str | None = None
    department: str | None = None
    registrationDate: str | None = None
    lastActiveTime: str | None = None
    status: str = "active"
    permissionList: list[str] = []

    @computed_field
    @property
    def permissions(self) -> dict[str, bool]:
        """
        动态计算前端所需的 boolean 权限标志位
        """
        p_set = set(self.permissionList)
        is_admin = '*' in p_set

        def check(code: str) -> bool:
            if is_admin: return True
            if code in p_set: return True
            # 支持通配符父级，如 user:* 匹配 user:list
            parts = code.split(':')
            if len(parts) > 1 and f"{parts[0]}:*" in p_set:
                return True
            return False

        return {
            "canAccessSettings": check("settings:view") or check("system:settings"),
            "canAccessAudit": check("order:audit") or check("finance:audit"),
            "canAccessAnalytics": check("analytics:view") or check("office:analytics"),
            "canAccessDashboard": check("office:dashboard"),
            "canManageEmployees": check("user:list") or check("settings:employee") or check("user:create"),
        }

    class Config:
        from_attributes = True


# 解决循环引用
TokenResponse.model_rebuild()


# ========== 角色 Schema ==========

class RoleCreate(BaseModel):
    name: str
    code: str
    permissionIds: list[str] = []


class RoleUpdate(BaseModel):
    name: str | None = None
    permissionIds: list[str] | None = None


class RoleOut(BaseModel):
    id: str
    code: str
    name: str
    isSystem: bool
    permissions: list["PermissionOut"] = []

    class Config:
        from_attributes = True


# ========== 权限 Schema ==========

class PermissionOut(BaseModel):
    id: str
    code: str
    name: str

    class Config:
        from_attributes = True


RoleOut.model_rebuild()
