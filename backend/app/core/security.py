"""
安全模块 — JWT Token 生成 / 验证 / 密码哈希
对齐 BACKEND_CONTEXT.md § 4.5 认证流程
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

# 密码哈希
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, role: str, extra: dict[str, Any] | None = None) -> str:
    """签发 JWT，Payload 包含 sub (user_id), role — 对齐 § 4.5"""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": subject, "role": role, "exp": expire}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """解析 JWT，失败时抛出 JWTError"""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
