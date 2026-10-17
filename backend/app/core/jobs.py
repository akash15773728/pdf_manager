"""DOCeasy - Job storage (in-memory, with disk results)."""

import os
import uuid
import time
import shutil
from typing import Dict, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
from app.core.config import settings


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Job:
    job_id: str
    tool_id: str
    status: JobStatus
    created_at: float
    updated_at: float
    input_files: list = field(default_factory=list)
    output_file: Optional[str] = None
    output_filename: Optional[str] = None
    output_mime: Optional[str] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    # Size tracking
    input_size_bytes: int = 0
    output_size_bytes: int = 0


# In-memory job store
_jobs: Dict[str, Job] = {}


def create_job(tool_id: str) -> Job:
    """Create a new job and return it."""
    job_id = str(uuid.uuid4())
    now = time.time()
    job = Job(
        job_id=job_id,
        tool_id=tool_id,
        status=JobStatus.PENDING,
        created_at=now,
        updated_at=now,
    )
    _jobs[job_id] = job
    # Create job directory
    os.makedirs(_get_job_dir(job_id), exist_ok=True)
    return job


def get_job(job_id: str) -> Optional[Job]:
    return _jobs.get(job_id)


def update_job(job_id: str, **kwargs) -> Optional[Job]:
    job = _jobs.get(job_id)
    if not job:
        return None
    for k, v in kwargs.items():
        setattr(job, k, v)
    job.updated_at = time.time()
    return job


def delete_job(job_id: str) -> bool:
    """Delete a job and its associated files."""
    job = _jobs.pop(job_id, None)
    if not job:
        return False
    # Remove job directory
    job_dir = _get_job_dir(job_id)
    if os.path.exists(job_dir):
        shutil.rmtree(job_dir, ignore_errors=True)
    return True


def get_expired_jobs(max_age_seconds: int = None) -> list:
    if max_age_seconds is None:
        max_age_seconds = settings.JOB_EXPIRY_SECONDS
    now = time.time()
    return [
        job_id for job_id, job in _jobs.items()
        if now - job.created_at > max_age_seconds
    ]


def _get_job_dir(job_id: str) -> str:
    # Validate job_id is a valid UUID to prevent path traversal
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise ValueError("Invalid job ID")
    return os.path.join(settings.TEMP_DIR, job_id)


def get_job_dir(job_id: str) -> str:
    return _get_job_dir(job_id)
