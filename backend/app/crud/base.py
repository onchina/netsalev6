"""
通用 CRUD 基类 — 减少重复代码
所有模型级 CRUD 继承此基类
"""
from typing import Any, Generic, TypeVar, Type

from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    异步 CRUD 基类
    提供标准的 get / get_multi / create / update / soft_delete 操作
    """

    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: str) -> ModelType | None:
        result = await db.execute(
            select(self.model).where(self.model.id == id, self.model.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        page: int = 1,
        page_size: int = 20,
        filters: list[Any] | None = None,
    ) -> tuple[list[ModelType], int]:
        """分页查询 + 总数，返回 (items, total)"""
        query = select(self.model).where(self.model.is_deleted == False)
        count_query = select(func.count()).select_from(self.model).where(self.model.is_deleted == False)

        if filters:
            for f in filters:
                query = query.where(f)
                count_query = count_query.where(f)

        # 总条数
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # 分页数据
        offset = (page - 1) * page_size
        query = query.order_by(self.model.created_at.desc()).offset(offset).limit(page_size)
        result = await db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def create(self, db: AsyncSession, *, obj_in: CreateSchemaType, **extra_fields) -> ModelType:
        """创建记录"""
        data = obj_in.model_dump()
        data.update(extra_fields)

        # camelCase -> snake_case 转换
        snake_data = {}
        for key, value in data.items():
            snake_key = self._to_snake_case(key)
            snake_data[snake_key] = value

        db_obj = self.model(**snake_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: ModelType, obj_in: UpdateSchemaType) -> ModelType:
        """部分更新"""
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            snake_key = self._to_snake_case(key)
            if hasattr(db_obj, snake_key):
                setattr(db_obj, snake_key, value)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def soft_delete(self, db: AsyncSession, *, id: str) -> bool:
        """软删除"""
        obj = await self.get(db, id)
        if obj:
            obj.is_deleted = True
            await db.commit()
            return True
        return False

    @staticmethod
    def _to_snake_case(name: str) -> str:
        """camelCase -> snake_case"""
        import re
        s1 = re.sub(r'(.)([A-Z][a-z]+)', r'\1_\2', name)
        return re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
