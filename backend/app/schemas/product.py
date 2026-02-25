"""
商品 Pydantic Schema
对齐前端 types/index.ts: Product
"""
from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    spec: str
    price: float
    cost: float | None = None
    image: str | None = None
    status: str = "on"
    department: str | None = None
    sort: int = 0
    stock: int | None = 0


class ProductUpdate(BaseModel):
    name: str | None = None
    spec: str | None = None
    price: float | None = None
    cost: float | None = None
    image: str | None = None
    status: str | None = None
    department: str | None = None
    sort: int | None = None
    stock: int | None = None


class ProductOut(BaseModel):
    """对齐前端 Product 接口"""
    id: str
    name: str
    image: str | None = None
    spec: str
    price: float
    cost: float | None = None
    status: str
    department: str | None = None
    sort: int
    stock: int | None = None

    class Config:
        from_attributes = True
