"""
系统设置路由
GET    /api/v1/settings                    — 获取全局设置
POST   /api/v1/settings                    — 更新设置
PUT    /api/v1/settings/batch              — 批量更新
PUT    /api/v1/settings/global             — 全局设置保存
PUT    /api/v1/settings/security           — 安全设置保存

# 前端 settings/index.tsx 使用的代理路径:
GET    /api/v1/settings/departments        — 部门列表 (代理 /admin/departments)
GET    /api/v1/settings/logistics          — 物流列表 (代理 /admin/logistics)
GET    /api/v1/settings/ip-whitelist       — IP白名单 (代理 /admin/ip-whitelist)
GET    /api/v1/settings/sensitive-words    — 敏感词 (代理 /admin/sensitive-words)
GET    /api/v1/settings/im-conversations   — IM会话记录
GET    /api/v1/settings/im-messages        — IM消息记录

权限对齐 seed.py — settings:system / settings:backend
"""
from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, require_permission
from app.db.session import get_db
from app.models.user import User
from app.models.setting import SystemSetting
from app.schemas.response import success_response

router = APIRouter(prefix="/settings", tags=["系统设置"])

@router.get("")
async def get_settings(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    group: str = "global",
):
    """获取指定分组的设置"""
    result = await db.execute(select(SystemSetting).where(SystemSetting.group == group))
    items = result.scalars().all()
    data = {item.key: item.value for item in items}
    return success_response(data=data)

@router.post("")
async def update_settings(
    body: dict[str, Any],
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:system"))],
    group: str = "global",
):
    """批量更新设置"""
    for key, value in body.items():
        res = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        setting = res.scalar_one_or_none()
        if setting:
            setting.value = str(value)
        else:
            setting = SystemSetting(key=key, value=str(value), group=group)
            db.add(setting)

    await db.commit()
    return success_response(message="设置已更新")

@router.put("/batch")
async def batch_update_settings(
    body: dict,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:system"))],
):
    for key, val in body.items():
        res = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        s = res.scalar_one_or_none()
        if s:
            s.value = str(val)
        else:
            s = SystemSetting(key=key, value=str(val))
            db.add(s)
    await db.commit()
    return success_response(message="保存成功")

@router.put("/global")
async def update_global_settings(
    body: dict[str, Any],
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:system"))],
):
    """更新全局设置"""
    for key, val in body.items():
        res = await db.execute(select(SystemSetting).where(SystemSetting.key == key, SystemSetting.group == "global"))
        s = res.scalar_one_or_none()
        if s:
            s.value = str(val)
        else:
            s = SystemSetting(key=key, value=str(val), group="global")
            db.add(s)
    await db.commit()
    return success_response(message="全局设置已保存")

@router.put("/security")
async def update_security_settings(
    body: dict[str, Any],
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:system"))],
):
    """更新安全选项"""
    for key, val in body.items():
        res = await db.execute(select(SystemSetting).where(SystemSetting.key == key, SystemSetting.group == "security"))
        s = res.scalar_one_or_none()
        if s:
            s.value = str(val)
        else:
            s = SystemSetting(key=key, value=str(val), group="security")
            db.add(s)
    await db.commit()
    return success_response(message="安全选项已保存")


# ============================================================
# 前端 settings/index.tsx 使用的代理路径
# 前端请求 /settings/departments 而非 /admin/departments
# ============================================================

@router.get("/departments")
async def get_departments_proxy(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:system"))],
):
    """代理部门列表 — 前端 settings/index.tsx 使用"""
    from app.models.admin_model import Department
    from app.schemas.admin_schema import DepartmentOut
    result = await db.execute(select(Department).order_by(Department.created_at.desc()))
    items = result.scalars().all()
    data = [DepartmentOut.model_validate(item).model_dump(by_alias=True) for item in items]
    return success_response(data=data)


@router.get("/logistics")
async def get_logistics_proxy(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:system"))],
):
    """代理物流公司列表"""
    from app.models.admin_model import LogisticsCompany
    from app.schemas.admin_schema import LogisticsCompanyOut
    res = await db.execute(select(LogisticsCompany).order_by(LogisticsCompany.created_at.asc()))
    items = res.scalars().all()
    return success_response(data=[LogisticsCompanyOut.model_validate(i).model_dump() for i in items])


@router.get("/ip-whitelist")
async def get_ip_whitelist_proxy(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:system"))],
):
    """代理 IP 白名单"""
    from app.models.admin_model import IpWhitelist
    from app.schemas.admin_schema import IpWhitelistOut
    res = await db.execute(select(IpWhitelist).order_by(IpWhitelist.created_at.desc()))
    items = res.scalars().all()
    return success_response(data=[IpWhitelistOut.model_validate(i).model_dump(by_alias=True) for i in items])


@router.get("/sensitive-words")
async def get_sensitive_words_proxy(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:system"))],
):
    """代理敏感词列表"""
    from app.models.admin_model import SensitiveWord
    from app.schemas.admin_schema import SensitiveWordOut
    res = await db.execute(select(SensitiveWord).order_by(SensitiveWord.created_at.desc()))
    items = res.scalars().all()
    return success_response(data=[SensitiveWordOut.model_validate(i).model_dump(by_alias=True) for i in items])


@router.get("/im-conversations")
async def get_im_conversations(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:system"))],
):
    """IM 会话列表 — 前端 settings/index.tsx 即时通讯审计使用"""
    from app.models.im_conversation import IMConversation
    result = await db.execute(
        select(IMConversation)
        .where(IMConversation.is_deleted == False)
        .order_by(IMConversation.created_at.desc())
    )
    items = result.scalars().all()
    data = [{
        "id": c.id,
        "name": c.name,
        "type": c.type,
        "lastMessage": c.last_message or "",
        "time": c.last_time or "",
        "avatar": c.avatar,
        "avatarLabel": c.avatar_label,
        "avatarColor": c.avatar_color,
        "department": c.department,
        "employeeId": c.employee_id,
    } for c in items]
    return success_response(data=data)


@router.get("/im-messages")
async def get_im_messages(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:system"))],
):
    """IM 消息列表 — 返回 {conversationId: messages[]}"""
    from app.models.im_message import IMMessage
    result = await db.execute(
        select(IMMessage)
        .where(IMMessage.is_deleted == False)
        .order_by(IMMessage.created_at.asc())
    )
    items = result.scalars().all()
    grouped: dict[str, list] = {}
    for m in items:
        cid = m.conversation_id
        if cid not in grouped:
            grouped[cid] = []
        grouped[cid].append({
            "id": m.id,
            "senderName": m.sender_name or "",
            "senderExt": m.sender_ext or "",
            "senderDept": m.sender_dept or "",
            "senderAvatar": m.sender_avatar or "",
            "direction": m.direction,
            "type": m.content_type,
            "content": m.content,
            "time": m.display_time or "",
            "fileName": m.file_name,
            "fileSize": m.file_size,
        })
    return success_response(data=grouped)


@router.put("/logistics/{comp_id}/status")
async def update_logistics_status_proxy(
    comp_id: str,
    request_data: dict,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("settings:system"))],
):
    """代理更新物流公司状态 — 前端 settings/index.tsx 使用"""
    from app.models.admin_model import LogisticsCompany
    status = request_data.get("status", False)
    res = await db.execute(select(LogisticsCompany).where(LogisticsCompany.id == comp_id))
    comp = res.scalar_one_or_none()
    if comp:
        comp.status = status
        await db.commit()
    return success_response(message="物流公司状态已更新")

