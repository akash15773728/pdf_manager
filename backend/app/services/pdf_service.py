"""
DOCeasy - PDF Processing Service
Core PDF manipulation operations using pypdf, pikepdf, reportlab, and Pillow.
"""

import os
import io
import zipfile
import logging
from typing import List, Optional, Tuple
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError, EmptyFileError
import pikepdf
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from PIL import Image

logger = logging.getLogger(__name__)


class PDFProcessingError(Exception):
    """Raised when a PDF operation fails."""
    pass


def _open_pdf(path: str, password: Optional[str] = None) -> PdfReader:
    """Open a PDF file, optionally with a password."""
    try:
        reader = PdfReader(path)
        if reader.is_encrypted:
            if not password:
                raise PDFProcessingError("This PDF is password-protected. Please provide the password.")
            if not reader.decrypt(password):
                raise PDFProcessingError("Incorrect password.")
        return reader
    except EmptyFileError:
        raise PDFProcessingError("The uploaded file is empty or corrupted.")
    except PdfReadError as e:
        raise PDFProcessingError(f"Cannot read PDF: {e}")


# ─── Merge ─────────────────────────────────────────────────────────────────────

def merge_pdfs(input_paths: List[str], output_path: str, password: Optional[str] = None) -> str:
    """Merge multiple PDFs into one."""
    if len(input_paths) < 2:
        raise PDFProcessingError("Please upload at least 2 PDF files to merge.")

    writer = PdfWriter()
    total_pages = 0

    for path in input_paths:
        reader = _open_pdf(path, password)
        for page in reader.pages:
            writer.add_page(page)
            total_pages += 1

    if total_pages == 0:
        raise PDFProcessingError("No pages found in the uploaded PDFs.")

    with open(output_path, "wb") as f:
        writer.write(f)

    logger.info(f"Merged {len(input_paths)} PDFs → {total_pages} pages")
    return output_path


# ─── Split ─────────────────────────────────────────────────────────────────────

def split_pdf_into_pages(input_path: str, output_dir: str, password: Optional[str] = None) -> List[str]:
    """Split a PDF into individual page files."""
    reader = _open_pdf(input_path, password)
    n = len(reader.pages)
    if n == 0:
        raise PDFProcessingError("The PDF has no pages.")

    output_files = []
    stem = Path(input_path).stem

    for i, page in enumerate(reader.pages):
        writer = PdfWriter()
        writer.add_page(page)
        out_path = os.path.join(output_dir, f"{stem}_page_{i+1}.pdf")
        with open(out_path, "wb") as f:
            writer.write(f)
        output_files.append(out_path)

    return output_files


def split_pdf_by_ranges(
    input_path: str,
    output_dir: str,
    ranges: List[Tuple[int, int]],
    password: Optional[str] = None
) -> List[str]:
    """Split a PDF into files based on page ranges (1-indexed, inclusive)."""
    reader = _open_pdf(input_path, password)
    n = len(reader.pages)
    stem = Path(input_path).stem
    output_files = []

    for idx, (start, end) in enumerate(ranges):
        if start < 1 or end > n or start > end:
            raise PDFProcessingError(f"Invalid page range {start}-{end} for a {n}-page PDF.")
        writer = PdfWriter()
        for i in range(start - 1, end):
            writer.add_page(reader.pages[i])
        out_path = os.path.join(output_dir, f"{stem}_part_{idx+1}.pdf")
        with open(out_path, "wb") as f:
            writer.write(f)
        output_files.append(out_path)

    return output_files


def extract_pages(
    input_path: str,
    output_path: str,
    page_numbers: List[int],
    password: Optional[str] = None
) -> str:
    """Extract specific pages (1-indexed) into a new PDF."""
    reader = _open_pdf(input_path, password)
    n = len(reader.pages)
    writer = PdfWriter()

    for pg in page_numbers:
        if pg < 1 or pg > n:
            raise PDFProcessingError(f"Page {pg} does not exist. The PDF has {n} pages.")
        writer.add_page(reader.pages[pg - 1])

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


def delete_pages(
    input_path: str,
    output_path: str,
    page_numbers: List[int],
    password: Optional[str] = None
) -> str:
    """Delete specific pages (1-indexed) from a PDF."""
    reader = _open_pdf(input_path, password)
    n = len(reader.pages)
    to_delete = set(page_numbers)
    writer = PdfWriter()

    for i in range(n):
        if (i + 1) not in to_delete:
            writer.add_page(reader.pages[i])

    if len(writer.pages) == 0:
        raise PDFProcessingError("Cannot delete all pages from the PDF.")

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


# ─── Rotate ───────────────────────────────────────────────────────────────────

def rotate_pages(
    input_path: str,
    output_path: str,
    rotation: int,
    page_numbers: Optional[List[int]] = None,
    password: Optional[str] = None
) -> str:
    """Rotate pages by 90, 180, or 270 degrees (clockwise)."""
    if rotation not in (90, 180, 270):
        raise PDFProcessingError("Rotation must be 90, 180, or 270 degrees.")

    reader = _open_pdf(input_path, password)
    n = len(reader.pages)
    writer = PdfWriter()

    pages_to_rotate = set(page_numbers) if page_numbers else set(range(1, n + 1))

    for i, page in enumerate(reader.pages):
        pg_num = i + 1
        if pg_num in pages_to_rotate:
            page.rotate(rotation)
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


# ─── Reorder ──────────────────────────────────────────────────────────────────

def reorder_pages(
    input_path: str,
    output_path: str,
    new_order: List[int],
    password: Optional[str] = None
) -> str:
    """Reorder pages. new_order is a list of 1-indexed page numbers in desired order."""
    reader = _open_pdf(input_path, password)
    n = len(reader.pages)
    writer = PdfWriter()

    for pg in new_order:
        if pg < 1 or pg > n:
            raise PDFProcessingError(f"Page {pg} does not exist in the PDF ({n} pages).")
        writer.add_page(reader.pages[pg - 1])

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


def reverse_pages(input_path: str, output_path: str, password: Optional[str] = None) -> str:
    """Reverse the page order of a PDF."""
    reader = _open_pdf(input_path, password)
    n = len(reader.pages)
    return reorder_pages(input_path, output_path, list(range(n, 0, -1)), password)


def duplicate_pages(
    input_path: str,
    output_path: str,
    page_numbers: List[int],
    password: Optional[str] = None
) -> str:
    """Duplicate specific pages and insert them after originals."""
    reader = _open_pdf(input_path, password)
    n = len(reader.pages)
    to_dup = set(page_numbers)
    writer = PdfWriter()

    for i, page in enumerate(reader.pages):
        writer.add_page(page)
        if (i + 1) in to_dup:
            writer.add_page(reader.pages[i])

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


# ─── Watermark ────────────────────────────────────────────────────────────────

def add_text_watermark(
    input_path: str,
    output_path: str,
    text: str,
    opacity: float = 0.3,
    rotation: int = 45,
    font_size: int = 60,
    color: str = "gray",
    position: str = "center",
    pages: Optional[List[int]] = None,
    password: Optional[str] = None,
) -> str:
    """Add a text watermark to a PDF."""
    reader = _open_pdf(input_path, password)
    n = len(reader.pages)
    pages_to_mark = set(pages) if pages else set(range(1, n + 1))

    # Build watermark overlay
    wm_buf = io.BytesIO()

    # Get page size from first page
    first_page = reader.pages[0]
    pw = float(first_page.mediabox.width)
    ph = float(first_page.mediabox.height)

    c = canvas.Canvas(wm_buf, pagesize=(pw, ph))
    c.setFont("Helvetica-Bold", font_size)
    c.setFillAlpha(opacity)

    color_map = {
        "gray": colors.gray,
        "red": colors.red,
        "blue": colors.blue,
        "black": colors.black,
    }
    c.setFillColor(color_map.get(color, colors.gray))

    c.saveState()
    c.translate(pw / 2, ph / 2)
    c.rotate(rotation)
    c.drawCentredString(0, 0, text)
    c.restoreState()
    c.save()

    wm_buf.seek(0)
    wm_reader = PdfReader(wm_buf)
    wm_page = wm_reader.pages[0]

    writer = PdfWriter()
    for i, page in enumerate(reader.pages):
        if (i + 1) in pages_to_mark:
            page.merge_page(wm_page)
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


# ─── Page Numbers ─────────────────────────────────────────────────────────────

def add_page_numbers(
    input_path: str,
    output_path: str,
    position: str = "bottom-center",
    start_number: int = 1,
    font_size: int = 12,
    prefix: str = "",
    suffix: str = "",
    pages: Optional[List[int]] = None,
    password: Optional[str] = None,
) -> str:
    """Add page numbers to a PDF."""
    reader = _open_pdf(input_path, password)
    n = len(reader.pages)
    pages_to_number = set(pages) if pages else set(range(1, n + 1))

    writer = PdfWriter()

    for i, page in enumerate(reader.pages):
        if (i + 1) in pages_to_number:
            pw = float(page.mediabox.width)
            ph = float(page.mediabox.height)

            overlay_buf = io.BytesIO()
            c = canvas.Canvas(overlay_buf, pagesize=(pw, ph))
            c.setFont("Helvetica", font_size)
            c.setFillColor(colors.black)

            text = f"{prefix}{start_number + i}{suffix}"

            margin = 0.5 * inch
            positions = {
                "bottom-center": (pw / 2, margin),
                "bottom-left": (margin, margin),
                "bottom-right": (pw - margin, margin),
                "top-center": (pw / 2, ph - margin),
                "top-left": (margin, ph - margin),
                "top-right": (pw - margin, ph - margin),
            }
            x, y = positions.get(position, (pw / 2, margin))
            c.drawCentredString(x, y, text)
            c.save()

            overlay_buf.seek(0)
            overlay_reader = PdfReader(overlay_buf)
            overlay_page = overlay_reader.pages[0]
            page.merge_page(overlay_page)

        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


def add_header_footer(
    input_path: str,
    output_path: str,
    header_text: str = "",
    footer_text: str = "",
    font_size: int = 10,
    pages: Optional[List[int]] = None,
    password: Optional[str] = None,
) -> str:
    """Add header and/or footer text to pages."""
    reader = _open_pdf(input_path, password)
    n = len(reader.pages)
    pages_to_edit = set(pages) if pages else set(range(1, n + 1))
    writer = PdfWriter()

    for i, page in enumerate(reader.pages):
        if (i + 1) in pages_to_edit and (header_text or footer_text):
            pw = float(page.mediabox.width)
            ph = float(page.mediabox.height)

            overlay_buf = io.BytesIO()
            c = canvas.Canvas(overlay_buf, pagesize=(pw, ph))
            c.setFont("Helvetica", font_size)
            c.setFillColor(colors.black)

            margin = 0.4 * inch
            if header_text:
                c.drawCentredString(pw / 2, ph - margin, header_text)
            if footer_text:
                c.drawCentredString(pw / 2, margin, footer_text)
            c.save()

            overlay_buf.seek(0)
            overlay_reader = PdfReader(overlay_buf)
            page.merge_page(overlay_reader.pages[0])

        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


# ─── PDF to Images ────────────────────────────────────────────────────────────

def pdf_to_images(
    input_path: str,
    output_dir: str,
    fmt: str = "jpg",
    dpi: int = 150,
    pages: Optional[List[int]] = None,
    password: Optional[str] = None,
) -> List[str]:
    """Convert PDF pages to images using PyMuPDF (self-contained, no external poppler binary) or pdf2image as fallback."""
    try:
        import pymupdf
        return _pdf_to_images_pymupdf(input_path, output_dir, fmt, dpi, pages, password)
    except PDFProcessingError:
        raise
    except Exception as pymupdf_err:
        logger.warning(f"PyMuPDF conversion failed: {pymupdf_err}. Trying pdf2image fallback.")
        try:
            return _pdf_to_images_pdf2image(input_path, output_dir, fmt, dpi, pages, password)
        except ImportError:
            raise PDFProcessingError(f"Rendering failed: {pymupdf_err}")
        except Exception as e:
            raise PDFProcessingError(f"Failed to convert PDF to images: {e}")


def _pdf_to_images_pymupdf(
    input_path: str,
    output_dir: str,
    fmt: str,
    dpi: int,
    pages: Optional[List[int]],
    password: Optional[str],
) -> List[str]:
    import pymupdf

    try:
        doc = pymupdf.open(input_path)
    except Exception as e:
        raise PDFProcessingError(f"Cannot open PDF: {e}")

    if doc.is_encrypted:
        if not password or not doc.authenticate(password):
            doc.close()
            raise PDFProcessingError("This PDF is password-protected. Please provide the correct password.")

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise PDFProcessingError("The PDF has no pages.")

    stem = Path(input_path).stem
    output_files = []
    page_indices = [p - 1 for p in pages if 1 <= p <= total_pages] if pages else list(range(total_pages))
    ext = "jpg" if fmt in ("jpg", "jpeg") else "png"

    for idx in page_indices:
        page = doc[idx]
        pix = page.get_pixmap(dpi=dpi)
        out_path = os.path.join(output_dir, f"{stem}_page_{idx+1}.{ext}")
        if ext == "jpg":
            pix.save(out_path, jpg_quality=92)
        else:
            pix.save(out_path)
        output_files.append(out_path)

    doc.close()
    return output_files


def _pdf_to_images_pdf2image(
    input_path: str,
    output_dir: str,
    fmt: str,
    dpi: int,
    pages: Optional[List[int]],
    password: Optional[str],
) -> List[str]:
    from pdf2image import convert_from_path

    kwargs = {
        "pdf_path": input_path,
        "dpi": dpi,
        "output_folder": None,
        "fmt": fmt if fmt in ("jpeg", "jpg", "png") else "jpeg",
    }
    if password:
        kwargs["userpw"] = password
    if pages:
        kwargs["first_page"] = min(pages)
        kwargs["last_page"] = max(pages)

    images = convert_from_path(**kwargs)
    stem = Path(input_path).stem
    output_files = []

    for idx, img in enumerate(images):
        ext = "jpg" if fmt in ("jpg", "jpeg") else "png"
        out_path = os.path.join(output_dir, f"{stem}_page_{idx+1}.{ext}")
        img.save(out_path, quality=92 if ext == "jpg" else None)
        output_files.append(out_path)

    return output_files


# ─── Images to PDF ────────────────────────────────────────────────────────────

def images_to_pdf(
    image_paths: List[str],
    output_path: str,
    page_size: str = "auto",
    margin_mm: float = 0,
) -> str:
    """Convert one or more images to a PDF."""
    if not image_paths:
        raise PDFProcessingError("No images provided.")

    writer = PdfWriter()

    for img_path in image_paths:
        try:
            img = Image.open(img_path)
            img = img.convert("RGB")
        except Exception as e:
            raise PDFProcessingError(f"Cannot open image '{os.path.basename(img_path)}': {e}")

        img_w, img_h = img.size  # pixels

        # Convert to PDF page
        img_buf = io.BytesIO()
        img.save(img_buf, format="PDF")
        img_buf.seek(0)

        img_reader = PdfReader(img_buf)
        writer.add_page(img_reader.pages[0])

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


# ─── Compress ─────────────────────────────────────────────────────────────────

def compress_pdf(
    input_path: str,
    output_path: str,
    quality: str = "medium",
    password: Optional[str] = None,
) -> Tuple[int, int]:
    """
    Compress a PDF. Returns (original_size_bytes, output_size_bytes).
    Quality levels: 'low' (aggressive), 'medium', 'high' (gentle).
    Uses pikepdf for object-level compression.
    Note: Compression effectiveness varies greatly by PDF content.
    """
    original_size = os.path.getsize(input_path)


    try:
        with pikepdf.open(input_path, password=password or "") as pdf:
            # Compress images in the PDF
            for page in pdf.pages:
                if "/Resources" in page and "/XObject" in page["/Resources"]:
                    xobjects = page["/Resources"]["/XObject"]
                    for key in xobjects:
                        xobj = xobjects[key]
                        if xobj.get("/Subtype") == "/Image":
                            try:
                                _compress_image_xobject(xobj, quality)
                            except Exception:
                                pass  # Skip problematic images

            pdf.save(
                output_path,
                compress_streams=True,
                object_stream_mode=pikepdf.ObjectStreamMode.generate,
                recompress_flate=True,
            )
    except Exception as e:
        raise PDFProcessingError(f"Compression failed: {e}")

    output_size = os.path.getsize(output_path)
    return original_size, output_size


def _compress_image_xobject(xobj, quality: str):
    """Attempt to recompress an image XObject with Pillow."""
    quality_map = {"low": 40, "medium": 65, "high": 85}
    q = quality_map.get(quality, 65)

    try:
        if "/Filter" in xobj and xobj["/Filter"] == "/DCTDecode":
            return  # Already JPEG
        data = bytes(xobj.read_raw_bytes())
        w = int(xobj["/Width"])
        h = int(xobj["/Height"])
        cs = xobj.get("/ColorSpace", "/DeviceRGB")

        if cs == "/DeviceRGB":
            mode = "RGB"
        elif cs == "/DeviceGray":
            mode = "L"
        else:
            return

        img = Image.frombytes(mode, (w, h), data)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=q, optimize=True)
        buf.seek(0)
        xobj.write(buf.read(), filter=pikepdf.Name("/DCTDecode"))
    except Exception:
        pass


# ─── Password Protection ──────────────────────────────────────────────────────

def protect_pdf(
    input_path: str,
    output_path: str,
    user_password: str,
    owner_password: Optional[str] = None,
    allow_printing: bool = True,
    allow_copying: bool = True,
    password: Optional[str] = None,
) -> str:
    """Add password protection to a PDF."""
    reader = _open_pdf(input_path, password)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    writer.encrypt(
        user_password=user_password,
        owner_password=owner_password or user_password,
        use_128bit=True,
    )

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


def unlock_pdf(
    input_path: str,
    output_path: str,
    password: str,
) -> str:
    """Remove password protection if the correct password is supplied."""
    reader = _open_pdf(input_path, password)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


# ─── Metadata ─────────────────────────────────────────────────────────────────

def get_metadata(input_path: str, password: Optional[str] = None) -> dict:
    """Extract PDF metadata."""
    reader = _open_pdf(input_path, password)
    meta = reader.metadata or {}
    return {
        "title": meta.get("/Title", ""),
        "author": meta.get("/Author", ""),
        "subject": meta.get("/Subject", ""),
        "creator": meta.get("/Creator", ""),
        "producer": meta.get("/Producer", ""),
        "creation_date": str(meta.get("/CreationDate", "")),
        "modification_date": str(meta.get("/ModDate", "")),
        "pages": len(reader.pages),
        "is_encrypted": reader.is_encrypted,
    }


def set_metadata(
    input_path: str,
    output_path: str,
    title: str = "",
    author: str = "",
    subject: str = "",
    creator: str = "DOCeasy",
    password: Optional[str] = None,
) -> str:
    """Set PDF metadata fields."""
    reader = _open_pdf(input_path, password)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    writer.add_metadata({
        "/Title": title,
        "/Author": author,
        "/Subject": subject,
        "/Creator": creator,
    })

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path


def remove_metadata(input_path: str, output_path: str, password: Optional[str] = None) -> str:
    """Strip all metadata from a PDF."""
    return set_metadata(input_path, output_path, "", "", "", "DOCeasy", password)


# ─── Text Extraction ──────────────────────────────────────────────────────────

def extract_text(input_path: str, password: Optional[str] = None) -> str:
    """Extract all text from a PDF."""
    reader = _open_pdf(input_path, password)
    texts = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        texts.append(f"--- Page {i+1} ---\n{text}")
    return "\n\n".join(texts)


# ─── Zip helper ───────────────────────────────────────────────────────────────

def zip_files(file_paths: List[str], output_path: str) -> str:
    """Zip multiple files into one archive."""
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in file_paths:
            zf.write(fp, os.path.basename(fp))
    return output_path


# ─── Get page count ───────────────────────────────────────────────────────────

def get_page_count(input_path: str, password: Optional[str] = None) -> int:
    reader = _open_pdf(input_path, password)
    return len(reader.pages)


# ─── Flatten PDF ─────────────────────────────────────────────────────────────

def flatten_pdf(input_path: str, output_path: str, password: Optional[str] = None) -> str:
    """Flatten interactive form fields and annotations into static document content."""
    try:
        import pymupdf
        doc = pymupdf.open(input_path)
        if doc.is_encrypted:
            if not password or not doc.authenticate(password):
                doc.close()
                raise PDFProcessingError("This PDF is password-protected. Please provide the correct password.")
        for page in doc:
            page.clean_contents()
        doc.bake()
        doc.save(output_path, garbage=3, deflate=True)
        doc.close()
        return output_path
    except PDFProcessingError:
        raise
    except Exception as e:
        try:
            reader = _open_pdf(input_path, password)
            writer = PdfWriter()
            for page in reader.pages:
                writer.add_page(page)
            if "/AcroForm" in writer.root_object:
                del writer.root_object["/AcroForm"]
            with open(output_path, "wb") as f:
                writer.write(f)
            return output_path
        except Exception as fallback_err:
            raise PDFProcessingError(f"Failed to flatten PDF: {e}")


# ─── Repair PDF ──────────────────────────────────────────────────────────────

def repair_pdf(input_path: str, output_path: str, password: Optional[str] = None) -> str:
    """Repair damaged or corrupt PDF documents by rebuilding the xref table and object hierarchy."""
    try:
        import pymupdf
        doc = pymupdf.open(input_path)
        if doc.is_encrypted:
            if not password or not doc.authenticate(password):
                doc.close()
                raise PDFProcessingError("This PDF is password-protected. Please provide the correct password.")
        doc.save(output_path, garbage=4, deflate=True, clean=True)
        doc.close()
        return output_path
    except PDFProcessingError:
        raise
    except Exception as e:
        try:
            with pikepdf.open(input_path, password=password or "", recover=True) as pdf:
                pdf.save(output_path)
            return output_path
        except Exception as pikepdf_err:
            raise PDFProcessingError(f"Could not repair PDF: {e}")

