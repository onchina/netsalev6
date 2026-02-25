"""
用户管理路由
GET    /api/v1/users          — 用户列表
POST   /api/v1/users          — 创建用户
GET    /api/v1/users/me       — 当前用户信息
GET    /api/v1/users/{id}     — 用户详情
PATCH  /api/v1/users/{id}     — 部分更新用户
PUT    /api/v1/users/{id}     — 全量更新用户
DELETE /api/v1/users/{id}     — 删除用户

权限对齐 seed.py — 使用 settings:backend (后台设置) 或 get_current_user 直接鉴权
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.security import hash_password
from app.crud.crud_instances import crud_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.schemas.response import success_response, paginated_response

router = APIRouter(prefix="/users", tags=["用户管理"])



def _mask_password(pwd: str | None) -> str | None:
    """密码脱敏：保留首2尾2，中间用星号"""
    if not pwd:
        return None
    if len(pwd) <= 4:
        return pwd[0] + "***" + pwd[-1]
    return pwd[:2] + "*" * (len(pwd) - 4) + pwd[-2:]


def _user_to_out(user: User) -> dict:
    """将 ORM User 转为前端 User 接口格式"""
    # 注册日期 — 从 created_at 取年月日
    reg_date = ""
    if user.created_at:
        reg_date = user.created_at.strftime("%Y-%m-%d")
    return UserOut(
        id=user.id,
        name=user.name,
        username=user.username,
        maskedPassword=_mask_password(getattr(user, "plain_password", None)),
        role=user.role,
        roleId=getattr(user, "role_id", None),
        roleLabel=user.role_label,
        employeeNo=user.employee_no,
        email=user.email,
        phone=user.phone,
        avatar=user.avatar,
        department=user.department,
        registrationDate=reg_date,
        lastActiveTime=getattr(user, "last_active_time", None) or "",
        status="active" if getattr(user, "is_active", True) else "disabled",
        permissionList=user.permission_list,
    ).model_dump()


@router.get("/me")
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    """获取当前登录用户信息"""
    return success_response(data=_user_to_out(current_user))


@router.get("")
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    page: int = 1,
    page_size: int = 20,
):
    """用户列表 (带分页) — 所有已登录用户均可查看成员列表"""
    users, total = await crud_user.get_multi(db, page=page, page_size=page_size)
    data = [_user_to_out(u) for u in users]
    return paginated_response(data=data, total=total, page=page, page_size=page_size)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))],
):
    """创建用户"""
    user = await crud_user.create(
        db,
        obj_in=body,
        hashed_password=hash_password(body.password),
        plain_password=body.password,
    )
    return success_response(data=_user_to_out(user), message="创建成功")


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    """用户详情"""
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return success_response(data=_user_to_out(user))


@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    body: UserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))],
):
    """部分更新用户"""
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    updated = await crud_user.update(db, db_obj=user, obj_in=body)
    return success_response(data=_user_to_out(updated), message="更新成功")


@router.put("/{user_id}")
async def put_user(
    user_id: str,
    body: UserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))],
):
    """PUT 全量更新用户"""
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    updated = await crud_user.update(db, db_obj=user, obj_in=body)
    return success_response(data=_user_to_out(updated), message="更新成功")


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))],
):
    """删除用户 (软删除)"""
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if user.username == "admin":
        raise HTTPException(status_code=403, detail="系统管理员账号禁止删除")
    deleted = await crud_user.soft_delete(db, id=user_id)
    return success_response(message="删除成功")


class PasswordChangeRequest(BaseModel):
    """修改密码请求"""
    newPassword: str


@router.put("/{user_id}/password")
async def change_password(
    user_id: str,
    body: PasswordChangeRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))],
):
    """管理员重置用户密码"""
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.hashed_password = hash_password(body.newPassword)
    user.plain_password = body.newPassword
    await db.commit()
    return success_response(message="密码修改成功")


class StatusChangeRequest(BaseModel):
    """状态切换请求"""
    isActive: bool


@router.put("/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    body: StatusChangeRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))],
):
    """启用/禁用用户 — 禁用时踢掉在线 WebSocket 连接"""
    user = await crud_user.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    user.is_active = body.isActive
    await db.commit()

    # 禁用时踢下线
    if not body.isActive:
        from app.services.ws_manager import manager
        await manager.kick_user(user_id, reason="account_disabled")

    action = "启用" if body.isActive else "禁用"
    return success_response(message=f"用户已{action}")
