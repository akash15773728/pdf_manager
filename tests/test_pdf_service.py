"""
DOCeasy - Backend Tests
Tests for core PDF processing operations.
"""

import os
import io
import sys
import pytest
import tempfile
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter


# ─── Fixtures ─────────────────────────────────────────────────────────────────

def create_test_pdf(num_pages: int = 3, text: str = "Test PDF content") -> bytes:
    """Create a minimal test PDF in memory using reportlab."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    for i in range(num_pages):
        c.drawString(100, 700, f"{text} - Page {i+1}")
        c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()


@pytest.fixture
def tmp_dir():
    with tempfile.TemporaryDirectory() as d:
        yield d


@pytest.fixture
def single_page_pdf(tmp_dir):
    data = create_test_pdf(1)
    path = os.path.join(tmp_dir, "single.pdf")
    with open(path, "wb") as f:
        f.write(data)
    return path


@pytest.fixture
def multi_page_pdf(tmp_dir):
    data = create_test_pdf(5)
    path = os.path.join(tmp_dir, "multi.pdf")
    with open(path, "wb") as f:
        f.write(data)
    return path


@pytest.fixture
def two_pdfs(tmp_dir):
    paths = []
    for i in range(2):
        data = create_test_pdf(2, f"Document {i+1}")
        path = os.path.join(tmp_dir, f"doc{i+1}.pdf")
        with open(path, "wb") as f:
            f.write(data)
        paths.append(path)
    return paths


# ─── Merge Tests ──────────────────────────────────────────────────────────────

class TestMerge:
    def test_merge_two_pdfs(self, two_pdfs, tmp_dir):
        from app.services.pdf_service import merge_pdfs
        from pypdf import PdfReader
        
        output = os.path.join(tmp_dir, "merged.pdf")
        merge_pdfs(two_pdfs, output)
        
        assert os.path.exists(output)
        reader = PdfReader(output)
        assert len(reader.pages) == 4  # 2 pages each

    def test_merge_requires_minimum_2_files(self, single_page_pdf, tmp_dir):
        from app.services.pdf_service import merge_pdfs, PDFProcessingError
        
        output = os.path.join(tmp_dir, "merged.pdf")
        with pytest.raises(PDFProcessingError, match="at least 2"):
            merge_pdfs([single_page_pdf], output)

    def test_merge_output_is_valid_pdf(self, two_pdfs, tmp_dir):
        from app.services.pdf_service import merge_pdfs
        from app.core.validation import validate_pdf_signature
        
        output = os.path.join(tmp_dir, "merged.pdf")
        merge_pdfs(two_pdfs, output)
        
        with open(output, "rb") as f:
            data = f.read(10)
        assert validate_pdf_signature(data), "Output is not a valid PDF"


# ─── Split Tests ──────────────────────────────────────────────────────────────

class TestSplit:
    def test_split_creates_one_file_per_page(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import split_pdf_into_pages
        
        out_dir = os.path.join(tmp_dir, "split")
        os.makedirs(out_dir)
        files = split_pdf_into_pages(multi_page_pdf, out_dir)
        
        assert len(files) == 5
        for f in files:
            assert os.path.exists(f)
            assert f.endswith(".pdf")

    def test_split_each_page_has_one_page(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import split_pdf_into_pages
        from pypdf import PdfReader
        
        out_dir = os.path.join(tmp_dir, "split")
        os.makedirs(out_dir)
        files = split_pdf_into_pages(multi_page_pdf, out_dir)
        
        for f in files:
            reader = PdfReader(f)
            assert len(reader.pages) == 1

    def test_split_by_ranges(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import split_pdf_by_ranges
        
        out_dir = os.path.join(tmp_dir, "split_ranges")
        os.makedirs(out_dir)
        files = split_pdf_by_ranges(multi_page_pdf, out_dir, [(1, 2), (3, 5)])
        
        assert len(files) == 2

    def test_split_invalid_range(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import split_pdf_by_ranges, PDFProcessingError
        
        out_dir = os.path.join(tmp_dir, "split_invalid")
        os.makedirs(out_dir)
        with pytest.raises(PDFProcessingError, match="Invalid page range"):
            split_pdf_by_ranges(multi_page_pdf, out_dir, [(1, 99)])


# ─── Extract/Delete Pages Tests ───────────────────────────────────────────────

class TestPages:
    def test_extract_pages(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import extract_pages
        from pypdf import PdfReader
        
        output = os.path.join(tmp_dir, "extracted.pdf")
        extract_pages(multi_page_pdf, output, [1, 3, 5])
        
        reader = PdfReader(output)
        assert len(reader.pages) == 3

    def test_extract_invalid_page(self, single_page_pdf, tmp_dir):
        from app.services.pdf_service import extract_pages, PDFProcessingError
        
        output = os.path.join(tmp_dir, "extracted.pdf")
        with pytest.raises(PDFProcessingError, match="does not exist"):
            extract_pages(single_page_pdf, output, [99])

    def test_delete_pages(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import delete_pages
        from pypdf import PdfReader
        
        output = os.path.join(tmp_dir, "deleted.pdf")
        delete_pages(multi_page_pdf, output, [2, 4])
        
        reader = PdfReader(output)
        assert len(reader.pages) == 3

    def test_delete_all_pages_fails(self, single_page_pdf, tmp_dir):
        from app.services.pdf_service import delete_pages, PDFProcessingError
        
        output = os.path.join(tmp_dir, "deleted.pdf")
        with pytest.raises(PDFProcessingError, match="Cannot delete all"):
            delete_pages(single_page_pdf, output, [1])


# ─── Rotate Tests ─────────────────────────────────────────────────────────────

class TestRotate:
    def test_rotate_all_pages(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import rotate_pages
        
        output = os.path.join(tmp_dir, "rotated.pdf")
        result = rotate_pages(multi_page_pdf, output, 90)
        assert os.path.exists(result)

    def test_rotate_invalid_angle(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import rotate_pages, PDFProcessingError
        
        output = os.path.join(tmp_dir, "rotated.pdf")
        with pytest.raises(PDFProcessingError, match="Rotation must be"):
            rotate_pages(multi_page_pdf, output, 45)

    def test_rotate_specific_pages(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import rotate_pages
        from pypdf import PdfReader
        
        output = os.path.join(tmp_dir, "rotated.pdf")
        rotate_pages(multi_page_pdf, output, 180, page_numbers=[1, 3])
        
        reader = PdfReader(output)
        assert len(reader.pages) == 5  # All pages present


# ─── Reorder Tests ────────────────────────────────────────────────────────────

class TestReorder:
    def test_reorder_pages(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import reorder_pages
        
        output = os.path.join(tmp_dir, "reordered.pdf")
        result = reorder_pages(multi_page_pdf, output, [5, 4, 3, 2, 1])
        assert os.path.exists(result)

    def test_reverse_pages(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import reverse_pages
        from pypdf import PdfReader
        
        output = os.path.join(tmp_dir, "reversed.pdf")
        reverse_pages(multi_page_pdf, output)
        
        reader = PdfReader(output)
        assert len(reader.pages) == 5

    def test_reorder_invalid_page(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import reorder_pages, PDFProcessingError
        
        output = os.path.join(tmp_dir, "reordered.pdf")
        with pytest.raises(PDFProcessingError, match="does not exist"):
            reorder_pages(multi_page_pdf, output, [1, 2, 99])


# ─── Watermark Tests ──────────────────────────────────────────────────────────

class TestWatermark:
    def test_add_watermark(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import add_text_watermark
        from pypdf import PdfReader
        
        output = os.path.join(tmp_dir, "watermarked.pdf")
        add_text_watermark(multi_page_pdf, output, text="CONFIDENTIAL")
        
        reader = PdfReader(output)
        assert len(reader.pages) == 5


# ─── Page Numbers Tests ───────────────────────────────────────────────────────

class TestPageNumbers:
    def test_add_page_numbers(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import add_page_numbers
        from pypdf import PdfReader
        
        output = os.path.join(tmp_dir, "numbered.pdf")
        add_page_numbers(multi_page_pdf, output, position="bottom-center")
        
        reader = PdfReader(output)
        assert len(reader.pages) == 5

    def test_add_header_footer(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import add_header_footer
        from pypdf import PdfReader
        
        output = os.path.join(tmp_dir, "hf.pdf")
        add_header_footer(multi_page_pdf, output, header_text="My Header", footer_text="Page X")
        
        reader = PdfReader(output)
        assert len(reader.pages) == 5


# ─── Images to PDF Tests ──────────────────────────────────────────────────────

class TestImagesToPDF:
    def create_test_image(self, tmp_dir: str, color="red") -> str:
        from PIL import Image
        img = Image.new("RGB", (200, 200), color=color)
        path = os.path.join(tmp_dir, f"test_{color}.jpg")
        img.save(path, "JPEG")
        return path

    def test_image_to_pdf(self, tmp_dir):
        from app.services.pdf_service import images_to_pdf
        from pypdf import PdfReader
        
        img_path = self.create_test_image(tmp_dir)
        output = os.path.join(tmp_dir, "from_image.pdf")
        images_to_pdf([img_path], output)
        
        assert os.path.exists(output)
        reader = PdfReader(output)
        assert len(reader.pages) == 1

    def test_multiple_images_to_pdf(self, tmp_dir):
        from app.services.pdf_service import images_to_pdf
        from pypdf import PdfReader
        
        imgs = [self.create_test_image(tmp_dir, c) for c in ["red", "blue", "green"]]
        output = os.path.join(tmp_dir, "multi_image.pdf")
        images_to_pdf(imgs, output)
        
        reader = PdfReader(output)
        assert len(reader.pages) == 3

    def test_no_images_fails(self, tmp_dir):
        from app.services.pdf_service import images_to_pdf, PDFProcessingError
        
        output = os.path.join(tmp_dir, "empty.pdf")
        with pytest.raises(PDFProcessingError, match="No images"):
            images_to_pdf([], output)


# ─── Compress Tests ───────────────────────────────────────────────────────────

class TestCompress:
    def test_compress_returns_sizes(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import compress_pdf
        
        output = os.path.join(tmp_dir, "compressed.pdf")
        orig_size, out_size = compress_pdf(multi_page_pdf, output, quality="medium")
        
        assert orig_size > 0
        assert out_size > 0
        assert os.path.exists(output)

    def test_compressed_pdf_is_valid(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import compress_pdf
        from pypdf import PdfReader
        
        output = os.path.join(tmp_dir, "compressed.pdf")
        compress_pdf(multi_page_pdf, output)
        
        reader = PdfReader(output)
        assert len(reader.pages) == 5


# ─── Password Tests ───────────────────────────────────────────────────────────

class TestPassword:
    def test_protect_pdf(self, single_page_pdf, tmp_dir):
        from app.services.pdf_service import protect_pdf
        from pypdf import PdfReader
        
        output = os.path.join(tmp_dir, "protected.pdf")
        protect_pdf(single_page_pdf, output, user_password="test123")
        
        reader = PdfReader(output)
        assert reader.is_encrypted

    def test_unlock_pdf(self, single_page_pdf, tmp_dir):
        from app.services.pdf_service import protect_pdf, unlock_pdf
        from pypdf import PdfReader
        
        protected = os.path.join(tmp_dir, "protected.pdf")
        unlocked = os.path.join(tmp_dir, "unlocked.pdf")
        
        protect_pdf(single_page_pdf, protected, user_password="secret")
        unlock_pdf(protected, unlocked, password="secret")
        
        reader = PdfReader(unlocked)
        assert not reader.is_encrypted

    def test_wrong_password_fails(self, single_page_pdf, tmp_dir):
        from app.services.pdf_service import protect_pdf, PDFProcessingError
        from pypdf import PdfReader
        
        protected = os.path.join(tmp_dir, "protected.pdf")
        unlock_out = os.path.join(tmp_dir, "unlocked.pdf")
        
        protect_pdf(single_page_pdf, protected, user_password="correct")
        
        with pytest.raises(PDFProcessingError, match="Incorrect password"):
            from app.services.pdf_service import _open_pdf
            _open_pdf(protected, "wrong")


# ─── Metadata Tests ───────────────────────────────────────────────────────────

class TestMetadata:
    def test_get_metadata(self, single_page_pdf):
        from app.services.pdf_service import get_metadata
        
        meta = get_metadata(single_page_pdf)
        assert "pages" in meta
        assert meta["pages"] == 1
        assert "is_encrypted" in meta

    def test_set_metadata(self, single_page_pdf, tmp_dir):
        from app.services.pdf_service import set_metadata, get_metadata
        
        output = os.path.join(tmp_dir, "with_meta.pdf")
        set_metadata(single_page_pdf, output, title="Test Doc", author="DOCeasy")
        
        meta = get_metadata(output)
        assert meta.get("title") == "Test Doc"
        assert meta.get("author") == "DOCeasy"


# ─── Text Extraction Tests ────────────────────────────────────────────────────

class TestExtractText:
    def test_extract_text_returns_string(self, multi_page_pdf):
        from app.services.pdf_service import extract_text
        
        text = extract_text(multi_page_pdf)
        assert isinstance(text, str)
        assert len(text) > 0
        # Our test PDFs contain "Test PDF content"
        assert "Page" in text

    def test_extract_text_page_markers(self, multi_page_pdf):
        from app.services.pdf_service import extract_text
        
        text = extract_text(multi_page_pdf)
        assert "Page 1" in text
        assert "Page 5" in text


# ─── Validation Tests ─────────────────────────────────────────────────────────

class TestValidation:
    def test_pdf_signature_valid(self, multi_page_pdf):
        from app.core.validation import validate_pdf_signature
        
        with open(multi_page_pdf, "rb") as f:
            data = f.read(10)
        assert validate_pdf_signature(data)

    def test_pdf_signature_invalid(self):
        from app.core.validation import validate_pdf_signature
        
        assert not validate_pdf_signature(b"not a pdf content")

    def test_safe_filename(self):
        from app.core.validation import safe_filename
        
        assert safe_filename("../../../etc/passwd") == "passwd"
        assert safe_filename("my file (1).pdf") == "my file (1).pdf"
        assert safe_filename("") == "file"

    def test_safe_filename_path_traversal(self):
        from app.core.validation import safe_filename
        
        result = safe_filename("../../secret.pdf")
        assert ".." not in result
        assert "/" not in result


# ─── ZIP helper ───────────────────────────────────────────────────────────────

class TestZip:
    def test_zip_files(self, tmp_dir):
        from app.services.pdf_service import zip_files
        import zipfile
        
        # Create test files
        paths = []
        for i in range(3):
            p = os.path.join(tmp_dir, f"file{i}.txt")
            with open(p, "w") as f:
                f.write(f"content {i}")
            paths.append(p)
        
        zip_path = os.path.join(tmp_dir, "archive.zip")
        zip_files(paths, zip_path)
        
        assert os.path.exists(zip_path)
        with zipfile.ZipFile(zip_path) as zf:
            assert len(zf.namelist()) == 3


# ─── Job Store Tests ──────────────────────────────────────────────────────────

class TestJobStore:
    def test_create_and_get_job(self, tmp_dir):
        # Patch temp dir
        import app.core.config as cfg_module
        orig = cfg_module.settings.TEMP_DIR
        cfg_module.settings.TEMP_DIR = tmp_dir
        
        try:
            from app.core.jobs import create_job, get_job, JobStatus
            
            job = create_job("merge")
            assert job.job_id
            assert job.status == JobStatus.PENDING
            
            retrieved = get_job(job.job_id)
            assert retrieved is not None
            assert retrieved.job_id == job.job_id
        finally:
            cfg_module.settings.TEMP_DIR = orig

    def test_delete_job(self, tmp_dir):
        import app.core.config as cfg_module
        orig = cfg_module.settings.TEMP_DIR
        cfg_module.settings.TEMP_DIR = tmp_dir
        
        try:
            from app.core.jobs import create_job, get_job, delete_job
            
            job = create_job("split")
            job_id = job.job_id
            
            result = delete_job(job_id)
            assert result is True
            assert get_job(job_id) is None
        finally:
            cfg_module.settings.TEMP_DIR = orig

    def test_invalid_job_id(self):
        from app.core.jobs import get_job
        
        result = get_job("not-a-real-id")
        assert result is None


# ─── PDF to Images & Advanced Tools Tests ─────────────────────────────────────

class TestAdvancedTools:
    def test_pdf_to_images_generates_jpg(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import pdf_to_images
        
        output_dir = os.path.join(tmp_dir, "img_out")
        os.makedirs(output_dir, exist_ok=True)
        files = pdf_to_images(multi_page_pdf, output_dir, fmt="jpg", dpi=72)
        
        assert len(files) == 5
        for f in files:
            assert os.path.exists(f)
            assert f.endswith(".jpg")

    def test_pdf_to_images_generates_png(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import pdf_to_images
        
        output_dir = os.path.join(tmp_dir, "png_out")
        os.makedirs(output_dir, exist_ok=True)
        files = pdf_to_images(multi_page_pdf, output_dir, fmt="png", dpi=72)
        
        assert len(files) == 5
        for f in files:
            assert os.path.exists(f)
            assert f.endswith(".png")

    def test_flatten_pdf(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import flatten_pdf
        from pypdf import PdfReader
        
        out_pdf = os.path.join(tmp_dir, "flattened.pdf")
        flatten_pdf(multi_page_pdf, out_pdf)
        
        assert os.path.exists(out_pdf)
        reader = PdfReader(out_pdf)
        assert len(reader.pages) == 5

    def test_repair_pdf(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import repair_pdf
        from pypdf import PdfReader
        
        out_pdf = os.path.join(tmp_dir, "repaired.pdf")
        repair_pdf(multi_page_pdf, out_pdf)
        
        assert os.path.exists(out_pdf)
        reader = PdfReader(out_pdf)
        assert len(reader.pages) == 5

    def test_remove_metadata(self, multi_page_pdf, tmp_dir):
        from app.services.pdf_service import remove_metadata, get_metadata
        
        out_pdf = os.path.join(tmp_dir, "no_meta.pdf")
        remove_metadata(multi_page_pdf, out_pdf)
        
        assert os.path.exists(out_pdf)
        meta = get_metadata(out_pdf)
        assert meta["title"] == ""
        assert meta["author"] == ""


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
