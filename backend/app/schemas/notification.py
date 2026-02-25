from pydantic import BaseModel
from typing import Optional

class NotificationBase(BaseModel):
    title: str
    content: str
    type: str = "info" # info, warning, success, error
    read: bool = False

class NotificationCreate(NotificationBase):
    userId: str

class NotificationUpdate(BaseModel):
    read: Optional[bool] = None

class NotificationOut(NotificationBase):
    id: str
    userId: str
    createdAt: str

    class Config:
        from_attributes = True
