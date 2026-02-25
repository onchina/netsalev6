"""
业绩目标路由
权限对齐 seed.py — operation:channel (类型管理页面下的业绩目标 Tab)
"""
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, require_permission
from app.db.session import get_db
from app.models.user import User
from app.models.sales_target import SalesTarget
from app.schemas.response import success_response

router = APIRouter(prefix="/sales-targets", tags=["业绩管理"])

@router.get("")
async def list_targets(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("operation:channel"))],
):
    """获取所有业绩目标"""
    result = await db.execute(select(SalesTarget).where(SalesTarget.is_deleted == False))
    items = result.scalars().all()

    data = []
    for i in items:
        data.append({
            "id": i.id,
            "userId": i.user_id,
            "name": i.user.name if i.user else "未知",
            "role": i.user.role if i.user else "未知",
            "monthTarget": i.amount if i.type == "month" else 0,
            "quarterTarget": i.amount * 3 if i.type == "month" else (i.amount if i.type == "quarter" else 0),
            "yearTarget": i.amount * 12 if i.type == "month" else (i.amount if i.type == "year" else 0),
            "currentAmount": 0  # 实际应从 Order 表统计
        })
    return success_response(data=data)
