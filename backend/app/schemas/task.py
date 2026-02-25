from pydantic import BaseModel
from typing import Optional

class TaskBase(BaseModel):
    type: str # 回访, 跟进
    content: str
    deadline: Optional[str] = None
    status: str = "pending"

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    content: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None

class TaskOut(TaskBase):
    id: str
    userId: str
    createdAt: str

    class Config:
        from_attributes = True
