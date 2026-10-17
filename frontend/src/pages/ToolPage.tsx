import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import FileUpload from '../components/FileUpload'
import ToolOptions from '../components/ToolOptions'
import ProcessingStatus from '../components/ProcessingStatus'
import type { Tool, UploadedFile, Job, ProcessingOptions } from '../types'
import { apiClient, pollJob } from '../lib/api'
import { TOOL_DISPLAY, CATEGORIES } from '../lib/toolRegistry'

export default function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>()

  const [tool, setTool] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [files, setFiles] = useState<UploadedFile[]>([])
  const [options, setOptions] = useState<ProcessingOptions>({})
  const [job, setJob] = useState<Job | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load tool definition
  useEffect(() => {
    if (!toolId) return
    setLoading(true)
    apiClient.getTool(toolId)
      .then(t => {
        setTool(t)
        // Set default options
        if (t.id === 'metadata') setOptions({ action: 'get' })
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [toolId])

  const handleProcess = async () => {
    if (!tool) return
    if (files.length === 0) {
      toast.error('Please upload at least one file.')
      return
    }

    // Validate required options
    if (tool.id === 'extract-pages' && !options.pages) {
      toast.error('Please enter the page numbers to extract.')
      return
    }
    if (tool.id === 'delete-pages' && !options.pages) {
      toast.error('Please enter the page numbers to delete.')
      return
    }
    if (tool.id === 'reorder' && !options.order) {
      toast.error('Please enter the new page order (e.g. 3, 1, 2).')
      return
    }
    if (tool.id === 'split' && options.split_mode === 'ranges' && !options.ranges) {
      toast.error('Please enter the page ranges to split by (e.g. 1-2, 3-5).')
      return
    }
    if (tool.id === 'protect' && !options.new_password) {
      toast.error('Please enter a password to protect the PDF.')
      return
    }
    if (tool.id === 'unlock' && !options.password) {
      toast.error('Please enter the PDF password.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setJob(null)

    try {
      const createdJob = await apiClient.createJob(
        tool.id,
        files.map(f => f.file),
        options,
        (pct) => setUploadProgress(pct)
      )

      setIsUploading(false)
      setIsProcessing(true)
      setJob(createdJob)

      // Poll for completion
      const finalJob = await pollJob(
        createdJob.job_id,
        (updated) => setJob(updated)
      )

      setJob(finalJob)
      setIsProcessing(false)

      if (finalJob.status === 'completed') {
        toast.success('Processing complete!')
      } else {
        toast.error(finalJob.error || 'Processing failed.')
      }
    } catch (err) {
      setIsUploading(false)
      setIsProcessing(false)
      const msg = err instanceof Error ? err.message : 'An error occurred.'
      toast.error(msg)
      setJob({ job_id: '', status: 'failed', tool_id: toolId || '', error: msg })
    }
  }

  const handleDownload = () => {
    if (!job?.job_id) return
    const url = apiClient.getDownloadUrl(job.job_id)
    const a = document.createElement('a')
    a.href = url
    a.download = job.output_filename || 'output'
    a.click()
  }

  const handleReset = () => {
    setFiles([])
    setJob(null)
    setOptions(tool?.id === 'metadata' ? { action: 'get' } : {})
    setIsUploading(false)
    setIsProcessing(false)
    setUploadProgress(0)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-surface-400 font-medium">Loading tool...</p>
      </div>
    )
  }

  if (notFound || !tool) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-border-subtle shadow-card space-y-4">
        <Icons.FileQuestion className="w-12 h-12 text-surface-300 mx-auto" />
        <h1 className="text-xl font-bold text-ink">Tool not found</h1>
        <p className="text-sm text-surface-500">
          The requested tool "{toolId}" doesn't exist or has been relocated.
        </p>
        <Link to="/tools" className="btn-primary inline-flex">
          Explore All Tools
        </Link>
      </div>
    )
  }

  const display = TOOL_DISPLAY[tool.id] || { color: 'bg-primary-50 text-primary', border: 'group-hover:border-primary' }
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>)[tool.icon] || Icons.File
  const categoryLabel = CATEGORIES[tool.category as keyof typeof CATEGORIES]?.label || tool.category
  const canProcess = files.length > 0 && !isUploading && !isProcessing && job?.status !== 'completed'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-surface-400 mb-6 font-medium">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <Icons.ChevronRight className="w-3.5 h-3.5 text-surface-300" />
        <Link to="/tools" className="hover:text-primary transition-colors">Tools</Link>
        <Icons.ChevronRight className="w-3.5 h-3.5 text-surface-300" />
        <span className="text-ink">{tool.name}</span>
      </nav>

      {/* Tool Header */}
      <div className="bg-white rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${display.color}`}>
            <IconComponent className="w-6 h-6" strokeWidth={1.8} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-ink tracking-tight">{tool.name}</h1>
              <span className="badge-primary">{categoryLabel}</span>
              <span className="badge-neutral uppercase font-mono">{tool.output_type}</span>
            </div>
            <p className="text-sm text-surface-500 leading-relaxed font-normal">
              {tool.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-surface-400">
              <span>Formats: <strong className="text-surface-600 font-mono uppercase">{tool.accepted_types.join(', ').replace(/\./g, '')}</strong></span>
              <span>•</span>
              <span>Limit: <strong className="text-surface-600">{tool.max_file_size_mb} MB</strong></span>
              {tool.max_files > 1 && (
                <>
                  <span>•</span>
                  <span>Batch: <strong className="text-surface-600">Up to {tool.max_files} files</strong></span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-card space-y-6">
        {/* Upload Zone */}
        <section>
          <FileUpload
            acceptedTypes={tool.accepted_types}
            maxFiles={tool.max_files}
            maxSizeMb={tool.max_file_size_mb}
            files={files}
            onChange={setFiles}
            multiple={tool.max_files > 1}
          />
        </section>

        {/* Tool-specific configuration options */}
        <section>
          <ToolOptions toolId={tool.id} options={options} onChange={setOptions} />
        </section>

        {/* Universal PDF Password prompt if needed */}
        {tool.accepted_types.includes('.pdf') && tool.id !== 'protect' && tool.id !== 'unlock' && (
          <details className="group border-t border-border-subtle pt-4">
            <summary className="text-xs font-medium text-surface-500 cursor-pointer hover:text-ink select-none flex items-center gap-1.5 transition-colors">
              <Icons.Lock className="w-3.5 h-3.5 text-surface-400" />
              Is this PDF password-protected? Click to enter password.
            </summary>
            <div className="mt-3 max-w-sm">
              <input
                type="password"
                className="input"
                placeholder="Enter document password"
                value={options.password as string || ''}
                onChange={e => setOptions({ ...options, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
          </details>
        )}

        {/* Primary Action Button */}
        {!isUploading && !isProcessing && job?.status !== 'completed' && (
          <button
            onClick={handleProcess}
            disabled={!canProcess}
            className="btn-primary w-full py-3.5 text-base font-semibold shadow-card-hover"
          >
            <IconComponent className="w-5 h-5" strokeWidth={2} />
            {tool.name}
          </button>
        )}

        {/* Processing Feedback & Download State */}
        <ProcessingStatus
          job={job}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
          onDownload={handleDownload}
          onReset={handleReset}
          toolName={tool.name}
        />

        {/* Compression Statistics widget */}
        {job?.status === 'completed' && tool.id === 'compress' && (
          <CompressStats jobId={job.job_id} />
        )}
      </div>

      {/* Helpful Tips Card */}
      <div className="mt-6 p-4 bg-canvas border border-border-subtle rounded-xl text-xs space-y-1">
        <h3 className="font-semibold text-ink uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Icons.Info className="w-3.5 h-3.5 text-primary" />
          Helpful Tip
        </h3>
        <ToolTips toolId={tool.id} />
      </div>
    </div>
  )
}

function CompressStats({ jobId }: { jobId: string }) {
  const [stats, setStats] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    apiClient.getJobMetadata(jobId).then(meta => {
      if (meta.original_size) setStats(meta as Record<string, number>)
    }).catch(() => {})
  }, [jobId])

  if (!stats) return null

  const { original_size, output_size, reduction_pct } = stats
  const formatSize = (b: number) => {
    if (b > 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`
    return `${(b / 1024).toFixed(1)} KB`
  }

  return (
    <div className="mt-4 p-4 rounded-xl border border-border-subtle bg-canvas">
      <h3 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">
        Compression Results
      </h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-white p-3 rounded-lg border border-border-subtle">
          <div className="text-base font-bold text-ink">{formatSize(original_size)}</div>
          <div className="text-[11px] text-surface-400 mt-0.5">Original</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-border-subtle">
          <div className={`text-base font-bold ${reduction_pct > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {reduction_pct > 0 ? `−${reduction_pct}%` : '+' + Math.abs(reduction_pct) + '%'}
          </div>
          <div className="text-[11px] text-surface-400 mt-0.5">Savings</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-border-subtle">
          <div className="text-base font-bold text-ink">{formatSize(output_size)}</div>
          <div className="text-[11px] text-surface-400 mt-0.5">New Size</div>
        </div>
      </div>
      {reduction_pct <= 0 && (
        <p className="text-xs text-amber-600 mt-2.5 text-center">
          Note: This document is already heavily optimized. Further compression yields minimal file reduction.
        </p>
      )}
    </div>
  )
}

function ToolTips({ toolId }: { toolId: string }) {
  const tips: Record<string, string> = {
    merge: 'Upload files in the order you want them merged. You can upload up to 20 PDFs simultaneously.',
    split: 'Each page becomes a separate PDF. All pages are neatly packaged in a ZIP archive for one-click download.',
    'extract-pages': 'Specify individual pages or ranges like "1-5, 8, 12".',
    'delete-pages': 'Enter page numbers to exclude, e.g. "2, 4-6". All other pages will be preserved.',
    rotate: 'Leave the page field empty to rotate all pages, or specify single pages like "1, 3".',
    compress: 'Compression operates on embedded images and structural redundancies without compromising document readability.',
    'pdf-to-word': 'Text layers and layout headers are converted directly to editable .docx files.',
    'pdf-to-jpg': 'Pages are rendered at high DPI into high-resolution JPG images packaged in a ZIP.',
    'pdf-to-png': 'PNG export preserves sharp crisp edges, making it ideal for diagrams and vector charts.',
    watermark: 'Text watermark is stamped permanently onto the specified pages.',
    protect: 'Adds standard PDF encryption with a password required to open and read.',
    unlock: 'Decrypts the document using your authorized password so it can be viewed without a prompt.',
    'images-to-pdf': 'Combines multiple JPG, PNG, and WebP images into a single clean PDF document.',
  }

  const tip = tips[toolId] || 'Select your file and click the button to start processing.'
  return <p className="text-surface-500 leading-relaxed">{tip}</p>
}
