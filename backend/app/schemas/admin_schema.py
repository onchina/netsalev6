from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class DepartmentBase(BaseModel):
    name: str
    code: str
    manager: Optional[str] = None
    memberCount: int = Field(0, serialization_alias="memberCount", validation_alias="member_count")
    showInPerformanceV1: bool = Field(True, serialization_alias="showInPerformanceV1", validation_alias="show_in_performance_v1")
    showInPerformanceV2: bool = Field(True, serialization_alias="showInPerformanceV2", validation_alias="show_in_performance_v2")
    showInRanking: bool = Field(True, serialization_alias="showInRanking", validation_alias="show_in_ranking")
    showInAnalytics: bool = Field(True, serialization_alias="showInAnalytics", validation_alias="show_in_analytics")

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    manager: Optional[str] = None
    memberCount: Optional[int] = Field(None, serialization_alias="memberCount", validation_alias="member_count")
    showInPerformanceV1: Optional[bool] = Field(None, serialization_alias="showInPerformanceV1", validation_alias="show_in_performance_v1")
    showInPerformanceV2: Optional[bool] = Field(None, serialization_alias="showInPerformanceV2", validation_alias="show_in_performance_v2")
    showInRanking: Optional[bool] = Field(None, serialization_alias="showInRanking", validation_alias="show_in_ranking")
    showInAnalytics: Optional[bool] = Field(None, serialization_alias="showInAnalytics", validation_alias="show_in_analytics")

class DepartmentOut(DepartmentBase):
    id: str
    createdAt: datetime = Field(serialization_alias="createdAt", validation_alias="created_at")

    class Config:
        from_attributes = True
        populate_by_name = True


class IpWhitelistBase(BaseModel):
    ip: str
    remark: Optional[str] = None
    status: bool = True

class IpWhitelistCreate(IpWhitelistBase):
    pass

class IpWhitelistUpdate(BaseModel):
    ip: Optional[str] = None
    remark: Optional[str] = None
    status: Optional[bool] = None

class IpWhitelistOut(IpWhitelistBase):
    id: str
    createdAt: datetime = Field(serialization_alias="createdAt", validation_alias="created_at")

    class Config:
        from_attributes = True
        populate_by_name = True


class LogisticsCompanyBase(BaseModel):
    name: str
    code: str
    status: bool = True

class LogisticsCompanyCreate(LogisticsCompanyBase):
    pass

class LogisticsCompanyOut(LogisticsCompanyBase):
    id: str

    class Config:
        from_attributes = True


class SensitiveWordBase(BaseModel):
    word: str
    type: str
    level: str

class SensitiveWordCreate(SensitiveWordBase):
    pass

class SensitiveWordOut(SensitiveWordBase):
    id: str
    createdAt: datetime = Field(serialization_alias="createdAt", validation_alias="created_at")

    class Config:
        from_attributes = True
        populate_by_name = True

class RoleUpdate(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str]

class RoleOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    permissions: List[str]
    
    class Config:
        from_attributes = True
