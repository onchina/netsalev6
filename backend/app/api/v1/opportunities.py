"""
商机管理路由
GET    /api/v1/opportunities           — 商机列表 (标准路径)
POST   /api/v1/opportunities           — 创建商机

# 前端 opportunity/index.tsx 使用的路径:
GET    /api/v1/opportunity/todo        — 待办工单
GET    /api/v1/opportunity/orders      — 我的订单
GET    /api/v1/opportunity/approvals   — 待办审批
GET    /api/v1/opportunity/list        — 商机列表

权限对齐 seed.py — customer:list (销售客户管理范畴)
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, require_permission
from app.crud.crud_instances import crud_opportunity
from app.db.session import get_db
from app.models.user import User
from app.models.opportunity import Opportunity
from app.models.order import Order
from app.models.task import Task
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate, OpportunityOut
from app.schemas.response import success_response, paginated_response

router = APIRouter(prefix="/opportunities", tags=["商机管理"])

@router.get("")
async def list_opportunities(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("customer:list"))],
    page: int = 1,
    page_size: int = 20,
):
    """商机列表 (销售仅看自己)"""
    filters = [Opportunity.is_deleted == False]
    if current_user.role == "sales":
        filters.append(Opportunity.owner_id == current_user.id)

    items, total = await crud_opportunity.get_multi(db, page=page, page_size=page_size, filters=filters)
    data = [OpportunityOut(
        id=i.id,
        customerName=i.customer_name,
        source=i.source,
        intention=i.intention,
        estimatedAmount=i.estimated_amount,
        status=i.status,
        remark=i.remark,
        ownerId=i.owner_id,
        createdAt=i.created_at.isoformat()
    ).model_dump() for i in items]

    return paginated_response(data=data, total=total, page=page, page_size=page_size)

@router.post("")
async def create_opportunity(
    body: OpportunityCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("customer:list"))],
):
    data = body.model_dump()
    mapping = {
        "customerName": "customer_name",
        "estimatedAmount": "estimated_amount"
    }
    final_data = {}
    for k, v in data.items():
        final_data[mapping.get(k, k)] = v

    opp = Opportunity(**final_data, owner_id=current_user.id)
    db.add(opp)
    await db.commit()
    await db.refresh(opp)

    return success_response(message="商机创建成功")
