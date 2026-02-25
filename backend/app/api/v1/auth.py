"""
认证路由 — POST /api/v1/auth/login
对齐 BACKEND_CONTEXT.md § 4.5 认证流程
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password, create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, UserOut
from app.schemas.response import success_response

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/login")
async def login(
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    用户登录
    - 校验用户名密码
    - 签发 JWT Token (payload: sub=user_id, role=role_code)
    - 返回 Token + User 信息 — 对齐前端 useUserStore.login(user)
    """
    result = await db.execute(
        select(User).where(User.username == body.username, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )

    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用，请联系管理员",
        )

    token = create_access_token(subject=user.id, role=user.role)

    user_out = UserOut(
        id=user.id,
        name=user.name,
        role=user.role,
        roleLabel=user.role_label,
        employeeNo=user.employee_no,
        email=user.email,
        phone=user.phone,
        avatar=user.avatar,
        permissionList=user.permission_list,
    )

    return success_response(data={"token": token, "user": user_out.model_dump()})
