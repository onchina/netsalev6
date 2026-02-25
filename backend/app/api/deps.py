"""
API 依赖注入模块
对齐 BACKEND_CONTEXT.md § 4.5 认证与权限
- get_current_user: 从 Authorization 头解析 JWT 获取当前用户
- require_permission: 细粒度权限检查 resource:action
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """从 JWT Token 中解析用户身份"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(User).where(User.id == user_id, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


def require_permission(permission_code: str):
    """
    权限依赖注入工厂
    用法: Depends(require_permission('order:create'))
    admin 角色拥有所有权限
    """
    async def _check(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role == "admin":
            return current_user
        if permission_code not in current_user.permission_list:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足: 需要 '{permission_code}' 权限",
            )
        return current_user
    return _check


def require_roles(allowed_roles: list[str]):
    """
    角色依赖注入工厂
    用法: Depends(require_roles(['admin', 'sales_manager']))
    """
    async def _check(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"角色不足: 需要 {allowed_roles} 角色",
            )
        return current_user
    return _check
