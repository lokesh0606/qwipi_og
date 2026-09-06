"""
LLM Provider Engine for Qwipi AI.
Powered by Groq's high-speed LPU inference with extensible provider architecture.
All Azure dependencies have been completely removed.
"""
from typing import AsyncGenerator, Optional, List, Dict, Any
import os
import json
import openai
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.models import SystemConfig

# Ensure both root and local .env are loaded
_base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_base_dir, ".env"), override=True)
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"), override=True)
load_dotenv(override=True)


class BaseLLMProvider:
    """Base interface for all LLM providers."""
    
    async def client(
        self, 
        messages: List[Dict[str, str]], 
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion content from multi-turn message history."""
        raise NotImplementedError
        
    async def generate_title_stream(
        self, 
        conversation_messages: List[Dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        """Stream conversational title generation."""
        raise NotImplementedError


class GroqProvider(BaseLLMProvider):
    """
    Groq LLM Provider running via OpenAI-compatible API.
    Offers ultra-low-latency streaming completions for open-weights models.
    """
    
    DEFAULT_MODEL = "openai/gpt-oss-120b"
    BASE_URL = "https://api.groq.com/openai/v1"

    def __init__(self, model_name: Optional[str] = None):
        self.API_KEY = os.getenv("GROQ_API_KEY")
        self.MODEL_NAME = model_name or self.DEFAULT_MODEL

    async def _get_client(self) -> openai.AsyncOpenAI:
        api_key = (self.API_KEY or "").strip()
        if not api_key:
            raise ValueError("GROQ_API_KEY is missing from environment variables.")
        return openai.AsyncOpenAI(
            api_key=api_key,
            base_url=self.BASE_URL,
            timeout=60.0
        )

    async def client(
        self, 
        messages: List[Dict[str, str]], 
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completions with full multi-turn conversational history.
        """
        client = await self._get_client()

        # Construct payload with system instructions
        formatted_messages: List[Dict[str, str]] = []
        default_system = (
            system_prompt or 
            "You are Qwipi AI, a helpful, intelligent, and accurate assistant."
        )

        has_system = any(m.get("role") == "system" for m in messages)
        if not has_system:
            formatted_messages.append({"role": "system", "content": default_system})

        formatted_messages.extend(messages)

        try:
            completion = await client.chat.completions.create(
                model=self.MODEL_NAME,
                temperature=0.7,
                messages=formatted_messages,
                stream=True,
            )
            
            async for event in completion:
                if event.choices and len(event.choices) > 0:
                    delta = event.choices[0].delta
                    content = delta.content
                    if content:
                        yield content

        except openai.APIConnectionError:
            yield "\n\n**Connection Error**: Unable to reach Groq API. Please check your network connection."
        except openai.RateLimitError:
            yield "\n\n**Rate Limit**: Groq API rate limit exceeded. Please wait a moment before trying again."
        except openai.AuthenticationError:
            yield "\n\n**Authentication Error**: Invalid Groq API key configured in .env."
        except openai.APIStatusError as e:
            yield f"\n\n**API Error**: Groq returned status {e.status_code}: {e.message}"
        except Exception as e:
            yield f"\n\n**Unexpected Error**: {str(e)}"

    async def generate_title_stream(
        self, 
        conversation_messages: List[Dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        """
        Stream short title generation (3-5 words) using recent message context (up to 6 messages).
        Allocates max_tokens=200 to accommodate reasoning tokens before content emission.
        """
        try:
            client = await self._get_client()
            
            messages_text = ""
            for msg in conversation_messages[-6:]: 
                role = msg.get("role", "user")
                content = (msg.get("content") or "").strip()[:200]
                if content:
                    messages_text += f"{role}: {content}\n"

            if not messages_text.strip():
                return

            prompt = (
                "Generate a concise, catchy 3-to-5 word title summarizing this conversation. "
                "Output ONLY the title, without quotes, markdown, or preamble.\n\n"
                f"Conversation:\n{messages_text}\nTitle:"
            )

            completion = await client.chat.completions.create(
                model=self.MODEL_NAME,
                temperature=0.3,
                max_tokens=200,
                messages=[
                    {"role": "system", "content": "You generate concise conversation titles in 3 to 5 words without quotes or formatting."},
                    {"role": "user", "content": prompt},
                ],
                stream=True,
            )
            
            async for event in completion:
                if event.choices and len(event.choices) > 0:
                    delta = event.choices[0].delta
                    content = delta.content
                    if content:
                        # Clean quotes, backticks, and newlines
                        cleaned = content.replace('"', '').replace("'", "").replace('`', '').replace('\n', ' ')
                        if cleaned:
                            yield cleaned
        except Exception as e:
            print(f"Error generating title stream: {e}")
            return


class LLMFactory:
    """
    Registry and factory for LLM providers loading dynamically from DB or defaults.
    Extensible architecture allowing future additions (e.g. Ollama, Anthropic).
    """
    
    _class_mapping = {
        "groq": GroqProvider,
    }

    _default_providers = {
        "groq": {
            "name": "Groq",
            "enabled_env": "GROQ_ENABLED",
            "key_env": "GROQ_API_KEY",
            "models": [
                {"id": "openai/gpt-oss-120b", "name": "GPT-OSS 120B (High Capability)"},
                {"id": "openai/gpt-oss-20b", "name": "GPT-OSS 20B (Ultra Fast)"},
                {"id": "qwen/qwen3.8-27b", "name": "Qwen 3.8 27B (Versatile)"}
            ]
        }
    }

    @classmethod
    async def _load_providers(cls, db: AsyncSession) -> dict:
        try:
            result = await db.execute(select(SystemConfig).where(SystemConfig.key == "llm_providers"))
            config = result.scalars().first()
            if config:
                loaded = json.loads(config.value)
                # Purge any legacy Azure entries stored in database
                if "azure" in loaded:
                    loaded = cls._default_providers
                    config.value = json.dumps(cls._default_providers)
                    await db.commit()
                return loaded
            
            # Seed the database if not present
            config = SystemConfig(key="llm_providers", value=json.dumps(cls._default_providers))
            db.add(config)
            await db.commit()
            return cls._default_providers
        except Exception as e:
            print(f"Error loading providers from DB: {e}")
            return cls._default_providers

    @classmethod
    def is_enabled(cls, provider_id: str, config: dict) -> bool:
        enabled_str = os.getenv(config.get("enabled_env", ""), "false").lower()
        enabled = enabled_str in ("true", "1", "yes")
        has_key = bool(os.getenv(config.get("key_env", "")))
        return enabled and has_key

    @classmethod
    async def get_provider(
        cls, 
        provider_name: Optional[str] = None, 
        model_name: Optional[str] = None, 
        db: Optional[AsyncSession] = None
    ) -> BaseLLMProvider:
        provider_name = (provider_name or "groq").lower().strip()
        
        # Load providers config
        providers_config = cls._default_providers
        if db:
            providers_config = await cls._load_providers(db)
            
        # Fallback to groq if unknown or disabled
        if provider_name not in providers_config or not cls.is_enabled(provider_name, providers_config[provider_name]):
            enabled_providers = [p for p in providers_config if cls.is_enabled(p, providers_config[p])]
            provider_name = enabled_providers[0] if enabled_providers else "groq"
            model_name = None
            
        provider_config = providers_config.get(provider_name, cls._default_providers["groq"])
        supported_model_ids = [m["id"] for m in provider_config.get("models", [])]
        
        if not model_name or model_name not in supported_model_ids:
            model_name = supported_model_ids[0] if supported_model_ids else GroqProvider.DEFAULT_MODEL
            
        provider_class = cls._class_mapping.get(provider_name, GroqProvider)
        return provider_class(model_name=model_name)

    @classmethod
    async def get_enabled_providers(cls, db: AsyncSession) -> list:
        providers_config = await cls._load_providers(db)
        enabled_list = []
        for pid, config in providers_config.items():
            if cls.is_enabled(pid, config):
                enabled_list.append({
                    "id": pid,
                    "name": config["name"],
                    "models": config["models"]
                })
        # If none enabled by env check, provide groq definition as fallback
        if not enabled_list:
            enabled_list.append({
                "id": "groq",
                "name": "Groq",
                "models": cls._default_providers["groq"]["models"]
            })
        return enabled_list