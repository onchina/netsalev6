from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Any

class SheetData(BaseModel):
    name: str
    headers: List[str]
    rows: List[List[str]]

class Attachment(BaseModel):
    id: str
    fileName: str
    fileSize: str
    uploadTime: str
    sheets: List[SheetData]

class DailyReportBase(BaseModel):
    date: str
    status: str
    todayWork: str
    tomorrowPlan: str
    problems: str
    attachments: List[Attachment] = []

class DailyReportCreate(DailyReportBase):
    pass

class DailyReportUpdate(DailyReportBase):
    pass

class DailyReportOut(DailyReportBase):
    id: str
    # 返回用户信息以支持关联查询 (如果有)
    userId: Optional[str] = None
    userName: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
