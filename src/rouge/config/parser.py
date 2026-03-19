import os
from typing import Any, Dict, List, Literal, Optional

import yaml
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AuthCredentials(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    totp_secret: Optional[str] = None


class Authentication(BaseModel):
    login_type: Literal["form", "sso", "api", "basic"] = "form"
    login_url: Optional[str] = None
    credentials: Optional[AuthCredentials] = None
    login_flow: List[str] = []
    success_condition: Dict[str, Any] = {}


class Rule(BaseModel):
    description: str
    type: str = "path"
    url_path: Optional[str] = None


class PipelineConfig(BaseModel):
    retry_preset: Literal["default", "subscription"] = "default"
    max_concurrent_pipelines: int = 5


class DistributedConfig(BaseModel):
    authentication: Optional[Authentication] = None
    avoid: List[Rule] = []
    focus: List[Rule] = []
    pipeline: PipelineConfig = PipelineConfig()


class RougeSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ollama_base_url: str = Field(default="http://localhost:11434")
    ollama_small_model: str = Field(default="llama3.1:8b")
    ollama_medium_model: str = Field(default="llama3.1:8b")
    ollama_large_model: str = Field(default="llama3.1:70b")

    temporal_address: str = Field(default="localhost:7233")
    temporal_namespace: str = Field(default="default")

    rouge_docker: bool = Field(default=False)


def load_config(config_path: Optional[str]) -> Optional[DistributedConfig]:
    if not config_path or not os.path.exists(config_path):
        return None

    with open(config_path, "r") as f:
        data = yaml.safe_load(f)
        return DistributedConfig(**data)
