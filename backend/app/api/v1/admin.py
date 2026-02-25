from typing import Annotated, List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.api.deps import require_permission
from app.db.session import get_db
from app.models.user import User, Role, Permission
from app.models.admin_model import Department, IpWhitelist, LogisticsCompany, SensitiveWord
from app.schemas.response import success_response
from app.schemas.admin_schema import (
    DepartmentCreate, DepartmentUpdate, DepartmentOut, 
    IpWhitelistCreate, IpWhitelistUpdate, IpWhitelistOut,
    LogisticsCompanyCreate, LogisticsCompanyOut,
    SensitiveWordCreate, SensitiveWordOut,
    RoleUpdate, RoleOut
)

router = APIRouter(prefix="/admin", tags=["后台设置"])


# ---------------------- 部门设置 ----------------------
@router.get("/departments", response_model=Any)
async def get_departments(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    result = await db.execute(select(Department).order_by(Department.created_at.desc()))
    items = result.scalars().all()
    # Pydantic 转换为字典
    list_data = [DepartmentOut.model_validate(item).model_dump(by_alias=True) for item in items]
    return success_response(data=list_data)

@router.post("/departments", response_model=Any)
async def create_department(
    data: DepartmentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    obj = Department(**data.model_dump(by_alias=False))
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return success_response(data=DepartmentOut.model_validate(obj).model_dump(by_alias=True), message="部门已创建")

@router.put("/departments/{dept_id}", response_model=Any)
async def update_department(
    dept_id: str,
    data: DepartmentUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    res = await db.execute(select(Department).where(Department.id == dept_id))
    obj = res.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Department not found")
        
    update_data = data.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        setattr(obj, key, value)

    await db.commit()
    return success_response(message="部门信息已更新")

@router.delete("/departments/{dept_id}", response_model=Any)
async def delete_department(
    dept_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    await db.execute(delete(Department).where(Department.id == dept_id))
    await db.commit()
    return success_response(message="部门已删除")

# ---------------------- 权限配置 (Role & Permissions) ----------------------
@router.get("/roles", response_model=Any)
async def get_roles(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    result = await db.execute(select(Role).order_by(Role.created_at.asc()))
    items = result.scalars().all()
    
    data_list = []
    for item in items:
        # Permission code list
        perms = [p.code for p in getattr(item, 'permissions', [])]
        if item.code == 'admin':
            perms = ['*']  # 超管默认拥有所有
        
        data_list.append({
            "id": item.id,
            "code": item.code,
            "name": item.name,
            "description": f"系统角色: {item.code}" if getattr(item, 'is_system', False) else "普通角色",
            "permissions": perms
        })
    return success_response(data=data_list)

@router.put("/roles/{role_id}", response_model=Any)
async def update_role(
    role_id: str,
    data: RoleUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    res = await db.execute(select(Role).where(Role.id == role_id))
    role = res.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    if role.code == "admin":
        raise HTTPException(status_code=400, detail="Cannot modify admin role permissions explicitly")

    # Fetch permissions from DB
    perms_res = await db.execute(select(Permission).where(Permission.code.in_(data.permissions)))
    perm_objs = perms_res.scalars().all()
    role.name = data.name
    role.permissions = list(perm_objs)
    await db.commit()
    return success_response(message="角色配置已更新")

# ---------------------- 物流配置 ----------------------
@router.get("/logistics", response_model=Any)
async def get_logistics(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    res = await db.execute(select(LogisticsCompany).order_by(LogisticsCompany.created_at.asc()))
    items = res.scalars().all()
    return success_response(data=[LogisticsCompanyOut.model_validate(i).model_dump() for i in items])

@router.put("/logistics/{comp_id}/status", response_model=Any)
async def update_logistics_status(
    comp_id: str,
    status: bool,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    res = await db.execute(select(LogisticsCompany).where(LogisticsCompany.id == comp_id))
    comp = res.scalar_one_or_none()
    if comp:
        comp.status = status
        await db.commit()
    return success_response(message="物流公司状态已更新")

# ---------------------- IP白名单 ----------------------
@router.get("/ip-whitelist", response_model=Any)
async def get_ip_whitelist(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    res = await db.execute(select(IpWhitelist).order_by(IpWhitelist.created_at.desc()))
    items = res.scalars().all()
    return success_response(data=[IpWhitelistOut.model_validate(i).model_dump(by_alias=True) for i in items])

@router.post("/ip-whitelist", response_model=Any)
async def add_ip_whitelist(
    data: IpWhitelistCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    obj = IpWhitelist(**data.model_dump())
    db.add(obj)
    await db.commit()
    return success_response(message="已添加 IP 白名单")

@router.put("/ip-whitelist/{ip_id}", response_model=Any)
async def update_ip_whitelist(
    ip_id: str,
    data: IpWhitelistUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    res = await db.execute(select(IpWhitelist).where(IpWhitelist.id == ip_id))
    obj = res.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="IP whitelist not found")
        
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(obj, key, value)

    await db.commit()
    return success_response(message="IP 白名单已更新")

@router.delete("/ip-whitelist/{ip_id}", response_model=Any)
async def delete_ip_whitelist(
    ip_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    await db.execute(delete(IpWhitelist).where(IpWhitelist.id == ip_id))
    await db.commit()
    return success_response(message="已移除 IP 白名单")

@router.put("/ip-whitelist/{ip_id}/status", response_model=Any)
async def update_ip_status(
    ip_id: str,
    status: bool,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    res = await db.execute(select(IpWhitelist).where(IpWhitelist.id == ip_id))
    obj = res.scalar_one_or_none()
    if obj:
        obj.status = status
        await db.commit()
    return success_response(message="IP 白名单状态已更新")

# ---------------------- 敏感词库 ----------------------
@router.get("/sensitive-words", response_model=Any)
async def get_sensitive_words(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    res = await db.execute(select(SensitiveWord).order_by(SensitiveWord.created_at.desc()))
    items = res.scalars().all()
    return success_response(data=[SensitiveWordOut.model_validate(i).model_dump(by_alias=True) for i in items])

@router.post("/sensitive-words", response_model=Any)
async def add_sensitive_word(
    data: SensitiveWordCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    obj = SensitiveWord(**data.model_dump())
    db.add(obj)
    await db.commit()
    return success_response(message="敏感词已添加")

@router.delete("/sensitive-words/{word_id}", response_model=Any)
async def delete_sensitive_word(
    word_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:backend"))]
):
    await db.execute(delete(SensitiveWord).where(SensitiveWord.id == word_id))
    await db.commit()
    return success_response(message="敏感词已删除")
