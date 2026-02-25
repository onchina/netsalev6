"""
客户管理路由
GET    /api/v1/customers          — 客户列表
POST   /api/v1/customers          — 创建客户
GET    /api/v1/customers/{id}     — 客户详情
PATCH  /api/v1/customers/{id}     — 部分更新客户
PUT    /api/v1/customers/{id}     — 全量更新客户
DELETE /api/v1/customers/{id}     — 删除客户

数据权限: sales 仅可查看 owner_id == current_user.id 的数据
权限对齐 seed.py — 使用 customer:list
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.crud.crud_instances import crud_customer
from app.db.session import get_db
from app.models.user import User
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerOut
from app.schemas.response import success_response, paginated_response

router = APIRouter(prefix="/customers", tags=["客户管理"])


def _customer_to_out(c: Customer) -> dict:
    return CustomerOut(
        id=c.id,
        name=c.name,
        phone=c.phone,
        address=c.address,
        height=c.height,
        age=c.age,
        weight=c.weight,
        channel=c.channel,
        customerType=c.customer_type,
        entryDate=c.entry_date,
        ownerId=c.owner_id,
        ownerName=c.owner.name if c.owner else None,
        createdAt=c.created_at.isoformat() if c.created_at else "",
    ).model_dump()


@router.get("")
async def list_customers(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("customer:list"))],
    page: int = 1,
    page_size: int = 20,
):
    """客户列表 — sales 仅看自己的客户"""
    filters = []
    if current_user.role == "sales":
        filters.append(Customer.owner_id == current_user.id)

    items, total = await crud_customer.get_multi(db, page=page, page_size=page_size, filters=filters)
    data = [_customer_to_out(c) for c in items]
    return paginated_response(data=data, total=total, page=page, page_size=page_size)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_customer(
    body: CustomerCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("customer:list"))],
):
    """创建客户 — 默认归属当前销售"""
    owner = body.ownerId or current_user.id
    customer = await crud_customer.create(db, obj_in=body, owner_id=owner)
    return success_response(data=_customer_to_out(customer), message="创建成功")


@router.get("/{customer_id}")
async def get_customer(
    customer_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("customer:list"))],
):
    customer = await crud_customer.get(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    return success_response(data=_customer_to_out(customer))


@router.patch("/{customer_id}")
async def update_customer(
    customer_id: str,
    body: CustomerUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("customer:list"))],
):
    customer = await crud_customer.get(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    updated = await crud_customer.update(db, db_obj=customer, obj_in=body)
    return success_response(data=_customer_to_out(updated), message="更新成功")


@router.put("/{customer_id}")
async def put_customer(
    customer_id: str,
    body: CustomerUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("customer:list"))],
):
    """PUT 全量更新客户"""
    customer = await crud_customer.get(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    updated = await crud_customer.update(db, db_obj=customer, obj_in=body)
    return success_response(data=_customer_to_out(updated), message="更新成功")


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("customer:list"))],
):
    deleted = await crud_customer.soft_delete(db, id=customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="客户不存在")
    return success_response(message="删除成功")
