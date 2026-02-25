"""
售后 Pydantic Schema
对齐前端 types/index.ts: AfterSale
"""
from pydantic import BaseModel


class AfterSaleCreate(BaseModel):
    orderId: str
    orderNo: str
    customerId: str
    customerName: str
    type: str  # refund | return | exchange
    reason: str
    images: list[str] | None = None


class AfterSaleUpdate(BaseModel):
    status: str | None = None
    reason: str | None = None


class AfterSaleOut(BaseModel):
    """对齐前端 AfterSale 接口"""
    id: str
    orderId: str
    orderNo: str
    customerId: str
    customerName: str
    type: str
    reason: str
    images: list[str] | None = None
    status: str
    createdAt: str

    class Config:
        from_attributes = True
