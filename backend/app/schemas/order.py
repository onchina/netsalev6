"""
订单 Pydantic Schema
对齐前端 types/index.ts: Order, OrderItem
"""
from pydantic import BaseModel


class OrderItemCreate(BaseModel):
    productId: str
    productName: str
    spec: str
    price: float
    quantity: int
    subtotal: float


class OrderItemOut(BaseModel):
    """对齐前端 OrderItem"""
    productId: str
    productName: str
    spec: str
    price: float
    quantity: int
    subtotal: float

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """创建订单请求"""
    customerId: str
    customerName: str
    orderType: str
    paymentMethod: str
    shipNow: bool = False
    items: list[OrderItemCreate]
    totalAmount: float
    paidAmount: float = 0
    codAmount: float = 0
    paidRatio: float = 0
    remark: str | None = None
    commission: float | None = None
    actualPrice: float | None = None
    applyReason: str | None = None


class OrderUpdate(BaseModel):
    """更新订单"""
    status: str | None = None
    paidAmount: float | None = None
    codAmount: float | None = None
    remark: str | None = None
    commission: float | None = None
    trackingNo: str | None = None
    courierCompany: str | None = None
    shippedAt: str | None = None
    signedAt: str | None = None


class OrderOut(BaseModel):
    """
    对齐前端 Order 接口
    id, orderNo, customerId, customerName, orderType, paymentMethod, shipNow,
    items, totalAmount, paidAmount, codAmount, paidRatio, remark, commission, status,
    createdAt, createdBy
    """
    id: str
    orderNo: str
    customerId: str
    customerName: str
    orderType: str
    paymentMethod: str
    shipNow: bool
    items: list[OrderItemOut] = []
    totalAmount: float
    paidAmount: float
    codAmount: float
    paidRatio: float
    remark: str | None = None
    commission: float | None = None
    actualPrice: float | None = None
    applyReason: str | None = None
    trackingNo: str | None = None
    courierCompany: str | None = None
    shippedAt: str | None = None
    signedAt: str | None = None
    status: str
    createdAt: str
    createdBy: str
    salesName: str | None = None

    class Config:
        from_attributes = True
