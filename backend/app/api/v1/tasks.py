"""
任务管理路由
GET    /api/v1/tasks/todo  — 当前用户待办任务
POST   /api/v1/tasks       — 创建任务

权限对齐 seed.py — get_current_user (所有登录用户可管理自己的任务)
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.crud.crud_instances import crud_task
from app.db.session import get_db
from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.schemas.response import success_response

router = APIRouter(prefix="/tasks", tags=["任务管理"])

@router.get("/todo")
async def list_todo(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """获取当前用户的待办任务"""
    query = select(Task).where(Task.user_id == current_user.id, Task.status == "pending", Task.is_deleted == False)
    result = await db.execute(query)
    items = result.scalars().all()

    data = [TaskOut(
        id=i.id,
        type=i.type,
        content=i.content,
        deadline=i.deadline,
        status=i.status,
        userId=i.user_id,
        createdAt=i.created_at.isoformat()
    ).model_dump() for i in items]

    return success_response(data=data)

@router.post("")
async def create_task(
    body: TaskCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    task = await crud_task.create(db, obj_in=body, user_id=current_user.id)
    return success_response(message="任务创建成功")
