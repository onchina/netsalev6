from pydantic import BaseModel
from typing import Any

class StockBase(BaseModel):
    productId: str
    warehouseId: str
    current: int = 0
    available: int = 0
    warningValue: int = 50

class StockOut(StockBase):
    id: str
    productName: str | None = None
    warehouseName: str | None = None
    spec: str | None = None

    class Config:
        from_attributes = True

class StockOperationRequest(BaseModel):
    productId: str
    warehouseId: str
    type: str # in, out, transfer
    quantity: int
    unitPrice: float | None = None
    targetWarehouseId: str | None = None # for transfer
    remark: str | None = None

class StockLogOut(BaseModel):
    id: str
    productId: str
    productName: str
    warehouseId: str
    warehouseName: str
    type: str
    quantity: int
    unitPrice: float | None = None
    operatorId: str
    operatorName: str
    remark: str | None = None
    createdAt: str

    class Config:
        from_attributes = True
