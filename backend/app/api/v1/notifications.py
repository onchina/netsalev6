"""
通知中心路由
GET    /api/v1/notifications              — 通知列表
GET    /api/v1/notifications/unread-count  — 未读计数 (角标数据)
POST   /api/v1/notifications/{id}/read     — 标记单条已读
POST   /api/v1/notifications/read-all      — 全部标记已读

权限对齐 seed.py — 使用 get_current_user 直接鉴权 (所有登录用户均可使用通知功能)
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.api.deps import get_current_user
from app.crud.crud_instances import crud_notification
from app.db.session import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut, NotificationUpdate
from app.schemas.response import success_response, paginated_response

router = APIRouter(prefix="/notifications", tags=["消息中心"])

@router.get("")
async def list_notifications(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = 1,
    page_size: int = 20,
    only_unread: bool = False,
):
    """获取通知列表"""
    filters = [Notification.user_id == current_user.id, Notification.is_deleted == False]
    if only_unread:
        filters.append(Notification.read == False)

    items, total = await crud_notification.get_multi(
        db, page=page, page_size=page_size, filters=filters
    )

    data = [NotificationOut(
        id=i.id,
        title=i.title,
        content=i.content,
        type=i.type,
        read=i.read,
        userId=i.user_id,
        createdAt=i.created_at.isoformat()
    ).model_dump() for i in items]

    return paginated_response(data=data, total=total, page=page, page_size=page_size)

@router.get("/unread-count")
async def get_unread_count(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """获取未读通知数量 — 前端角标功能使用"""
    query = select(func.count()).where(
        Notification.user_id == current_user.id,
        Notification.read == False,
        Notification.is_deleted == False
    )
    result = await db.execute(query)
    count = result.scalar()
    return success_response(data={"count": count})

@router.post("/{id}/read")
async def mark_as_read(
    id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """标记单条通知为已读"""
    item = await crud_notification.get(db, id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(404, "通知未找到")

    await crud_notification.update(db, db_obj=item, obj_in={"read": True})
    return success_response(message="已标记为已读")

@router.post("/read-all")
async def mark_all_as_read(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """全部标记为已读"""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.read == False)
        .values(read=True)
    )
    await db.commit()
    return success_response(message="已全部标记为已读")
