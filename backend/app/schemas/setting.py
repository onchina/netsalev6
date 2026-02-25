from pydantic import BaseModel
from typing import Any

class SystemSettingBase(BaseModel):
    key: str
    value: Any
    group: str = "global"
    type: str = "string"
    description: str | None = None

class SystemSettingCreate(SystemSettingBase):
    pass

class SystemSettingUpdate(BaseModel):
    value: Any
    description: str | None = None

class SystemSettingOut(SystemSettingBase):
    id: str

    class Config:
        from_attributes = True
