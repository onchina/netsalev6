"""
客户 Pydantic Schema
对齐前端 types/index.ts: Customer
"""
from pydantic import BaseModel


class CustomerCreate(BaseModel):
    name: str
    phone: str
    address: str | None = None
    height: float | None = None
    age: int | None = None
    weight: float | None = None
    channel: str | None = None
    customerType: str | None = "new"
    entryDate: str | None = None
    ownerId: str | None = None


class CustomerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None
    height: float | None = None
    age: int | None = None
    weight: float | None = None
    channel: str | None = None


class CustomerOut(BaseModel):
    """严格对齐前端 Customer 接口 camelCase 字段"""
    id: str
    name: str
    phone: str
    address: str | None = None
    height: float | None = None
    age: int | None = None
    weight: float | None = None
    channel: str | None = None
    customerType: str | None = None
    entryDate: str | None = None
    ownerId: str | None = None
    ownerName: str | None = None
    createdAt: str

    class Config:
        from_attributes = True
