"""
售后管理路由
GET    /api/v1/after-sales          — 售后列表
POST   /api/v1/after-sales          — 创建售后单
GET    /api/v1/after-sales/{id}     — 售后详情
PATCH  /api/v1/after-sales/{id}     — 部分更新售后单
PUT    /api/v1/after-sales/{id}     — 全量更新售后单

权限对齐 seed.py — 使用 finance:aftersale
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.crud.crud_instances import crud_after_sale
from app.db.session import get_db
from app.models.user import User
from app.models.after_sale import AfterSale
from app.schemas.after_sale import AfterSaleCreate, AfterSaleUpdate, AfterSaleOut
from app.schemas.response import success_response, paginated_response

router = APIRouter(prefix="/after-sales", tags=["售后管理"])


def _to_out(a: AfterSale) -> dict:
    return AfterSaleOut(
        id=a.id, orderId=a.order_id, orderNo=a.order_no,
        customerId=a.customer_id, customerName=a.customer_name,
        type=a.type, reason=a.reason, images=a.images,
        status=a.status,
        createdAt=a.created_at.isoformat() if a.created_at else "",
    ).model_dump()


@router.get("")
async def list_after_sales(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("finance:aftersale"))],
    page: int = 1,
    page_size: int = 20,
):
    items, total = await crud_after_sale.get_multi(db, page=page, page_size=page_size)
    data = [_to_out(a) for a in items]
    return paginated_response(data=data, total=total, page=page, page_size=page_size)


@router.post("", status_code=201)
async def create_after_sale(
    body: AfterSaleCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("finance:aftersale"))],
):
    item = await crud_after_sale.create(db, obj_in=body)
    return success_response(data=_to_out(item), message="售后单创建成功")


@router.get("/{item_id}")
async def get_after_sale(
    item_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("finance:aftersale"))],
):
    item = await crud_after_sale.get(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="售后单不存在")
    return success_response(data=_to_out(item))


@router.patch("/{item_id}")
async def update_after_sale(
    item_id: str,
    body: AfterSaleUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("finance:aftersale"))],
):
    item = await crud_after_sale.get(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="售后单不存在")
    updated = await crud_after_sale.update(db, db_obj=item, obj_in=body)
    return success_response(data=_to_out(updated), message="更新成功")


@router.put("/{item_id}")
async def put_after_sale(
    item_id: str,
    body: AfterSaleUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("finance:aftersale"))],
):
    """PUT 全量更新售后单"""
    item = await crud_after_sale.get(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="售后单不存在")
    updated = await crud_after_sale.update(db, db_obj=item, obj_in=body)
    return success_response(data=_to_out(updated), message="更新成功")
