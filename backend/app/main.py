"""
FastAPI 应用入口
对齐 BACKEND_CONTEXT.md § 4.1 架构设计
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.v1.router import v1_router
from app.db.session import engine
from app.db.base import Base

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期: 启动时创建表 (开发环境), 关闭时释放连接"""
    # 开发环境自动建表 — 生产环境应使用 Alembic 迁移
    async with engine.begin() as conn:
        # 导入所有模型确保注册到 Base.metadata
        import app.models  # noqa
        await conn.run_sync(Base.metadata.create_all)
    
    # 启动大屏数据定时推送逻辑
    import asyncio
    from app.services.screen_service import screen_service
    async def periodic_updates():
        while True:
            try:
                await screen_service.broadcast_updates()
            except Exception:
                pass
            await asyncio.sleep(10) # 每 10s 推送一次
            
    update_task = asyncio.create_task(periodic_updates())
    
    yield
    update_task.cancel()
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="网销 V6.0 CRM 后端 RESTful API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(v1_router)


@app.get("/health", tags=["系统"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
