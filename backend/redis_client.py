import os
import redis.asyncio as redis
from typing import Optional

# Global Redis client instance
redis_client: Optional[redis.Redis] = None

async def init_redis_pool() -> redis.Redis:
    """Initialize the Redis connection pool."""
    global redis_client
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client = redis.from_url(
        redis_url, 
        encoding="utf-8", 
        decode_responses=True
    )
    return redis_client

async def close_redis():
    """Close the Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.close()

async def get_redis_client() -> redis.Redis:
    """Get the initialized Redis client."""
    global redis_client
    if redis_client is None:
        await init_redis_pool()
    return redis_client
