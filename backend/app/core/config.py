from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Stylino API"
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30  # Reduced from 24 hours to 30 minutes
    refresh_token_expire_days: int = 7
    
    # CORS settings
    cors_origins: str = "http://localhost:3000,http://localhost:3001"  # Comma-separated origins
    
    # Email settings (for verification and password reset)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@stylino.com"
    frontend_url: str = "http://localhost:3000"
    
    # Payment gateway settings
    zarinpal_merchant_id: str = ""
    zarinpal_sandbox: bool = True
    zarinpal_callback_url: str = "http://localhost:3000/orders/callback"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list"""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
