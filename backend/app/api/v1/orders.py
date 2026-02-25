"""
订单管理路由
GET    /api/v1/orders              — 订单列表
POST   /api/v1/orders              — 创建订单
GET    /api/v1/orders/audit        — 审批列表 (经理/财务)
GET    /api/v1/orders/modifiable   — 可修改订单列表
GET    /api/v1/orders/{id}         — 订单详情
PATCH  /api/v1/orders/{id}         — 部分更新订单
PUT    /api/v1/orders/{id}         — 全量更新订单
DELETE /api/v1/orders/{id}         — 删除订单

权限对齐 seed.py — 使用 order:create / order:modify / order:pending / order:shipped
                    / order:signed / finance:audit / finance:aftersale
"""
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from starlette import status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.crud.crud_instances import crud_order
from app.db.session import get_db
from app.models.user import User
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut, OrderItemOut
from app.schemas.response import success_response, paginated_response

router = APIRouter(prefix="/orders", tags=["订单管理"])


def _order_to_out(o: Order) -> dict:
    items_out = [
        OrderItemOut(
            productId=item.product_id,
            productName=item.product_name,
            spec=item.spec,
            price=item.price,
            quantity=item.quantity,
            subtotal=item.subtotal,
        ).model_dump()
        for item in (o.items or [])
    ]
    return OrderOut(
        id=o.id, orderNo=o.order_no, customerId=o.customer_id,
        customerName=o.customer_name, orderType=o.order_type,
        paymentMethod=o.payment_method, shipNow=o.ship_now,
        items=items_out, totalAmount=o.total_amount,
        paidAmount=o.paid_amount, codAmount=o.cod_amount,
        paidRatio=o.paid_ratio, remark=o.remark,
        commission=o.commission, status=o.status,
        actualPrice=o.actual_price, applyReason=o.apply_reason,
        trackingNo=o.tracking_no, courierCompany=o.courier_company,
        shippedAt=o.shipped_at.isoformat() if o.shipped_at else None,
        signedAt=o.signed_at.isoformat() if o.signed_at else None,
        createdAt=o.created_at.isoformat() if o.created_at else "",
        createdBy=o.created_by,
        salesName=o.creator.name if o.creator else None,
    ).model_dump()


def _generate_order_no() -> str:
    """生成订单编号: NS + 年月日时分秒 + 4位随机"""
    now = datetime.now(timezone.utc)
    return f"NS{now.strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"


# ============================================================
# 子路由 — 必须放在 /{order_id} 之前，避免路径冲突
# ============================================================

@router.get("/audit")
async def list_audit_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = 1,
    page_size: int = 20,
):
    """
    审批列表 — 经理看 manager_pending 的订单，财务看 finance_pending 的订单
    admin 可以看所有待审批
    """
    filters = []
    audit_statuses = ["manager_pending", "finance_pending", "manager_rejected", "finance_rejected", "voided"]
    if current_user.role == "sales_manager":
        filters.append(Order.status.in_(["manager_pending", "manager_rejected"]))
    elif current_user.role == "finance":
        filters.append(Order.status.in_(["finance_pending", "finance_rejected", "voided"]))
    elif current_user.role == "admin":
        filters.append(Order.status.in_(audit_statuses))
    else:
        # sales 看自己提交的待审批订单
        filters.append(Order.created_by == current_user.id)
        filters.append(Order.status.in_(audit_statuses))

    items, total = await crud_order.get_multi(db, page=page, page_size=page_size, filters=filters)
    data = [_order_to_out(o) for o in items]
    return paginated_response(data=data, total=total, page=page, page_size=page_size)


@router.get("/modifiable")
async def list_modifiable_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = 1,
    page_size: int = 20,
):
    """
    可修改的订单列表 — 对齐前端 order-modify.tsx
    仅返回 draft / approved 状态且未发货的订单
    """
    filters = [Order.status.in_(["draft", "approved", "manager_rejected", "finance_rejected"])]
    if current_user.role == "sales":
        filters.append(Order.created_by == current_user.id)

    items, total = await crud_order.get_multi(db, page=page, page_size=page_size, filters=filters)
    data = [_order_to_out(o) for o in items]
    return paginated_response(data=data, total=total, page=page, page_size=page_size)


# ============================================================
# 标准 CRUD
# ============================================================

@router.get("")
async def list_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
):
    """订单列表 — sales 仅看自己的订单，支持 ?status= 过滤"""
    filters = []
    if current_user.role == "sales":
        filters.append(Order.created_by == current_user.id)
    if status:
        filters.append(Order.status == status)

    items, total = await crud_order.get_multi(db, page=page, page_size=page_size, filters=filters)
    data = [_order_to_out(o) for o in items]
    return paginated_response(data=data, total=total, page=page, page_size=page_size)


@router.post("", status_code=http_status.HTTP_201_CREATED)
async def create_order(
    body: OrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("order:create"))],
):
    """创建订单 — 自动生成 orderNo, 设定 created_by"""
    # 状态逻辑：如果实际价格低于总价，则需要经理审核
    initial_status = "manager_pending" if (body.actualPrice and body.actualPrice < body.totalAmount) else "approved"

    order = Order(
        order_no=_generate_order_no(),
        customer_id=body.customerId,
        customer_name=body.customerName,
        order_type=body.orderType,
        payment_method=body.paymentMethod,
        ship_now=body.shipNow,
        total_amount=body.totalAmount,
        paid_amount=body.paidAmount,
        cod_amount=body.codAmount,
        paid_ratio=body.paidRatio,
        remark=body.remark,
        commission=body.commission,
        actual_price=body.actualPrice,
        apply_reason=body.applyReason,
        status=initial_status,
        created_by=current_user.id,
    )
    db.add(order)
    await db.flush()

    # 创建明细行
    for item in body.items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.productId,
            product_name=item.productName,
            spec=item.spec,
            price=item.price,
            quantity=item.quantity,
            subtotal=item.subtotal,
        ))

    await db.commit()
    await db.refresh(order)
    return success_response(data=_order_to_out(order), message="订单创建成功")


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    order = await crud_order.get(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return success_response(data=_order_to_out(order))


def _apply_order_update(order: Order, update_data: dict):
    """将前端 camelCase 字段映射到 ORM snake_case 并更新"""
    field_map = {
        "status": "status",
        "paidAmount": "paid_amount",
        "codAmount": "cod_amount",
        "remark": "remark",
        "commission": "commission",
        "trackingNo": "tracking_no",
        "courierCompany": "courier_company",
        "shippedAt": "shipped_at",
        "signedAt": "signed_at",
        "actualPrice": "actual_price",
        "applyReason": "apply_reason",
    }
    for camel, snake in field_map.items():
        if camel in update_data:
            setattr(order, snake, update_data[camel])


@router.patch("/{order_id}")
async def update_order(
    order_id: str,
    body: OrderUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    """部分更新订单 — 含状态审核流转"""
    order = await crud_order.get(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    update_data = body.model_dump(exclude_unset=True)
    _apply_order_update(order, update_data)

    await db.commit()
    await db.refresh(order)
    return success_response(data=_order_to_out(order), message="更新成功")


@router.put("/{order_id}")
async def put_order(
    order_id: str,
    body: OrderUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    """PUT 全量更新订单 — 与 PATCH 共享逻辑"""
    order = await crud_order.get(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    update_data = body.model_dump(exclude_unset=True)
    _apply_order_update(order, update_data)

    await db.commit()
    await db.refresh(order)
    return success_response(data=_order_to_out(order), message="更新成功")


@router.delete("/{order_id}")
async def delete_order(
    order_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    deleted = await crud_order.soft_delete(db, id=order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="订单不存在")
    return success_response(message="删除成功")
