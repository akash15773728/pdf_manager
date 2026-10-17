"""DOCeasy - Background cleanup scheduler for expired jobs and temp files."""

import asyncio
import logging
from app.core.jobs import get_expired_jobs, delete_job
from app.core.config import settings

logger = logging.getLogger(__name__)


async def start_cleanup_scheduler():
    """Run cleanup every 15 minutes."""
    while True:
        try:
            await asyncio.sleep(900)  # 15 minutes
            await cleanup_expired_jobs()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Cleanup error: {e}")


async def cleanup_expired_jobs():
    """Delete jobs older than JOB_EXPIRY_SECONDS."""
    expired = get_expired_jobs()
    for job_id in expired:
        try:
            delete_job(job_id)
            logger.info(f"Cleaned up expired job: {job_id}")
        except Exception as e:
            logger.error(f"Failed to delete job {job_id}: {e}")
    return len(expired)
