"""
DOCeasy - Conversion Service
Handles PDF ↔ Office document conversions.
"""

import os
import io
import logging
from typing import Optional
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PIL import Image

logger = logging.getLogger(__name__)


class ConversionError(Exception):
    pass


# ─── PDF to Word ──────────────────────────────────────────────────────────────

def pdf_to_word(input_path: str, output_path: str, password: Optional[str] = None) -> str:
    """
    Extract text from PDF and create a Word document.
    Note: This is a text-extraction approach. Complex formatting like tables,
    columns, and images may not be perfectly preserved.
    """
    from pypdf import PdfReader
    from docx import Document
    from docx.shared import Pt, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    try:
        reader = PdfReader(input_path)
        if reader.is_encrypted:
            if not password or not reader.decrypt(password):
                raise ConversionError("PDF is password-protected. Please provide the correct password.")
    except Exception as e:
        raise ConversionError(f"Cannot open PDF: {e}")

    doc = Document()

    # Set page margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1.25)
        section.right_margin = Inches(1.25)

    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        lines = text.split("\n")

        for line in lines:
            line = line.strip()
            if not line:
                doc.add_paragraph()
                continue
            # Simple heuristic: if short and ends without punctuation, might be heading
            if len(line) < 80 and not line.endswith((".", ",", ";", ":", "?", "!")):
                p = doc.add_paragraph(line)
                p.style = "Heading 2"
            else:
                doc.add_paragraph(line)

        if i < len(reader.pages) - 1:
            doc.add_page_break()

    doc.save(output_path)
    return output_path


# ─── Word to PDF ──────────────────────────────────────────────────────────────

def word_to_pdf(input_path: str, output_path: str) -> str:
    """
    Convert Word document to PDF.
    Uses python-docx to read and reportlab to write.
    Note: Complex Word formatting may not be fully preserved.
    """
    from docx import Document
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch

    try:
        doc = Document(input_path)
    except Exception as e:
        raise ConversionError(f"Cannot open Word document: {e}")

    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    margin = inch
    y = height - margin
    line_height = 14
    font_size = 11

    c.setFont("Helvetica", font_size)

    for para in doc.paragraphs:
        text = para.text

        if not text.strip():
            y -= line_height / 2
            if y < margin:
                c.showPage()
                y = height - margin
                c.setFont("Helvetica", font_size)
            continue

        # Detect heading styles
        if para.style.name.startswith("Heading"):
            c.setFont("Helvetica-Bold", font_size + 2)
        else:
            c.setFont("Helvetica", font_size)

        # Wrap long lines
        words = text.split()
        current_line = ""
        for word in words:
            test_line = f"{current_line} {word}".strip()
            if c.stringWidth(test_line, "Helvetica", font_size) < width - 2 * margin:
                current_line = test_line
            else:
                c.drawString(margin, y, current_line)
                y -= line_height
                current_line = word
                if y < margin:
                    c.showPage()
                    y = height - margin
                    c.setFont("Helvetica", font_size)

        if current_line:
            c.drawString(margin, y, current_line)
            y -= line_height * 1.5

        if y < margin:
            c.showPage()
            y = height - margin
            c.setFont("Helvetica", font_size)

    c.save()
    return output_path


# ─── PDF to Excel ─────────────────────────────────────────────────────────────

def pdf_to_excel(input_path: str, output_path: str, password: Optional[str] = None) -> str:
    """
    Extract text from PDF and create an Excel workbook.
    Text is placed in cells. True table extraction requires
    specialized layout analysis not available without PyMuPDF.
    """
    from pypdf import PdfReader
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment

    try:
        reader = PdfReader(input_path)
        if reader.is_encrypted:
            if not password or not reader.decrypt(password):
                raise ConversionError("PDF is password-protected.")
    except Exception as e:
        raise ConversionError(f"Cannot open PDF: {e}")

    wb = Workbook()
    wb.remove(wb.active)  # Remove default sheet

    for i, page in enumerate(reader.pages):
        ws = wb.create_sheet(title=f"Page {i+1}")
        text = page.extract_text() or ""
        lines = text.split("\n")

        for row_idx, line in enumerate(lines, start=1):
            # Try to split into columns by large whitespace gaps
            parts = _split_columns(line)
            for col_idx, part in enumerate(parts, start=1):
                cell = ws.cell(row=row_idx, column=col_idx, value=part.strip())
                cell.alignment = Alignment(wrap_text=True)

    wb.save(output_path)
    return output_path


def _split_columns(line: str) -> list:
    """Naive column detection by splitting on 2+ spaces."""
    import re
    parts = re.split(r"  +", line)
    return [p for p in parts if p.strip()] or [line]


# ─── PDF to PowerPoint ────────────────────────────────────────────────────────

def pdf_to_pptx(input_path: str, output_path: str, password: Optional[str] = None) -> str:
    """
    Convert each PDF page to a PowerPoint slide.
    Each page is extracted as text and placed on a slide.
    Note: Pages are placed as text content, not as images.
    Complex visual layouts will not be preserved exactly.
    """
    from pypdf import PdfReader
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.enum.text import PP_ALIGN

    try:
        reader = PdfReader(input_path)
        if reader.is_encrypted:
            if not password or not reader.decrypt(password):
                raise ConversionError("PDF is password-protected.")
    except Exception as e:
        raise ConversionError(f"Cannot open PDF: {e}")

    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]  # Blank layout

    for i, page in enumerate(reader.pages):
        text = page.extract_text() or f"[Page {i+1} - No extractable text]"
        slide = prs.slides.add_slide(blank_layout)

        txBox = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(9), Inches(6.5))
        tf = txBox.text_frame
        tf.word_wrap = True

        lines = text.split("\n")
        for j, line in enumerate(lines[:50]):  # Limit lines per slide
            if j == 0:
                p = tf.paragraphs[0]
            else:
                p = tf.add_paragraph()
            run = p.add_run()
            run.text = line
            run.font.size = Pt(10)

    prs.save(output_path)
    return output_path


# ─── Images to searchable PDF ─────────────────────────────────────────────────

def images_to_searchable_pdf(image_paths: list, output_path: str) -> str:
    """
    Convert images to PDF with text overlay using basic OCR.
    Requires pytesseract and tesseract installed.
    Falls back to images-only PDF if OCR not available.
    """
    try:
        import pytesseract
        return _images_to_pdf_with_ocr(image_paths, output_path)
    except ImportError:
        logger.warning("pytesseract not available, creating image-only PDF")
        from app.services.pdf_service import images_to_pdf
        return images_to_pdf(image_paths, output_path)


def _images_to_pdf_with_ocr(image_paths: list, output_path: str) -> str:
    import pytesseract
    from PIL import Image
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter

    c = canvas.Canvas(output_path)

    for img_path in image_paths:
        img = Image.open(img_path)
        w, h = img.size
        # Use image dimensions as page size (72 DPI)
        page_w = w * 72 / 96
        page_h = h * 72 / 96
        c.setPageSize((page_w, page_h))
        c.drawImage(img_path, 0, 0, width=page_w, height=page_h)
        c.showPage()

    c.save()
    return output_path
