"""
商品管理路由
GET    /api/v1/products          — 商品列表
POST   /api/v1/products          — 创建商品
PUT    /api/v1/products/sort     — 排序调整
DELETE /api/v1/products/bulk-delete — 批量删除
GET    /api/v1/products/{id}     — 商品详情
PATCH  /api/v1/products/{id}     — 部分更新商品
PUT    /api/v1/products/{id}     — 全量更新商品
DELETE /api/v1/products/{id}     — 删除商品

权限对齐 seed.py — 使用 warehouse:product
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel
from sqlalchemy import select, delete, func

from app.api.deps import get_current_user, require_permission
from app.crud.crud_instances import crud_product
from app.db.session import get_db
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.schemas.response import success_response, paginated_response

router = APIRouter(prefix="/products", tags=["商品管理"])


class SortAction(BaseModel):
    id: str
    direction: str  # up, down, top


def _product_to_out(p: Product) -> dict:
    return ProductOut(
        id=p.id, name=p.name, image=p.image, spec=p.spec,
        price=p.price, cost=p.cost, status=p.status, stock=p.stock,
        department=p.department, sort=p.sort,
    ).model_dump()


@router.get("")
async def list_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:product"))],
    page: int = 1,
    page_size: int = 100,
    status_filter: str | None = None,
):
    """商品列表 (默认按 sort 升序)"""
    query = select(Product).where(Product.is_deleted == False)
    if status_filter:
        query = query.where(Product.status == status_filter)

    query = query.order_by(Product.sort.asc(), Product.created_at.desc())

    offset = (page - 1) * page_size
    result = await db.execute(query.offset(offset).limit(page_size))
    items = result.scalars().all()

    count_res = await db.execute(select(func.count()).select_from(Product).where(Product.is_deleted == False))
    total = count_res.scalar()

    data = [_product_to_out(p) for p in items]
    return paginated_response(data=data, total=total, page=page, page_size=page_size)


@router.put("/sort")
async def sort_product(
    body: SortAction,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:product"))],
):
    """商品排序调整"""
    product = await crud_product.get(db, body.id)
    if not product:
        raise HTTPException(404, "商品不存在")

    if body.direction == "top":
        product.sort = 0
    elif body.direction == "up":
        product.sort = max(0, product.sort - 1)
    elif body.direction == "down":
        product.sort = product.sort + 1

    await db.commit()
    return success_response(message="排序已更新")


@router.delete("/bulk-delete")
async def bulk_delete_products(
    ids: list[str],
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:product"))],
):
    """批量删除"""
    for pid in ids:
        await crud_product.soft_delete(db, id=pid)
    return success_response(message=f"成功删除 {len(ids)} 个商品")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:product"))],
):
    product = await crud_product.create(db, obj_in=body)
    return success_response(data=_product_to_out(product), message="创建成功")


@router.get("/{product_id}")
async def get_product(
    product_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:product"))],
):
    product = await crud_product.get(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    return success_response(data=_product_to_out(product))


@router.patch("/{product_id}")
async def update_product(
    product_id: str,
    body: ProductUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:product"))],
):
    product = await crud_product.get(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    updated = await crud_product.update(db, db_obj=product, obj_in=body)
    return success_response(data=_product_to_out(updated), message="更新成功")


@router.put("/{product_id}")
async def put_product(
    product_id: str,
    body: ProductUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:product"))],
):
    """PUT 全量更新商品"""
    product = await crud_product.get(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    updated = await crud_product.update(db, db_obj=product, obj_in=body)
    return success_response(data=_product_to_out(updated), message="更新成功")


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:product"))],
):
    deleted = await crud_product.soft_delete(db, id=product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="商品不存在")
    return success_response(message="删除成功")
