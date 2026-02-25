"""
通用响应 Schema — 对齐 BACKEND_CONTEXT.md § 4.2 Standard Response
所有 API 响应统一使用此结构
"""
from typing import Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginationMeta(BaseModel):
    """分页元数据"""
    total: int
    page: int
    pageSize: int
    totalPages: int


class APIResponse(BaseModel, Generic[T]):
    """
    统一响应结构 — 对齐前端 APIResponse<T>
    {
      "code": 200,
      "message": "success",
      "data": { ... },
      "meta": { ... }
    }
    """
    code: int = 200
    message: str = "success"
    data: T | None = None
    meta: PaginationMeta | None = None


class ErrorResponse(BaseModel):
    """错误响应"""
    code: int
    message: str


def success_response(data: Any = None, message: str = "success") -> dict:
    """构建成功响应"""
    return {"code": 200, "message": message, "data": data}


def paginated_response(data: Any, total: int, page: int, page_size: int) -> dict:
    """构建分页响应"""
    total_pages = (total + page_size - 1) // page_size
    return {
        "code": 200,
        "message": "success",
        "data": data,
        "meta": {
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages,
        },
    }
