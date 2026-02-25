"""
角标计数 API — GET /api/v1/badges
返回各模块待处理数据条数，供前端侧栏、头像角标使用
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.after_sale import AfterSale
from app.models.notification import Notification
from app.models.im_message import IMMessage
from app.schemas.response import success_response

router = APIRouter(prefix="/badges", tags=["角标"])


@router.get("")
async def get_badge_counts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """获取当前用户可见的各模块角标计数"""

    # 订单各状态统计
    order_result = await db.execute(
        select(
            Order.status,
            func.count().label("cnt"),
        )
        .where(Order.is_deleted == False)
        .group_by(Order.status)
    )
    order_counts = {row.status: row.cnt for row in order_result}

    # 审核订单 = manager_pending + finance_pending
    audit = order_counts.get("manager_pending", 0) + order_counts.get("finance_pending", 0)
    # 待发货 = approved
    pending = order_counts.get("approved", 0)
    # 已发货 = shipped
    shipped = order_counts.get("shipped", 0)

    # 售后订单 (pending 状态)
    aftersale_result = await db.execute(
        select(func.count())
        .select_from(AfterSale)
        .where(AfterSale.is_deleted == False, AfterSale.status == "pending")
    )
    aftersale = aftersale_result.scalar() or 0

    # 未读通知数
    notification_count = 0
    try:
        notify_result = await db.execute(
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.is_deleted == False,
                Notification.user_id == current_user.id,
                Notification.read == False,
            )
        )
        notification_count = notify_result.scalar() or 0
    except Exception:
        pass  # 表可能不存在

    # 未读 IM 消息数 (发给当前用户且未读的)
    chat_count = 0
    try:
        chat_result = await db.execute(
            select(func.count())
            .select_from(IMMessage)
            .where(
                IMMessage.is_deleted == False,
                IMMessage.receiver_id == current_user.id,
                IMMessage.status != "read",
            )
        )
        chat_count = chat_result.scalar() or 0
    except Exception:
        pass

    return success_response(data={
        "audit": audit,
        "pending": pending,
        "shipped": shipped,
        "aftersale": aftersale,
        "notifications": notification_count,
        "chat": chat_count,
    })
