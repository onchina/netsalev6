from pydantic import BaseModel
from typing import Optional

class AuditLogOut(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    action: str
    target: Optional[str] = None
    type: str
    createdAt: str
    details: Optional[str] = None

    class Config:
        from_attributes = True
