from pydantic import BaseModel
from typing import Optional

class OpportunityBase(BaseModel):
    customerName: str
    source: Optional[str] = None
    intention: str = "中"
    estimatedAmount: float = 0
    status: str = "new"
    remark: Optional[str] = None

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    customerName: Optional[str] = None
    intention: Optional[str] = None
    estimatedAmount: Optional[float] = None
    status: Optional[str] = None
    remark: Optional[str] = None

class OpportunityOut(OpportunityBase):
    id: str
    ownerId: str
    createdAt: str

    class Config:
        from_attributes = True
