"""DOCeasy - Tools registry endpoint."""

from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter(tags=["tools"])


class ToolInfo(BaseModel):
    id: str
    name: str
    description: str
    category: str
    accepted_types: List[str]
    max_file_size_mb: int
    max_files: int
    output_type: str
    requires_backend: bool
    icon: str


TOOL_REGISTRY: List[ToolInfo] = [
    # Organize PDF
    ToolInfo(id="merge", name="Merge PDF", description="Combine multiple PDF files into one document.", category="organize", accepted_types=[".pdf"], max_file_size_mb=100, max_files=20, output_type="pdf", requires_backend=True, icon="GitMerge"),
    ToolInfo(id="split", name="Split PDF", description="Split a PDF into multiple separate files.", category="organize", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="zip", requires_backend=True, icon="Scissors"),
    ToolInfo(id="extract-pages", name="Extract Pages", description="Pull out specific pages into a new PDF.", category="organize", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="Copy"),
    ToolInfo(id="delete-pages", name="Delete Pages", description="Remove unwanted pages from your PDF.", category="organize", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="Trash2"),
    ToolInfo(id="rotate", name="Rotate PDF", description="Rotate pages in your PDF document.", category="organize", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="RotateCw"),
    ToolInfo(id="reorder", name="Reorder Pages", description="Drag and drop to reorder PDF pages.", category="organize", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="GripVertical"),
    ToolInfo(id="reverse", name="Reverse Pages", description="Reverse the order of all pages in a PDF.", category="organize", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="ArrowLeftRight"),
    ToolInfo(id="duplicate-pages", name="Duplicate Pages", description="Duplicate selected pages within a PDF.", category="organize", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="Files"),
    ToolInfo(id="add-page-numbers", name="Add Page Numbers", description="Add automatic page numbers to your PDF.", category="organize", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="Hash"),
    ToolInfo(id="add-header-footer", name="Add Header & Footer", description="Add custom text headers and footers.", category="organize", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="AlignJustify"),
    # Compress
    ToolInfo(id="compress", name="Compress PDF", description="Reduce PDF file size while maintaining quality.", category="compress", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="PackageOpen"),
    # Convert FROM PDF
    ToolInfo(id="pdf-to-jpg", name="PDF to JPG", description="Convert PDF pages to JPG images.", category="convert", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="zip", requires_backend=True, icon="Image"),
    ToolInfo(id="pdf-to-png", name="PDF to PNG", description="Convert PDF pages to PNG images.", category="convert", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="zip", requires_backend=True, icon="Image"),
    ToolInfo(id="pdf-to-word", name="PDF to Word", description="Convert PDF to editable Word document (.docx).", category="convert", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="docx", requires_backend=True, icon="FileText"),
    ToolInfo(id="pdf-to-excel", name="PDF to Excel", description="Extract content from PDF into Excel spreadsheet.", category="convert", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="xlsx", requires_backend=True, icon="Table"),
    ToolInfo(id="pdf-to-pptx", name="PDF to PowerPoint", description="Convert PDF pages to PowerPoint slides.", category="convert", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pptx", requires_backend=True, icon="Presentation"),
    # Convert TO PDF
    ToolInfo(id="jpg-to-pdf", name="JPG to PDF", description="Convert JPG images to PDF.", category="convert", accepted_types=[".jpg", ".jpeg"], max_file_size_mb=50, max_files=20, output_type="pdf", requires_backend=True, icon="FileImage"),
    ToolInfo(id="png-to-pdf", name="PNG to PDF", description="Convert PNG images to PDF.", category="convert", accepted_types=[".png"], max_file_size_mb=50, max_files=20, output_type="pdf", requires_backend=True, icon="FileImage"),
    ToolInfo(id="images-to-pdf", name="Images to PDF", description="Combine multiple images into a single PDF.", category="convert", accepted_types=[".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".gif"], max_file_size_mb=50, max_files=30, output_type="pdf", requires_backend=True, icon="Images"),
    ToolInfo(id="word-to-pdf", name="Word to PDF", description="Convert Word documents (.docx) to PDF.", category="convert", accepted_types=[".docx", ".doc"], max_file_size_mb=50, max_files=1, output_type="pdf", requires_backend=True, icon="FileText"),
    # Edit / Annotate
    ToolInfo(id="watermark", name="Add Watermark", description="Add a text watermark to your PDF.", category="edit", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="Stamp"),
    ToolInfo(id="flatten", name="Flatten PDF", description="Flatten form fields and annotations into static content.", category="edit", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="Layers"),
    # Security & Diagnostics
    ToolInfo(id="protect", name="Protect PDF", description="Password-protect your PDF document.", category="security", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="Lock"),
    ToolInfo(id="unlock", name="Unlock PDF", description="Remove password protection (requires correct password).", category="security", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="Unlock"),
    ToolInfo(id="metadata", name="Edit Metadata", description="View and edit PDF document metadata.", category="security", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="Info"),
    ToolInfo(id="repair", name="Repair PDF", description="Diagnose and rebuild corrupted cross-reference tables.", category="security", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="pdf", requires_backend=True, icon="Wrench"),
    # Extract
    ToolInfo(id="extract-text", name="Extract Text", description="Extract all text content from a PDF.", category="extract", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="txt", requires_backend=True, icon="AlignLeft"),
    ToolInfo(id="extract-images", name="Extract Images", description="Extract embedded images from a PDF.", category="extract", accepted_types=[".pdf"], max_file_size_mb=100, max_files=1, output_type="zip", requires_backend=True, icon="ImageDown"),
]


@router.get("/tools", response_model=List[ToolInfo])
async def list_tools():
    """Return the complete list of available PDF tools."""
    return TOOL_REGISTRY


@router.get("/tools/{tool_id}", response_model=ToolInfo)
async def get_tool(tool_id: str):
    from fastapi import HTTPException
    tool = next((t for t in TOOL_REGISTRY if t.id == tool_id), None)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_id}' not found.")
    return tool
