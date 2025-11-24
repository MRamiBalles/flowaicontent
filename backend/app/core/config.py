from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lovable AI Core"
    API_V1_STR: str = "/api/v1"
    
    # AI Model Configuration
    MODEL_DEVICE: str = "cpu" # 'cuda' for GPU
    MAX_CONTEXT_LENGTH: int = 32000

    class Config:
        case_sensitive = True

settings = Settings()
