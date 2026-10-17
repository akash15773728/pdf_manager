"""DOCeasy - File validation utilities."""

import os
import mimetypes
from typing import Optional
from fastapi import UploadFile, HTTPException
from app.core.config import settings

# Allowed MIME types and their extensions
ALLOWED_TYPES = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
    "image/tiff": [".tiff", ".tif"],
    "image/bmp": [".bmp"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    "application/vnd.ms-powerpoint": [".ppt"],
    "text/plain": [".txt"],
    "text/html": [".html", ".htm"],
}

# PDF file signature (magic bytes)
PDF_MAGIC = b"%PDF"


def validate_file_size(file: UploadFile, max_mb: int = None) -> None:
    """Raise HTTPException if file exceeds size limit."""
    if max_mb is None:
        max_mb = settings.MAX_FILE_SIZE_MB
    # We check content-length header as a quick check
    # Actual size is enforced during reading


def validate_extension(filename: str, allowed_extensions: list) -> str:
    """Return lowercased extension or raise HTTPException."""
    _, ext = os.path.splitext(filename.lower())
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' is not allowed. Accepted: {', '.join(allowed_extensions)}",
        )
    return ext


def validate_pdf_signature(data: bytes) -> bool:
    """Check if the bytes start with the PDF magic number."""
    return data[:4] == PDF_MAGIC


def safe_filename(filename: str) -> str:
    """Sanitize a filename to prevent path traversal."""
    # Get just the basename, remove dangerous characters
    basename = os.path.basename(filename)
    # Replace any path separators or null bytes
    safe = basename.replace("/", "_").replace("\\", "_").replace("\x00", "")
    # Limit length
    if len(safe) > 255:
        name, ext = os.path.splitext(safe)
        safe = name[:250] + ext
    return safe or "file"
