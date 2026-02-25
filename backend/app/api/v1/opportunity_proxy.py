"""
前端「我的商机」页面代理路由
前端 opportunity/index.tsx 请求路径:
  GET /api/v1/opportunity/todo       — 待办工单
  GET /api/v1/opportunity/orders     — 我的订单
  GET /api/v1/opportunity/approvals  — 待办审批
  GET /api/v1/opportunity/list       — 商机列表

权限对齐 seed.py — 使用 get_current_user (所有登录用户可访问自己的数据)
"""
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.task import Task
from app.models.order import Order
from app.models.opportunity import Opportunity
from app.schemas.response import success_response

router = APIRouter(prefix="/opportunity", tags=["我的商机"])


@router.get("/todo")
async def get_todo(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """待办工单"""
    result = await db.execute(
        select(Task).where(
            Task.user_id == current_user.id,
            Task.status == "pending",
            Task.is_deleted == False
        )
    )
    items = result.scalars().all()
    data = [{
        "id": i.id,
        "type": i.type,
        "content": i.content,
        "deadline": i.deadline,
        "status": i.status,
        "createdAt": i.created_at.isoformat() if i.created_at else "",
    } for i in items]
    return success_response(data=data)


@router.get("/orders")
async def get_my_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """我的订单 (近期)"""
    result = await db.execute(
        select(Order)
        .where(Order.created_by == current_user.id, Order.is_deleted == False)
        .order_by(Order.created_at.desc())
        .limit(20)
    )
    items = result.scalars().all()
    data = [{
        "id": i.order_no,
        "customerName": i.customer_name,
        "amount": i.total_amount,
        "status": "completed" if i.status in ["signed", "completed"] else "pending",
        "createdAt": i.created_at.strftime("%Y-%m-%d") if i.created_at else "",
    } for i in items]
    return success_response(data=data)


@router.get("/approvals")
async def get_approvals(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """待办审批"""
    filters = [Order.is_deleted == False]
    if current_user.role == "sales_manager":
        filters.append(Order.status == "manager_pending")
    elif current_user.role == "finance":
        filters.append(Order.status == "finance_pending")
    elif current_user.role == "admin":
        filters.append(Order.status.in_(["manager_pending", "finance_pending"]))
    else:
        # 普通销售没有审批，返回空
        return success_response(data=[])

    result = await db.execute(select(Order).where(*filters).order_by(Order.created_at.desc()).limit(20))
    items = result.scalars().all()
    data = [{
        "id": i.id,
        "type": "订单审批",
        "content": f"订单 {i.order_no} 需要审批",
        "status": "pending",
        "createdAt": i.created_at.strftime("%Y-%m-%d") if i.created_at else "",
    } for i in items]
    return success_response(data=data)


@router.get("/list")
async def get_opportunity_list(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """商机列表"""
    filters = [Opportunity.is_deleted == False]
    if current_user.role == "sales":
        filters.append(Opportunity.owner_id == current_user.id)

    result = await db.execute(
        select(Opportunity).where(*filters).order_by(Opportunity.created_at.desc()).limit(50)
    )
    items = result.scalars().all()
    data = [{
        "id": i.id,
        "customerName": i.customer_name,
        "source": i.source,
        "intention": i.intention,
        "estimatedAmount": i.estimated_amount,
        "status": i.status,
        "createdAt": i.created_at.strftime("%Y-%m-%d") if i.created_at else "",
    } for i in items]
    return success_response(data=data)
