from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    # DeepSeek
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"

    # Database (default: SQLite for local dev; set DATABASE_URL env for MySQL/Postgres in prod)
    database_url: str = "sqlite:///./global_ai_hub.db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # CORS
    cors_origins: str = "http://localhost:5173"

    # Storage
    storage_backend: str = "local"  # "local" or "s3"

    # JWT
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    # Copy Factory
    copy_provider: str = "deepseek"  # "deepseek" or future providers

    # SP-API
    sp_api_client: str = "mock"  # "mock" or "amazon"

    # Image Factory
    background_remover: str = "mock"  # "mock" or "removebg"
    scene_generator: str = "mock"  # "mock" or "replicate"
    image_processing_async: bool = False  # True = Celery, False = sync

    def is_jwt_secret_default(self) -> bool:
        return self.jwt_secret_key in ("change-me", "")


settings = Settings()
