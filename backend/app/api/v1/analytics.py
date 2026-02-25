"""
数据报表路由
权限对齐 seed.py — 使用 office:analytics
"""
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.api.deps import require_permission
from app.db.session import get_db
from app.models.user import User
from app.models.order import Order
from app.models.customer import Customer
from app.schemas.response import success_response

router = APIRouter(prefix="/analytics", tags=["数据报表"])

@router.get("/performance")
async def get_performance(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("office:analytics"))],
    dimension: str = "今日",
):
    """大屏业绩数据接口"""
    data = {
        "sales": 89680,
        "orders": 128,
        "refund": 1200,
        "target": 100000,
        "lastSales": 79500,
        "lastOrders": 110,
        "lastRefund": 1500,
    }
    return success_response(data=data)

@router.get("/trend")
async def get_trend(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("office:analytics"))],
    dimension: str = "今日",
):
    """趋势图数据"""
    categories = []
    series = []

    if dimension == "今日":
        categories = [f"{i}:00" for i in range(24)]
    elif dimension == "本周":
        categories = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

    return success_response(data={"categories": categories, "series": series})
