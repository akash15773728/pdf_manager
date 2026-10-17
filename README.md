# DOCeasy - Full-Featured PDF Toolkit

> A modern, open-source, privacy-first PDF utility suite inspired by iLovePDF. Built with FastAPI (Python) and React 19 + TypeScript + Vite.

---

## 🌟 Highlights

- **25+ Real PDF Tools**: Merge, Split, Compress, Rotate, Page Organizer, Watermark, Page Numbers, Header/Footer, Protect/Unlock, Metadata Editor, Extract Pages/Images/Text, Image to PDF, PDF to Image, Format Conversions, OCR, and more.
- **Privacy First**: Documents are processed locally on your server and automatically cleaned up after 1 hour. No mandatory 3rd-party cloud dependencies.
- **Zero Placeholders**: Every tool is fully wired to real PDF processing engines (`pypdf`, `pikepdf`, `reportlab`, `pdf2image`, `pytesseract`, `pdfplumber`).
- **Real-Time Job Queue**: Asynchronous processing with progress reporting, error diagnostics, and direct download links.
- **Modern UI**: Polished Tailwind CSS design with drag-and-drop file upload, thumbnail preview, dynamic parameter forms, search, and responsive mobile layout.

---

## 🚀 Quick Start

### 1. Prerequisites

- **Python 3.10+** (tested on Python 3.13)
- **Node.js 18+** & npm
- *(Optional)* **Tesseract OCR** and **Poppler** on your system path for OCR and PDF-to-image conversion features.

### 2. Backend Setup

```bash
# In the project root:
# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies (already prepared)
pip install -r backend/requirements.txt

# Start FastAPI server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be running at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup

```bash
# In a new terminal:
cd frontend

# Start the Vite development server
npm run dev
```

Visit `http://localhost:5173` to access the application. The Vite dev server automatically proxies `/api` calls to `http://127.0.0.1:8000`.

---

## 🧪 Running Tests

The test suite validates all PDF transformations (merge, split, rotate, reorder, compress, protect, watermark, metadata, text extraction, validation, and job store):

```bash
venv\Scripts\python -m pytest tests/test_pdf_service.py -v
```

All 40 unit and integration tests pass successfully.

---

## 🛠️ Supported Tools & Capabilities

| Category | Tool | Description |
|---|---|---|
| **Organize** | **Merge PDF** | Combine multiple PDFs into a single file with custom ordering |
| | **Split PDF** | Split into single-page documents or custom page ranges (e.g., `1-3, 5`) |
| | **Delete Pages** | Remove specific pages from a document |
| | **Extract Pages** | Save selected pages as a new standalone PDF |
| | **Reorder Pages** | Rearrange and reverse pages |
| | **Rotate PDF** | Rotate all or specific pages (90°, 180°, 270°) |
| **Compress** | **Compress PDF** | Reduce file size with Extreme, Recommended, or Low compression |
| **Security** | **Protect PDF** | Encrypt with password using AES-256 / 128-bit encryption |
| | **Unlock PDF** | Remove password restrictions from unlocked documents |
| **Edit** | **Add Watermark** | Stamp custom text watermarks with opacity, angle, size & color |
| | **Page Numbers** | Add automated numbering (Bottom/Top, Left/Center/Right) |
| | **Header & Footer** | Add custom running headers and footers |
| | **Edit Metadata** | View and update Title, Author, Subject, and Keywords |
| | **Flatten PDF** | Flatten interactive forms and annotations |
| **Convert** | **JPG to PDF** | Convert images to PDF with custom margins and orientations |
| | **PDF to JPG** | Render pages as high-resolution JPEG images |
| | **PDF to Word / Excel** | Extract document tables and formatted text to DOCX / XLSX |
| **Extract** | **Extract Text** | Fast text extraction with optional page markers |
| | **Extract Images** | Extract embedded images directly from PDF streams |
| | **OCR PDF** | Optical character recognition for scanned documents |
| | **PDF Info & Repair** | Diagnose page counts, encryption status, and recover corrupted xref tables |

---

## 📁 Architecture Overview

```
pdf_project/
├── backend/
│   ├── app/
│   │   ├── config.py              # Environment configuration & constants
│   │   ├── models/                # Pydantic schemas for tools, jobs & options
│   │   ├── routers/
│   │   │   ├── health.py          # /api/health endpoint
│   │   │   ├── tools.py           # /api/tools registry
│   │   │   └── jobs.py            # /api/jobs queue, upload, progress & download
│   │   └── services/
│   │       ├── job_store.py       # In-memory thread-safe job tracker
│   │       └── pdf_service.py     # 25+ PDF processing engines
│   ├── main.py                    # FastAPI application initialization
│   └── requirements.txt           # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/            # FileUpload, ToolCard, ToolOptions, ProcessingStatus, Layout
│   │   ├── pages/                 # HomePage, AllToolsPage, ToolPage
│   │   ├── lib/                   # API client & tool metadata registry
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── App.tsx                # Client-side router setup
│   │   └── main.tsx               # Root entrypoint
│   ├── package.json
│   └── vite.config.ts
├── tests/
│   └── test_pdf_service.py        # 40 comprehensive automated test cases
└── README.md
```

---

## 🔒 Security & Privacy Notice

- All file uploads are validated via binary PDF magic byte signatures (`%PDF-`).
- Filenames are sanitized with regex to defend against path traversal attacks.
- In-memory jobs and generated temporary files are cleaned automatically after `JOB_EXPIRY_SECONDS` (default: 3600s / 1 hour).
- Zero user data is telemetried or sent to third-party endpoints.
