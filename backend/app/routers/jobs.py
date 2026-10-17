"""
DOCeasy - Jobs API Router
Handles job creation, status polling, file download, and deletion.
"""

import os
import json
import uuid
import asyncio
import logging
from typing import Optional, List, Tuple
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from app.core.config import settings
from app.core.jobs import (
    create_job, get_job, update_job, delete_job,
    get_job_dir, JobStatus
)
from app.core.validation import safe_filename, validate_pdf_signature

logger = logging.getLogger(__name__)
router = APIRouter(tags=["jobs"])

MIME_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".txt": "text/plain",
    ".zip": "application/zip",
}


class JobResponse(BaseModel):
    job_id: str
    status: str
    tool_id: str
    error: Optional[str] = None
    output_filename: Optional[str] = None
    output_size_bytes: Optional[int] = None
    input_size_bytes: Optional[int] = None


async def _save_upload(file: UploadFile, dest: str, max_bytes: int = None) -> int:
    """Save an uploaded file to disk, return file size in bytes."""
    if max_bytes is None:
        max_bytes = settings.MAX_UPLOAD_SIZE

    total = 0
    with open(dest, "wb") as f:
        while True:
            chunk = await file.read(65536)  # 64KB chunks
            if not chunk:
                break
            total += len(chunk)
            if total > max_bytes:
                os.remove(dest)
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB.",
                )
            f.write(chunk)
    return total


def _run_tool(job_id: str, tool_id: str, input_paths: List[str], options: dict, output_dir: str):
    """Synchronous tool dispatcher called from background task."""
    from app.services.pdf_service import (
        merge_pdfs, split_pdf_into_pages, split_pdf_by_ranges,
        extract_pages, delete_pages, rotate_pages, reorder_pages,
        reverse_pages, duplicate_pages, add_text_watermark, add_page_numbers,
        add_header_footer, pdf_to_images, images_to_pdf,
        compress_pdf, protect_pdf, unlock_pdf, get_metadata, set_metadata,
        remove_metadata, extract_text, zip_files, get_page_count,
        flatten_pdf, repair_pdf,
        PDFProcessingError
    )
    from app.services.conversion_service import (
        pdf_to_word, word_to_pdf, pdf_to_excel, pdf_to_pptx,
        ConversionError
    )

    password = options.get("password")
    stem = os.path.splitext(os.path.basename(input_paths[0]))[0] if input_paths else "output"

    try:
        output_file = None
        output_filename = None
        output_mime = "application/pdf"

        # ─── Organize ───────────────────────────────────────────────────────
        if tool_id == "merge":
            output_file = os.path.join(output_dir, "merged.pdf")
            merge_pdfs(input_paths, output_file, password)
            output_filename = "merged.pdf"

        elif tool_id == "split":
            split_mode = options.get("split_mode", "pages")
            ranges_str = str(options.get("ranges", "")).strip()
            if split_mode == "ranges" or (ranges_str and split_mode != "pages"):
                ranges = _parse_range_list(ranges_str, input_paths[0], password)
                files = split_pdf_by_ranges(input_paths[0], output_dir, ranges, password)
            else:
                files = split_pdf_into_pages(input_paths[0], output_dir, password)

            zip_path = os.path.join(output_dir, f"{stem}_pages.zip")
            zip_files(files, zip_path)
            output_file = zip_path
            output_filename = f"{stem}_pages.zip"
            output_mime = "application/zip"

        elif tool_id == "extract-pages":
            pages = _parse_page_list(options.get("pages", ""), input_paths[0], password)
            output_file = os.path.join(output_dir, f"{stem}_extracted.pdf")
            extract_pages(input_paths[0], output_file, pages, password)
            output_filename = f"{stem}_extracted.pdf"

        elif tool_id == "delete-pages":
            pages = _parse_page_list(options.get("pages", ""), input_paths[0], password)
            output_file = os.path.join(output_dir, f"{stem}_deleted.pdf")
            delete_pages(input_paths[0], output_file, pages, password)
            output_filename = f"{stem}_deleted.pdf"

        elif tool_id == "rotate":
            rotation = int(options.get("rotation", 90))
            pages = _parse_page_list(options.get("pages", ""), input_paths[0], password) or None
            output_file = os.path.join(output_dir, f"{stem}_rotated.pdf")
            rotate_pages(input_paths[0], output_file, rotation, pages, password)
            output_filename = f"{stem}_rotated.pdf"

        elif tool_id == "reorder":
            new_order = [int(p) for p in options.get("order", "").split(",") if p.strip().isdigit()]
            if not new_order:
                raise PDFProcessingError("Please provide the new page order.")
            output_file = os.path.join(output_dir, f"{stem}_reordered.pdf")
            reorder_pages(input_paths[0], output_file, new_order, password)
            output_filename = f"{stem}_reordered.pdf"

        elif tool_id == "reverse":
            output_file = os.path.join(output_dir, f"{stem}_reversed.pdf")
            reverse_pages(input_paths[0], output_file, password)
            output_filename = f"{stem}_reversed.pdf"

        elif tool_id == "duplicate-pages":
            pages = _parse_page_list(options.get("pages", ""), input_paths[0], password)
            output_file = os.path.join(output_dir, f"{stem}_duplicated.pdf")
            duplicate_pages(input_paths[0], output_file, pages, password)
            output_filename = f"{stem}_duplicated.pdf"

        elif tool_id == "add-page-numbers":
            output_file = os.path.join(output_dir, f"{stem}_numbered.pdf")
            add_page_numbers(
                input_paths[0], output_file,
                position=options.get("position", "bottom-center"),
                start_number=int(options.get("start_number", 1)),
                font_size=int(options.get("font_size", 12)),
                prefix=options.get("prefix", ""),
                suffix=options.get("suffix", ""),
                password=password,
            )
            output_filename = f"{stem}_numbered.pdf"

        elif tool_id == "add-header-footer":
            output_file = os.path.join(output_dir, f"{stem}_header_footer.pdf")
            add_header_footer(
                input_paths[0], output_file,
                header_text=options.get("header_text", ""),
                footer_text=options.get("footer_text", ""),
                font_size=int(options.get("font_size", 10)),
                password=password,
            )
            output_filename = f"{stem}_header_footer.pdf"

        # ─── Compress ────────────────────────────────────────────────────────
        elif tool_id == "compress":
            output_file = os.path.join(output_dir, f"{stem}_compressed.pdf")
            orig_size, out_size = compress_pdf(
                input_paths[0], output_file,
                quality=options.get("quality", "medium"),
                password=password,
            )
            output_filename = f"{stem}_compressed.pdf"
            update_job(job_id, metadata={
                "original_size": orig_size,
                "output_size": out_size,
                "reduction_pct": round((1 - out_size / orig_size) * 100, 1) if orig_size > 0 else 0,
            })

        # ─── Convert FROM PDF ─────────────────────────────────────────────
        elif tool_id in ("pdf-to-jpg", "pdf-to-png"):
            fmt = "jpg" if tool_id == "pdf-to-jpg" else "png"
            dpi = int(options.get("dpi", 150))
            files = pdf_to_images(input_paths[0], output_dir, fmt=fmt, dpi=dpi, password=password)
            if len(files) == 1:
                output_file = files[0]
                output_filename = os.path.basename(files[0])
                output_mime = "image/jpeg" if fmt == "jpg" else "image/png"
            else:
                zip_path = os.path.join(output_dir, f"{stem}_{fmt}.zip")
                zip_files(files, zip_path)
                output_file = zip_path
                output_filename = f"{stem}_{fmt}.zip"
                output_mime = "application/zip"

        elif tool_id == "pdf-to-word":
            output_file = os.path.join(output_dir, f"{stem}.docx")
            pdf_to_word(input_paths[0], output_file, password)
            output_filename = f"{stem}.docx"
            output_mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        elif tool_id == "pdf-to-excel":
            output_file = os.path.join(output_dir, f"{stem}.xlsx")
            pdf_to_excel(input_paths[0], output_file, password)
            output_filename = f"{stem}.xlsx"
            output_mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        elif tool_id == "pdf-to-pptx":
            output_file = os.path.join(output_dir, f"{stem}.pptx")
            pdf_to_pptx(input_paths[0], output_file, password)
            output_filename = f"{stem}.pptx"
            output_mime = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

        # ─── Convert TO PDF ────────────────────────────────────────────────
        elif tool_id in ("jpg-to-pdf", "png-to-pdf", "images-to-pdf"):
            output_file = os.path.join(output_dir, "images.pdf")
            images_to_pdf(input_paths, output_file)
            output_filename = "images.pdf"

        elif tool_id == "word-to-pdf":
            output_file = os.path.join(output_dir, f"{stem}.pdf")
            word_to_pdf(input_paths[0], output_file)
            output_filename = f"{stem}.pdf"

        # ─── Edit ────────────────────────────────────────────────────────────
        elif tool_id == "watermark":
            output_file = os.path.join(output_dir, f"{stem}_watermarked.pdf")
            add_text_watermark(
                input_paths[0], output_file,
                text=options.get("text", "DRAFT"),
                opacity=float(options.get("opacity", 0.3)),
                rotation=int(options.get("rotation", 45)),
                font_size=int(options.get("font_size", 60)),
                color=options.get("color", "gray"),
                password=password,
            )
            output_filename = f"{stem}_watermarked.pdf"

        elif tool_id == "flatten":
            output_file = os.path.join(output_dir, f"{stem}_flattened.pdf")
            flatten_pdf(input_paths[0], output_file, password=password)
            output_filename = f"{stem}_flattened.pdf"

        # ─── Security & Diagnostics ──────────────────────────────────────────
        elif tool_id == "protect":
            new_password = options.get("new_password", "")
            if not new_password:
                raise PDFProcessingError("Please provide a password to protect the PDF.")
            output_file = os.path.join(output_dir, f"{stem}_protected.pdf")
            protect_pdf(input_paths[0], output_file, new_password, password=password)
            output_filename = f"{stem}_protected.pdf"

        elif tool_id == "unlock":
            if not password:
                raise PDFProcessingError("Please provide the current password to unlock the PDF.")
            output_file = os.path.join(output_dir, f"{stem}_unlocked.pdf")
            unlock_pdf(input_paths[0], output_file, password)
            output_filename = f"{stem}_unlocked.pdf"

        elif tool_id == "metadata":
            action = options.get("action", "get")
            if action == "get":
                # Return metadata as JSON file
                meta = get_metadata(input_paths[0], password)
                output_file = os.path.join(output_dir, f"{stem}_metadata.json")
                with open(output_file, "w") as mf:
                    json.dump(meta, mf, indent=2)
                output_filename = f"{stem}_metadata.json"
                output_mime = "application/json"
            elif action == "remove":
                output_file = os.path.join(output_dir, f"{stem}_cleared.pdf")
                remove_metadata(input_paths[0], output_file, password)
                output_filename = f"{stem}_cleared.pdf"
            else:
                output_file = os.path.join(output_dir, f"{stem}_edited.pdf")
                set_metadata(
                    input_paths[0], output_file,
                    title=options.get("title", ""),
                    author=options.get("author", ""),
                    subject=options.get("subject", ""),
                    password=password,
                )
                output_filename = f"{stem}_edited.pdf"

        elif tool_id == "repair":
            output_file = os.path.join(output_dir, f"{stem}_repaired.pdf")
            repair_pdf(input_paths[0], output_file, password=password)
            output_filename = f"{stem}_repaired.pdf"

        # ─── Extract ─────────────────────────────────────────────────────────
        elif tool_id == "extract-text":
            text = extract_text(input_paths[0], password)
            output_file = os.path.join(output_dir, f"{stem}_text.txt")
            with open(output_file, "w", encoding="utf-8") as tf:
                tf.write(text)
            output_filename = f"{stem}_text.txt"
            output_mime = "text/plain"

        elif tool_id == "extract-images":
            files = _extract_images_from_pdf(input_paths[0], output_dir, password)
            if not files:
                raise PDFProcessingError("No extractable images found in this PDF.")
            zip_path = os.path.join(output_dir, f"{stem}_images.zip")
            zip_files(files, zip_path)
            output_file = zip_path
            output_filename = f"{stem}_images.zip"
            output_mime = "application/zip"

        else:
            raise PDFProcessingError(f"Unknown tool: {tool_id}")

        # Validate output file was created
        if not output_file or not os.path.exists(output_file):
            raise PDFProcessingError("Processing failed: output file was not created.")

        out_size = os.path.getsize(output_file)
        update_job(
            job_id,
            status=JobStatus.COMPLETED,
            output_file=output_file,
            output_filename=output_filename,
            output_mime=output_mime,
            output_size_bytes=out_size,
        )
        logger.info(f"Job {job_id} completed: {output_filename} ({out_size} bytes)")

    except (PDFProcessingError, ConversionError) as e:
        update_job(job_id, status=JobStatus.FAILED, error=str(e))
        logger.warning(f"Job {job_id} failed (processing error): {e}")
    except Exception as e:
        update_job(job_id, status=JobStatus.FAILED, error="An unexpected error occurred. Please try again.")
        logger.exception(f"Job {job_id} failed with unexpected error: {e}")


def _parse_page_list(pages_str: str, input_path: str, password: Optional[str]) -> List[int]:
    """Parse a page list string like '1,3,5-8' into a list of ints."""
    from app.services.pdf_service import get_page_count
    try:
        n = get_page_count(input_path, password)
    except Exception:
        n = 9999

    pages = []
    for part in pages_str.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start, end = part.split("-", 1)
            start, end = int(start.strip()), int(end.strip())
            pages.extend(range(start, end + 1))
        else:
            pages.append(int(part))

    # Remove duplicates, sort, filter valid
    return sorted(set(p for p in pages if 1 <= p <= n))


def _parse_range_list(ranges_str: str, input_path: str, password: Optional[str]) -> List[Tuple[int, int]]:
    """Parse range string like '1-3, 4-6' into list of (start, end) tuples."""
    from app.services.pdf_service import get_page_count
    try:
        n = get_page_count(input_path, password)
    except Exception:
        n = 9999

    ranges = []
    for part in ranges_str.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            s, e = part.split("-", 1)
            start, end = int(s.strip()), int(e.strip())
        else:
            start = end = int(part)
        if start < 1 or end > n or start > end:
            raise PDFProcessingError(f"Invalid page range {part}. Document has {n} pages.")
        ranges.append((start, end))

    if not ranges:
        raise PDFProcessingError("Please provide valid page ranges (e.g. 1-2, 3-5).")
    return ranges


def _extract_images_from_pdf(input_path: str, output_dir: str, password: Optional[str]) -> List[str]:
    """Extract embedded images from a PDF using PyMuPDF (with pikepdf fallback)."""
    # 1. Try PyMuPDF (fast, self-contained, handles all filters & colorspaces)
    try:
        import pymupdf
        doc = pymupdf.open(input_path)
        if doc.is_encrypted:
            if not password or not doc.authenticate(password):
                doc.close()
                raise PDFProcessingError("This PDF is password-protected. Please provide the correct password.")

        files = []
        img_idx = 0
        seen_xrefs = set()

        for page_num in range(len(doc)):
            image_list = doc.get_page_images(page_num)
            for img_info in image_list:
                xref = img_info[0]
                if xref in seen_xrefs:
                    continue
                seen_xrefs.add(xref)
                try:
                    base_img = doc.extract_image(xref)
                    img_bytes = base_img.get("image")
                    ext = base_img.get("ext", "png")
                    if img_bytes:
                        img_idx += 1
                        out_path = os.path.join(output_dir, f"page{page_num+1}_img{img_idx}.{ext}")
                        with open(out_path, "wb") as f:
                            f.write(img_bytes)
                        files.append(out_path)
                except Exception:
                    continue

        doc.close()
        if files:
            return files
    except PDFProcessingError:
        raise
    except Exception as e:
        logger.warning(f"PyMuPDF image extraction failed: {e}. Trying pikepdf fallback.")

    # 2. Pikepdf fallback
    import pikepdf
    from PIL import Image as PILImage

    files = []
    try:
        with pikepdf.open(input_path, password=password or "") as pdf:
            for page_num, page in enumerate(pdf.pages):
                if "/Resources" not in page:
                    continue
                resources = page.get("/Resources", {})
                xobjects = resources.get("/XObject", {})
                img_count = 0
                for name, xobj in xobjects.items():
                    if xobj.get("/Subtype") != "/Image":
                        continue
                    try:
                        data = bytes(xobj.read_raw_bytes())
                        w = int(xobj["/Width"])
                        h = int(xobj["/Height"])
                        cs = xobj.get("/ColorSpace", "/DeviceRGB")

                        filt = xobj.get("/Filter", "")
                        if str(filt) == "/DCTDecode":
                            out_path = os.path.join(output_dir, f"page{page_num+1}_img{img_count+1}.jpg")
                            with open(out_path, "wb") as f:
                                f.write(data)
                        else:
                            mode = "RGB" if str(cs) == "/DeviceRGB" else "L"
                            try:
                                img = PILImage.frombytes(mode, (w, h), data)
                                out_path = os.path.join(output_dir, f"page{page_num+1}_img{img_count+1}.png")
                                img.save(out_path)
                            except Exception:
                                continue

                        files.append(out_path)
                        img_count += 1
                    except Exception:
                        continue
    except Exception as e:
        raise PDFProcessingError(f"Image extraction failed: {e}")

    return files


# ─── API Endpoints ────────────────────────────────────────────────────────────

@router.post("/jobs", response_model=JobResponse)
async def create_job_endpoint(
    background_tasks: BackgroundTasks,
    tool_id: str = Form(...),
    files: List[UploadFile] = File(...),
    options: str = Form(default="{}"),
):
    """Create and start a processing job."""
    # Validate tool exists
    from app.routers.tools import TOOL_REGISTRY
    tool = next((t for t in TOOL_REGISTRY if t.id == tool_id), None)
    if not tool:
        raise HTTPException(status_code=400, detail=f"Unknown tool: {tool_id}")

    # Validate file count
    if len(files) > tool.max_files:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. This tool accepts up to {tool.max_files} file(s).",
        )
    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    # Parse options
    try:
        opts = json.loads(options)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid options JSON.")

    # Create job
    job = create_job(tool_id)
    job_dir = get_job_dir(job.job_id)
    input_dir = os.path.join(job_dir, "input")
    os.makedirs(input_dir, exist_ok=True)
    output_dir = os.path.join(job_dir, "output")
    os.makedirs(output_dir, exist_ok=True)

    # Save uploaded files
    input_paths = []
    total_input_size = 0
    for upload in files:
        safe_name = safe_filename(upload.filename or "file")
        dest = os.path.join(input_dir, safe_name)
        size = await _save_upload(upload, dest, tool.max_file_size_mb * 1024 * 1024)
        total_input_size += size
        input_paths.append(dest)

    update_job(job.job_id, status=JobStatus.PROCESSING, input_files=input_paths, input_size_bytes=total_input_size)

    # Run tool in background
    background_tasks.add_task(_run_tool, job.job_id, tool_id, input_paths, opts, output_dir)

    return JobResponse(
        job_id=job.job_id,
        status=JobStatus.PROCESSING,
        tool_id=tool_id,
    )


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job_status(job_id: str):
    """Get the current status of a job."""
    # Validate UUID format
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format.")

    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or has expired.")

    return JobResponse(
        job_id=job.job_id,
        status=job.status,
        tool_id=job.tool_id,
        error=job.error,
        output_filename=job.output_filename,
        output_size_bytes=job.output_size_bytes,
        input_size_bytes=job.input_size_bytes,
    )


@router.get("/jobs/{job_id}/download")
async def download_job_result(job_id: str):
    """Download the output file of a completed job."""
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format.")

    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or has expired.")
    if job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail=f"Job is not completed (status: {job.status}).")
    if not job.output_file or not os.path.exists(job.output_file):
        raise HTTPException(status_code=404, detail="Output file not found.")

    ext = os.path.splitext(job.output_file)[1].lower()
    mime = MIME_TYPES.get(ext, "application/octet-stream")

    return FileResponse(
        path=job.output_file,
        media_type=mime,
        filename=job.output_filename or "output",
        headers={"Content-Disposition": f'attachment; filename="{job.output_filename}"'},
    )


@router.delete("/jobs/{job_id}")
async def delete_job_endpoint(job_id: str):
    """Delete a job and clean up its files."""
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format.")

    deleted = delete_job(job_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found.")
    return {"message": "Job deleted successfully."}


@router.get("/jobs/{job_id}/metadata")
async def get_job_metadata(job_id: str):
    """Return extra metadata for a job (e.g. compression stats)."""
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format.")

    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job.metadata
