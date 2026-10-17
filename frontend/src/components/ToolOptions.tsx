import type { ProcessingOptions } from '../types'

interface ToolOptionsProps {
  toolId: string
  options: ProcessingOptions
  onChange: (options: ProcessingOptions) => void
}

export default function ToolOptions({ toolId, options, onChange }: ToolOptionsProps) {
  const update = (key: string, value: string | number | boolean) => {
    onChange({ ...options, [key]: value })
  }

  const labelClass = "block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5"
  const inputClass = "input"
  const selectClass = "select"

  // ─── Merge ───────────────────────────────────────────────────────────────────
  if (toolId === 'merge') {
    return (
      <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl">
        <p className="text-xs text-surface-600 leading-relaxed">
          📋 Upload 2 or more PDF files. They will be merged in the order listed above.
        </p>
      </div>
    )
  }

  // ─── Split ────────────────────────────────────────────────────────────────────
  if (toolId === 'split') {
    const isRanges = options.split_mode === 'ranges'
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
              !isRanges
                ? 'bg-primary text-white border-primary shadow-subtle'
                : 'bg-white text-surface-600 border-border-subtle hover:bg-canvas'
            }`}
            onClick={() => update('split_mode', 'pages')}
          >
            Extract All Pages
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isRanges
                ? 'bg-primary text-white border-primary shadow-subtle'
                : 'bg-white text-surface-600 border-border-subtle hover:bg-canvas'
            }`}
            onClick={() => update('split_mode', 'ranges')}
          >
            Split by Page Ranges
          </button>
        </div>

        {isRanges ? (
          <div>
            <label className={labelClass} htmlFor="split-ranges">
              Page Ranges to Split
            </label>
            <input
              id="split-ranges"
              type="text"
              className={inputClass}
              placeholder="e.g. 1-2, 3-5, 6"
              value={options.ranges as string || ''}
              onChange={e => update('ranges', e.target.value)}
            />
            <p className="text-xs text-surface-400 mt-1">
              Each range will be exported as its own standalone PDF and packaged in a ZIP archive.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl">
            <p className="text-xs text-surface-600 leading-relaxed">
              📑 Each page of your PDF will be saved as an individual PDF and packaged into a convenient ZIP archive.
            </p>
          </div>
        )}
      </div>
    )
  }

  // ─── Extract pages ────────────────────────────────────────────────────────────
  if (toolId === 'extract-pages') {
    return (
      <div className="space-y-3">
        <div>
          <label className={labelClass} htmlFor="pages">
            Pages to extract
          </label>
          <input
            id="pages"
            type="text"
            className={inputClass}
            placeholder="e.g. 1, 3, 5-8, 10"
            value={options.pages as string || ''}
            onChange={e => update('pages', e.target.value)}
          />
          <p className="text-xs text-surface-400 mt-1">
            Use commas for individual pages and dashes for ranges. Example: 1, 3-5, 8
          </p>
        </div>
      </div>
    )
  }

  // ─── Delete pages ─────────────────────────────────────────────────────────────
  if (toolId === 'delete-pages') {
    return (
      <div className="space-y-3">
        <div>
          <label className={labelClass} htmlFor="del-pages">
            Pages to delete
          </label>
          <input
            id="del-pages"
            type="text"
            className={inputClass}
            placeholder="e.g. 2, 4-6"
            value={options.pages as string || ''}
            onChange={e => update('pages', e.target.value)}
          />
          <p className="text-xs text-surface-400 mt-1">
            Use commas for individual pages and dashes for ranges.
          </p>
        </div>
      </div>
    )
  }

  // ─── Rotate ───────────────────────────────────────────────────────────────────
  if (toolId === 'rotate') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="rotation">
            Rotation angle
          </label>
          <select
            id="rotation"
            className={selectClass}
            value={options.rotation as string || '90'}
            onChange={e => update('rotation', e.target.value)}
          >
            <option value="90">90° clockwise</option>
            <option value="180">180°</option>
            <option value="270">270° clockwise (90° counter-clockwise)</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="rot-pages">
            Pages to rotate (leave empty for all)
          </label>
          <input
            id="rot-pages"
            type="text"
            className={inputClass}
            placeholder="e.g. 1, 3, 5-8 (or leave empty for all)"
            value={options.pages as string || ''}
            onChange={e => update('pages', e.target.value)}
          />
        </div>
      </div>
    )
  }

  // ─── Reorder ──────────────────────────────────────────────────────────────────
  if (toolId === 'reorder') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="reorder-pages">
            New Page Order
          </label>
          <input
            id="reorder-pages"
            type="text"
            className={inputClass}
            placeholder="e.g. 3, 1, 2, 4"
            value={options.order as string || ''}
            onChange={e => update('order', e.target.value)}
          />
          <p className="text-xs text-surface-400 mt-1">
            Specify the sequence of 1-indexed page numbers separated by commas (e.g. 2, 1, 3).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-surface-400 font-medium">Quick presets:</span>
          <button
            type="button"
            onClick={() => update('order', '3, 2, 1')}
            className="px-2.5 py-1 text-xs rounded-lg border border-border-subtle bg-white hover:bg-canvas text-surface-600 transition-colors shadow-xs"
          >
            Reverse (3, 2, 1)
          </button>
          <button
            type="button"
            onClick={() => update('order', '2, 1, 3, 4')}
            className="px-2.5 py-1 text-xs rounded-lg border border-border-subtle bg-white hover:bg-canvas text-surface-600 transition-colors shadow-xs"
          >
            Swap 1 & 2
          </button>
        </div>
      </div>
    )
  }

  // ─── Reverse ──────────────────────────────────────────────────────────────────
  if (toolId === 'reverse') {
    return (
      <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl">
        <p className="text-xs text-surface-600 leading-relaxed">
          🔄 The page order will be completely reversed — the last page becomes the first.
        </p>
      </div>
    )
  }

  // ─── Duplicate pages ──────────────────────────────────────────────────────────
  if (toolId === 'duplicate-pages') {
    return (
      <div className="space-y-3">
        <div>
          <label className={labelClass} htmlFor="dup-pages">
            Pages to duplicate
          </label>
          <input
            id="dup-pages"
            type="text"
            className={inputClass}
            placeholder="e.g. 1, 3"
            value={options.pages as string || ''}
            onChange={e => update('pages', e.target.value)}
          />
          <p className="text-xs text-surface-400 mt-1">
            Duplicated pages are inserted immediately after the original.
          </p>
        </div>
      </div>
    )
  }

  // ─── Add page numbers ─────────────────────────────────────────────────────────
  if (toolId === 'add-page-numbers') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="pg-position">Position</label>
          <select
            id="pg-position"
            className={selectClass}
            value={options.position as string || 'bottom-center'}
            onChange={e => update('position', e.target.value)}
          >
            <option value="bottom-center">Bottom Center</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="top-center">Top Center</option>
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="start-num">Start number</label>
            <input
              id="start-num"
              type="number"
              className={inputClass}
              min={1}
              value={options.start_number as number || 1}
              onChange={e => update('start_number', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="font-size">Font size</label>
            <input
              id="font-size"
              type="number"
              className={inputClass}
              min={8}
              max={24}
              value={options.font_size as number || 12}
              onChange={e => update('font_size', parseInt(e.target.value))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="prefix">Prefix</label>
            <input
              id="prefix"
              type="text"
              className={inputClass}
              placeholder="e.g. Page "
              value={options.prefix as string || ''}
              onChange={e => update('prefix', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="suffix">Suffix</label>
            <input
              id="suffix"
              type="text"
              className={inputClass}
              placeholder="e.g.  of 10"
              value={options.suffix as string || ''}
              onChange={e => update('suffix', e.target.value)}
            />
          </div>
        </div>
      </div>
    )
  }

  // ─── Header & Footer ──────────────────────────────────────────────────────────
  if (toolId === 'add-header-footer') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="header">Header text</label>
          <input
            id="header"
            type="text"
            className={inputClass}
            placeholder="Header text (centered)"
            value={options.header_text as string || ''}
            onChange={e => update('header_text', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="footer">Footer text</label>
          <input
            id="footer"
            type="text"
            className={inputClass}
            placeholder="Footer text (centered)"
            value={options.footer_text as string || ''}
            onChange={e => update('footer_text', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="hf-font-size">Font size</label>
          <input
            id="hf-font-size"
            type="number"
            className={inputClass}
            min={8}
            max={20}
            value={options.font_size as number || 10}
            onChange={e => update('font_size', parseInt(e.target.value))}
          />
        </div>
      </div>
    )
  }

  // ─── Compress ────────────────────────────────────────────────────────────────
  if (toolId === 'compress') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="quality">Compression level</label>
          <select
            id="quality"
            className={selectClass}
            value={options.quality as string || 'medium'}
            onChange={e => update('quality', e.target.value)}
          >
            <option value="high">Low compression (best quality)</option>
            <option value="medium">Balanced (recommended)</option>
            <option value="low">High compression (smaller size)</option>
          </select>
        </div>
        <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
          <p className="text-xs text-amber-800 leading-relaxed">
            ⚠️ Compression effectiveness depends on the PDF content. Documents with high-resolution imagery will see the largest reduction.
          </p>
        </div>
      </div>
    )
  }

  // ─── PDF to image ─────────────────────────────────────────────────────────────
  if (toolId === 'pdf-to-jpg' || toolId === 'pdf-to-png') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="dpi">Image quality (DPI)</label>
          <select
            id="dpi"
            className={selectClass}
            value={options.dpi as string || '150'}
            onChange={e => update('dpi', e.target.value)}
          >
            <option value="72">72 DPI (screen)</option>
            <option value="150">150 DPI (recommended)</option>
            <option value="300">300 DPI (print quality)</option>
          </select>
          <p className="text-xs text-surface-400 mt-1">
            Higher DPI results in sharper output and larger images.
          </p>
        </div>
      </div>
    )
  }

  // ─── Watermark ────────────────────────────────────────────────────────────────
  if (toolId === 'watermark') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="wm-text">Watermark text</label>
          <input
            id="wm-text"
            type="text"
            className={inputClass}
            placeholder="e.g. DRAFT, CONFIDENTIAL"
            value={options.text as string || 'DRAFT'}
            onChange={e => update('text', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="wm-opacity">Opacity</label>
            <input
              id="wm-opacity"
              type="range"
              min="0.1"
              max="0.8"
              step="0.1"
              value={options.opacity as number || 0.3}
              onChange={e => update('opacity', parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-xs text-surface-400 mt-0.5">{Math.round((options.opacity as number || 0.3) * 100)}%</p>
          </div>
          <div>
            <label className={labelClass} htmlFor="wm-rotation">Rotation</label>
            <input
              id="wm-rotation"
              type="number"
              className={inputClass}
              min="-90"
              max="90"
              value={options.rotation as number || 45}
              onChange={e => update('rotation', parseInt(e.target.value))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="wm-color">Color</label>
            <select
              id="wm-color"
              className={selectClass}
              value={options.color as string || 'gray'}
              onChange={e => update('color', e.target.value)}
            >
              <option value="gray">Gray</option>
              <option value="red">Red</option>
              <option value="blue">Blue</option>
              <option value="black">Black</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="wm-size">Font size</label>
            <input
              id="wm-size"
              type="number"
              className={inputClass}
              min={20}
              max={120}
              value={options.font_size as number || 60}
              onChange={e => update('font_size', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    )
  }

  // ─── Protect ────────────────────────────────────────────────────────────────
  if (toolId === 'protect') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            className={inputClass}
            placeholder="Enter password to protect PDF"
            value={options.new_password as string || ''}
            onChange={e => update('new_password', e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="p-3 bg-rose-50/70 border border-rose-200/60 rounded-xl">
          <p className="text-xs text-rose-800 leading-relaxed">
            🔒 This password encrypts the document. Please store it securely.
          </p>
        </div>
      </div>
    )
  }

  // ─── Unlock ─────────────────────────────────────────────────────────────────
  if (toolId === 'unlock') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="curr-password">Current password</label>
          <input
            id="curr-password"
            type="password"
            className={inputClass}
            placeholder="Enter the PDF's current password"
            value={options.password as string || ''}
            onChange={e => update('password', e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
          <p className="text-xs text-amber-800 leading-relaxed">
            ⚠️ You must be authorized to decrypt this document. This tool requires the valid original password.
          </p>
        </div>
      </div>
    )
  }

  // ─── Metadata ────────────────────────────────────────────────────────────────
  if (toolId === 'metadata') {
    const currentAction = options.action || 'get'
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
              currentAction === 'get'
                ? 'bg-primary text-white border-primary shadow-subtle'
                : 'bg-white text-surface-600 border-border-subtle hover:bg-canvas'
            }`}
            onClick={() => update('action', 'get')}
            type="button"
          >
            View metadata
          </button>
          <button
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
              currentAction === 'set'
                ? 'bg-primary text-white border-primary shadow-subtle'
                : 'bg-white text-surface-600 border-border-subtle hover:bg-canvas'
            }`}
            onClick={() => update('action', 'set')}
            type="button"
          >
            Edit metadata
          </button>
          <button
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
              currentAction === 'remove'
                ? 'bg-primary text-white border-primary shadow-subtle'
                : 'bg-white text-surface-600 border-border-subtle hover:bg-canvas'
            }`}
            onClick={() => update('action', 'remove')}
            type="button"
          >
            Strip metadata
          </button>
        </div>

        {currentAction === 'set' && (
          <div className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="meta-title">Title</label>
              <input id="meta-title" type="text" className={inputClass} placeholder="Document title"
                value={options.title as string || ''} onChange={e => update('title', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="meta-author">Author</label>
              <input id="meta-author" type="text" className={inputClass} placeholder="Author name"
                value={options.author as string || ''} onChange={e => update('author', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="meta-subject">Subject</label>
              <input id="meta-subject" type="text" className={inputClass} placeholder="Document subject"
                value={options.subject as string || ''} onChange={e => update('subject', e.target.value)} />
            </div>
          </div>
        )}

        {currentAction === 'get' && (
          <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl">
            <p className="text-xs text-surface-600 leading-relaxed">
              📋 Extracts all document metadata fields (Title, Author, Subject, Creator, Creation Date) into a structured JSON file.
            </p>
          </div>
        )}

        {currentAction === 'remove' && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
            <p className="text-xs text-amber-800 leading-relaxed">
              🧹 Removes all hidden metadata tags, author traces, and software identifiers to protect your privacy before sharing.
            </p>
          </div>
        )}
      </div>
    )
  }

  // ─── Flatten ─────────────────────────────────────────────────────────────────
  if (toolId === 'flatten') {
    return (
      <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl space-y-1">
        <p className="text-xs font-semibold text-ink">🔒 Form & Annotation Flattening</p>
        <p className="text-xs text-surface-600 leading-relaxed">
          Flattens all interactive form fields, checkboxes, digital signatures, and sticky note annotations into permanent, non-editable page graphics.
        </p>
      </div>
    )
  }

  // ─── Repair ──────────────────────────────────────────────────────────────────
  if (toolId === 'repair') {
    return (
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-1">
        <p className="text-xs font-semibold text-amber-900">🛠️ Document Repair Engine</p>
        <p className="text-xs text-amber-800 leading-relaxed">
          Scans and rebuilds damaged cross-reference (xref) tables, clears orphan objects, and restores readable document streams from corrupted files.
        </p>
      </div>
    )
  }

  // ─── Extract Text ─────────────────────────────────────────────────────────────
  if (toolId === 'extract-text') {
    return (
      <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl space-y-1">
        <p className="text-xs font-semibold text-ink">📝 Full Text Extraction</p>
        <p className="text-xs text-surface-600 leading-relaxed">
          Extracts all selectable text across every page and saves it as an organized UTF-8 plain text file (.txt).
        </p>
      </div>
    )
  }

  // ─── Extract Images ───────────────────────────────────────────────────────────
  if (toolId === 'extract-images') {
    return (
      <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl space-y-1">
        <p className="text-xs font-semibold text-ink">🖼️ Asset Extraction</p>
        <p className="text-xs text-surface-600 leading-relaxed">
          Extracts all embedded bitmap photos and illustrations in their native resolution and bundles them into a ZIP archive.
        </p>
      </div>
    )
  }

  // ─── Document Conversions ────────────────────────────────────────────────────
  if (toolId === 'pdf-to-word') {
    return (
      <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl space-y-1">
        <p className="text-xs font-semibold text-ink">📄 Microsoft Word (.docx) Export</p>
        <p className="text-xs text-surface-600 leading-relaxed">
          Transforms PDF paragraphs, headings, and structure into an editable Word document.
        </p>
      </div>
    )
  }

  if (toolId === 'pdf-to-excel') {
    return (
      <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl space-y-1">
        <p className="text-xs font-semibold text-ink">📊 Microsoft Excel (.xlsx) Export</p>
        <p className="text-xs text-surface-600 leading-relaxed">
          Extracts tabular numbers and column data into structured spreadsheet worksheets.
        </p>
      </div>
    )
  }

  if (toolId === 'pdf-to-pptx') {
    return (
      <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl space-y-1">
        <p className="text-xs font-semibold text-ink">📽️ PowerPoint (.pptx) Export</p>
        <p className="text-xs text-surface-600 leading-relaxed">
          Maps each PDF page to an individual presentation slide with preserved text blocks.
        </p>
      </div>
    )
  }

  if (toolId === 'word-to-pdf') {
    return (
      <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl space-y-1">
        <p className="text-xs font-semibold text-ink">📑 Word to PDF Conversion</p>
        <p className="text-xs text-surface-600 leading-relaxed">
          Renders your .docx Word document into a universally readable, fixed-layout PDF.
        </p>
      </div>
    )
  }

  if (toolId === 'jpg-to-pdf' || toolId === 'png-to-pdf' || toolId === 'images-to-pdf') {
    return (
      <div className="p-3.5 bg-canvas border border-border-subtle rounded-xl space-y-1">
        <p className="text-xs font-semibold text-ink">🖼️ Image to PDF Compilation</p>
        <p className="text-xs text-surface-600 leading-relaxed">
          Combines and scales your uploaded images into pages of a clean, high-resolution PDF document.
        </p>
      </div>
    )
  }

  // Default: no extra options
  return null
}
