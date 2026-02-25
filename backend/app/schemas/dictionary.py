from pydantic import BaseModel
from typing import Optional

class DictionaryBase(BaseModel):
    name: str
    code: str
    group: str
    color: Optional[str] = None
    sort: int = 0
    enabled: bool = True

class DictionaryCreate(DictionaryBase):
    pass

class DictionaryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    sort: Optional[int] = None
    enabled: Optional[bool] = None

class DictionaryOut(DictionaryBase):
    id: str

    class Config:
        from_attributes = True
