"""
日志列表路由
GET /api/v1/audit-logs — 操作日志列表
GET /api/v1/logs       — 操作日志列表 (别名, 前端 log-list.tsx 使用 /logs)

权限对齐 seed.py — operation:logs
"""
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import require_permission
from app.db.session import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogOut
from app.schemas.response import success_response, paginated_response

router = APIRouter(tags=["运维管理"])


async def _list_logs(db: AsyncSession, page: int, page_size: int, user_name: str | None, log_type: str | None):
    """操作日志查询公共逻辑"""
    query = select(AuditLog)

    if user_name:
        user_res = await db.execute(select(User.id).where(User.name.contains(user_name)))
        uids = user_res.scalars().all()
        query = query.where(AuditLog.user_id.in_(uids))

    if log_type:
        query = query.where(AuditLog.type == log_type)

    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_res.scalar()

    query = query.order_by(AuditLog.created_at.desc()).offset((page-1)*page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    data = []
    for i in items:
        data.append(AuditLogOut(
            id=i.id,
            user_id=i.user_id,
            user_name=i.user.name if i.user else "未知",
            action=i.action,
            target=i.target,
            type=i.type,
            createdAt=i.created_at.isoformat(),
            details=i.details
        ).model_dump())

    return data, total


@router.get("/audit-logs")
async def list_audit_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("operation:logs"))],
    page: int = 1,
    page_size: int = 20,
    user_name: str | None = None,
    log_type: str | None = None,
):
    """操作日志列表"""
    data, total = await _list_logs(db, page, page_size, user_name, log_type)
    return paginated_response(data=data, total=total, page=page, page_size=page_size)


@router.get("/logs")
async def list_logs_alias(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("operation:logs"))],
    page: int = 1,
    page_size: int = 20,
    user_name: str | None = None,
    log_type: str | None = None,
):
    """操作日志列表 (别名路径, 前端 log-list.tsx 请求 /logs)"""
    data, total = await _list_logs(db, page, page_size, user_name, log_type)
    return paginated_response(data=data, total=total, page=page, page_size=page_size)
