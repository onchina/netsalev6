import time
from typing import Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.user import User
from app.services.ws_manager import manager
from app.db.session import AsyncSessionLocal

class ScreenService:
    """
    大屏数据服务 — 负责汇总数据并通过 WebSocket 推送
    支持 V1, V2 和 排行榜 (Ranking)
    """

    async def get_v1_data(self, dimension: str = "今日") -> dict:
        """V1 大屏数据 (核心指标 + 趋势 + 分布)"""
        return {
            "summary": {
                "sales": 128400,
                "orders": 456,
                "refund": 2100,
                "customerCount": 89
            },
            "trend": {
                "categories": ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"],
                "actual": [32000, 28000, 45000, 89000, 112000, 128000, 128400],
                "target": [30000, 30000, 40000, 80000, 100000, 120000, 130000]
            },
            "distribution": [
                {"name": "销售一部", "value": 45},
                {"name": "销售二部", "value": 32},
                {"name": "运营中心", "value": 23}
            ]
        }

    async def get_v2_data(self, dimension: str = "今日") -> dict:
        """V2 大屏数据 (PRO 版，含对比和目标进度)"""
        return {
            "stats": {
                "sales": 128400,
                "orders": 452,
                "refund": 2100,
                "target": 150000,
                "trend": 12.5
            },
            "chart": {
                "categories": ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"],
                "actual": [32000, 28000, 45000, 89000, 112000, 128000, 128400],
                "yesterday": [28000, 25000, 38000, 75000, 98000, 110000, 115000]
            },
            "departmentContribution": [
                {"name": "销售部", "value": 65, "color": "#3b82f6"},
                {"name": "运营部", "value": 35, "color": "#8b5cf6"}
            ]
        }

    async def get_ranking_data(self, dimension: str = "今日") -> dict:
        """排行榜大屏数据 (个人 + 部门)"""
        return {
            "personal": [
                {"rank": 1, "name": "张三", "department": "销售部", "amount": 128600, "orders": 86, "target": 150000},
                {"rank": 2, "name": "李四", "department": "运营部", "amount": 98500, "orders": 72, "target": 120000},
                {"rank": 3, "name": "王五", "department": "销售部", "amount": 76800, "orders": 58, "target": 100000},
            ],
            "department": [
                {"rank": 1, "name": "销售部", "amount": 302800, "orders": 210, "members": 5, "target": 375000},
                {"rank": 2, "name": "运营部", "amount": 248700, "orders": 173, "members": 4, "target": 310000},
            ]
        }

    async def broadcast_updates(self):
        """广播所有大屏更新"""
        v1_data = await self.get_v1_data()
        v2_data = await self.get_v2_data()
        rank_data = await self.get_ranking_data()
        
        await manager.broadcast("screen.v1.update", v1_data)
        await manager.broadcast("screen.v2.update", v2_data)
        await manager.broadcast("screen.ranking.update", rank_data)

screen_service = ScreenService()
