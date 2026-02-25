from pydantic import BaseModel

class WarehouseBase(BaseModel):
    name: str
    address: str | None = None
    isDefault: bool = False

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    isDefault: bool | None = None

class WarehouseOut(WarehouseBase):
    id: str

    class Config:
        from_attributes = True
