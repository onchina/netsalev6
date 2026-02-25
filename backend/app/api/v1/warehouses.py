"""
仓储管理路由
GET    /api/v1/warehouses              — 仓库列表
POST   /api/v1/warehouses              — 创建仓库
GET    /api/v1/warehouses/stock        — 库存概览 (按商品聚合, 前端 stock-manage.tsx 使用)
GET    /api/v1/warehouses/stocks       — 库存概览 (别名)
GET    /api/v1/warehouses/returns      — 退货待入库列表 (前端 return-stock.tsx 使用)
POST   /api/v1/warehouses/operations   — 入库/出库/调库
GET    /api/v1/warehouses/logs         — 出入库记录

权限对齐 seed.py — warehouse:product / warehouse:stock / warehouse:return / warehouse:records
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import get_current_user, require_permission
from app.db.session import get_db
from app.models.user import User
from app.models.warehouse import Warehouse
from app.models.stock import Stock, StockLog
from app.models.product import Product
from app.models.after_sale import AfterSale
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseOut
from app.schemas.stock import StockOut, StockOperationRequest, StockLogOut
from app.schemas.response import success_response, paginated_response

router = APIRouter(prefix="/warehouses", tags=["仓储管理"])

# ========== 仓库管理 ==========

@router.get("")
async def list_warehouses(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:product"))],
):
    result = await db.execute(select(Warehouse).where(Warehouse.is_deleted == False))
    items = result.scalars().all()
    data = [WarehouseOut.model_validate(i).model_dump() for i in items]
    return success_response(data=data)

@router.post("")
async def create_warehouse(
    body: WarehouseCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:product"))],
):
    warehouse = Warehouse(name=body.name, address=body.address, is_default=body.isDefault)
    db.add(warehouse)
    await db.commit()
    await db.refresh(warehouse)
    return success_response(data=WarehouseOut.model_validate(warehouse).model_dump())

# ========== 库存管理 ==========

async def _get_stock_data(db: AsyncSession, page: int = 1, page_size: int = 100):
    """内部方法: 获取库存数据 (按商品聚合)"""
    result = await db.execute(
        select(Product).where(Product.is_deleted == False).offset((page - 1) * page_size).limit(page_size)
    )
    products = result.scalars().all()

    data = []
    for p in products:
        stock_res = await db.execute(select(Stock).where(Stock.product_id == p.id))
        stocks = stock_res.scalars().all()

        warehouse_stocks = []
        total_current = 0
        total_available = 0
        warning_value = 50

        for s in stocks:
            warehouse_stocks.append({
                "warehouseName": s.warehouse.name,
                "current": s.current,
                "available": s.available
            })
            total_current += s.current
            total_available += s.available
            warning_value = s.warning_value

        data.append({
            "id": p.id,
            "productName": p.name,
            "spec": p.spec,
            "warehouseStocks": warehouse_stocks,
            "currentStock": total_current,
            "availableStock": total_available,
            "warningValue": warning_value,
            "status": p.status
        })

    return data


@router.get("/stock")
async def list_stock(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:stock"))],
    page: int = 1,
    page_size: int = 100,
):
    """库存概览 — 前端 stock-manage.tsx 使用此路径"""
    data = await _get_stock_data(db, page, page_size)
    return success_response(data=data)


@router.get("/stocks")
async def list_stocks(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:stock"))],
    page: int = 1,
    page_size: int = 100,
):
    """库存概览 (别名路径)"""
    data = await _get_stock_data(db, page, page_size)
    return success_response(data=data)


@router.get("/returns")
async def list_returns(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:return"))],
):
    """退货待入库列表 — 前端 return-stock.tsx 使用"""
    result = await db.execute(
        select(AfterSale).where(AfterSale.type == 'return', AfterSale.is_deleted == False)
    )
    items = result.scalars().all()

    data = []
    for i in items:
        data.append({
            "id": i.id,
            "returnNo": f"RT{i.id[:8]}",
            "orderNo": i.order_no,
            "customerName": i.customer_name,
            "products": [],  # 后续需连表 OrderItem 查询
            "reason": i.reason,
            "status": "pending" if i.status in ["pending", "approved"] else "completed",
            "createdAt": i.created_at.isoformat() if i.created_at else ""
        })
    return success_response(data=data)


@router.post("/operations")
async def stock_operation(
    body: StockOperationRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("warehouse:stock"))],
):
    """入库/出库/调库"""
    stock_res = await db.execute(
        select(Stock).where(Stock.product_id == body.productId, Stock.warehouse_id == body.warehouseId)
    )
    stock = stock_res.scalar_one_or_none()

    if not stock:
        if body.type == "in":
            stock = Stock(product_id=body.productId, warehouse_id=body.warehouseId, current=0, available=0)
            db.add(stock)
        else:
            raise HTTPException(400, "该仓库暂无该商品库存，无法操作")

    if body.type == "in":
        stock.current += body.quantity
        stock.available += body.quantity
    elif body.type == "out":
        if stock.available < body.quantity:
            raise HTTPException(400, "可用库存不足")
        stock.current -= body.quantity
        stock.available -= body.quantity
    elif body.type == "transfer":
        if stock.available < body.quantity:
            raise HTTPException(400, "原仓库库存不足")
        if not body.targetWarehouseId:
            raise HTTPException(400, "必须指定目标仓库")

        stock.current -= body.quantity
        stock.available -= body.quantity

        target_res = await db.execute(
            select(Stock).where(Stock.product_id == body.productId, Stock.warehouse_id == body.targetWarehouseId)
        )
        target_stock = target_res.scalar_one_or_none()
        if not target_stock:
            target_stock = Stock(product_id=body.productId, warehouse_id=body.targetWarehouseId, current=0, available=0)
            db.add(target_stock)
        target_stock.current += body.quantity
        target_stock.available += body.quantity

    log = StockLog(
        product_id=body.productId,
        warehouse_id=body.warehouseId,
        type=body.type,
        quantity=body.quantity,
        unit_price=body.unitPrice,
        operator_id=current_user.id,
        remark=body.remark
    )
    db.add(log)

    await db.commit()
    return success_response(message="操作成功")

@router.get("/logs")
async def list_stock_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("warehouse:records"))],
    page: int = 1,
    page_size: int = 20,
):
    result = await db.execute(
        select(StockLog).order_by(StockLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    items = result.scalars().all()

    count_res = await db.execute(select(func.count()).select_from(StockLog))
    total = count_res.scalar()

    data = []
    for i in items:
        data.append({
            "id": i.id,
            "productId": i.product_id,
            "productName": i.product.name,
            "warehouseId": i.warehouse_id,
            "warehouseName": i.warehouse.name,
            "type": i.type,
            "quantity": i.quantity,
            "unitPrice": i.unit_price,
            "operatorId": i.operator_id,
            "operatorName": i.operator.name,
            "remark": i.remark,
            "createdAt": i.created_at.isoformat()
        })

    return paginated_response(data=data, total=total, page=page, page_size=page_size)
