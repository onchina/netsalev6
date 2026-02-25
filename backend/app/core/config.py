"""
核心配置模块
从环境变量读取所有配置项，避免硬编码。
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # 应用基础配置
    APP_NAME: str = "NetSale V6.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    # 数据库配置 — 对齐 BACKEND_CONTEXT.md § 3
    POSTGRES_HOST: str = "1Panel-postgresql-RTuB"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "user_sdxNSw"
    POSTGRES_PASSWORD: str = "password_YZ7MZ4"
    POSTGRES_DB: str = "netsale_v6"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # JWT 配置
    SECRET_KEY: str = "netsale-v6-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
