"""
字典管理路由
权限对齐 seed.py — 使用 operation:channel (类型管理)
列表查看使用 get_current_user (所有登录用户可读取字典供下拉框使用)
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, require_permission
from app.crud.crud_instances import crud_dictionary
from app.db.session import get_db
from app.models.user import User
from app.models.dictionary import Dictionary
from app.schemas.dictionary import DictionaryCreate, DictionaryUpdate, DictionaryOut
from app.schemas.response import success_response

router = APIRouter(prefix="/dictionaries", tags=["系统管理"])

@router.get("")
async def list_dictionaries(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    group: str | None = None,
):
    """获取字典列表 — 所有已登录用户均可读取"""
    query = select(Dictionary).where(Dictionary.is_deleted == False)
    if group:
        query = query.where(Dictionary.group == group)

    query = query.order_by(Dictionary.sort.asc())
    result = await db.execute(query)
    items = result.scalars().all()

    data = [DictionaryOut.model_validate(i).model_dump() for i in items]
    return success_response(data=data)

@router.post("")
async def create_dictionary(
    body: DictionaryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("operation:channel"))],
):
    item = await crud_dictionary.create(db, obj_in=body)
    return success_response(data=DictionaryOut.model_validate(item).model_dump(), message="创建成功")

@router.patch("/{id}")
async def update_dictionary(
    id: str,
    body: DictionaryUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("operation:channel"))],
):
    item = await crud_dictionary.get(db, id)
    if not item:
        raise HTTPException(404, "字典项不存在")
    updated = await crud_dictionary.update(db, db_obj=item, obj_in=body)
    return success_response(data=DictionaryOut.model_validate(updated).model_dump(), message="更新成功")

@router.put("/{id}")
async def put_dictionary(
    id: str,
    body: DictionaryUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("operation:channel"))],
):
    """PUT 全量更新字典项"""
    item = await crud_dictionary.get(db, id)
    if not item:
        raise HTTPException(404, "字典项不存在")
    updated = await crud_dictionary.update(db, db_obj=item, obj_in=body)
    return success_response(data=DictionaryOut.model_validate(updated).model_dump(), message="更新成功")

@router.delete("/{id}")
async def delete_dictionary(
    id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("operation:channel"))],
):
    await crud_dictionary.soft_delete(db, id=id)
    return success_response(message="删除成功")
