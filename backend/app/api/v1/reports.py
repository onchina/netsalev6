"""
工作日报路由
GET    /api/v1/reports                — 当前用户日报列表
POST   /api/v1/reports                — 新建日报
PUT    /api/v1/reports/{report_id}    — 更新日报

权限对齐 seed.py — office:report
"""
from typing import Annotated, List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.api.deps import require_permission
from app.db.session import get_db
from app.models.user import User
from app.models.report import DailyReport
from app.schemas.response import success_response
from app.schemas.report import DailyReportCreate, DailyReportOut, DailyReportUpdate

router = APIRouter(prefix="/reports", tags=["工作日报"])

@router.get("")
async def list_reports(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("office:report"))],
):
    """当前用户的日报列表"""
    result = await db.execute(
        select(DailyReport)
        .where(DailyReport.user_id == current_user.id)
        .order_by(DailyReport.date.desc())
    )
    items = result.scalars().all()
    data = []
    for item in items:
        att = item.attachments if item.attachments else []
        data.append({
            "id": item.id,
            "date": item.date,
            "status": item.status,
            "todayWork": item.today_work,
            "tomorrowPlan": item.tomorrow_plan,
            "problems": item.problems,
            "attachments": att,
        })
    return success_response(data=data)

@router.post("")
async def create_report(
    body: DailyReportCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("office:report"))],
):
    """新建日报或保存草稿"""
    res = await db.execute(select(DailyReport).where(DailyReport.user_id == current_user.id, DailyReport.date == body.date))
    exist = res.scalar_one_or_none()
    if exist:
        raise HTTPException(status_code=400, detail="该日期的日报已存在，请走更新接口")

    attachments_dict = [att.model_dump() for att in body.attachments]

    report = DailyReport(
        user_id=current_user.id,
        date=body.date,
        status=body.status,
        today_work=body.todayWork,
        tomorrow_plan=body.tomorrowPlan,
        problems=body.problems,
        attachments=attachments_dict
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    return success_response(message="已保存", data=report.id)

@router.put("/{report_id}")
async def update_report(
    report_id: str,
    body: DailyReportUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("office:report"))],
):
    """更新日报或草稿"""
    res = await db.execute(select(DailyReport).where(DailyReport.id == report_id, DailyReport.user_id == current_user.id))
    report = res.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="未找到您的该篇日报")

    report.date = body.date
    report.status = body.status
    report.today_work = body.todayWork
    report.tomorrow_plan = body.tomorrowPlan
    report.problems = body.problems
    report.attachments = [att.model_dump() for att in body.attachments]

    await db.commit()
    return success_response(message="已更新")
