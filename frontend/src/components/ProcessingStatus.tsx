import { CheckCircle2, Download, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { formatFileSize } from '../lib/toolRegistry'
import type { Job } from '../types'

interface ProcessingStatusProps {
  job: Job | null
  uploadProgress: number
  isUploading: boolean
  onDownload: () => void
  onReset: () => void
  toolName: string
}

export default function ProcessingStatus({
  job,
  uploadProgress,
  isUploading,
  onDownload,
  onReset,
  toolName,
}: ProcessingStatusProps) {
  if (!job && !isUploading) return null

  // Uploading state
  if (isUploading) {
    return (
      <div className="bg-canvas border border-border-subtle rounded-xl p-6 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto">
          <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
        </div>
        <div>
          <p className="font-semibold text-ink text-sm">Uploading your file...</p>
          <p className="text-xs text-surface-400 mt-0.5">{uploadProgress}% uploaded</p>
        </div>
        <div className="progress-bar max-w-sm mx-auto">
          <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
        </div>
      </div>
    )
  }

  if (!job) return null

  // Processing state
  if (job.status === 'pending' || job.status === 'processing') {
    return (
      <div className="bg-canvas border border-border-subtle rounded-xl p-6 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto">
          <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
        </div>
        <div>
          <p className="font-semibold text-ink text-sm">Processing with {toolName}...</p>
          <p className="text-xs text-surface-500 mt-0.5">
            This takes just a moment depending on file complexity.
          </p>
        </div>
        <div className="progress-bar max-w-sm mx-auto">
          <div className="progress-fill animate-pulse" style={{ width: '65%' }} />
        </div>
      </div>
    )
  }

  // Failed state
  if (job.status === 'failed') {
    return (
      <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-6 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" strokeWidth={2} />
        </div>
        <div>
          <p className="font-semibold text-rose-900 text-sm">Processing failed</p>
          <p className="text-xs text-rose-700 mt-1 max-w-sm mx-auto">
            {job.error || 'An unexpected error occurred during processing.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    )
  }

  // Completed state
  return (
    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-6 text-center space-y-4">
      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-5 h-5" strokeWidth={2.2} />
      </div>

      <div className="space-y-1">
        <p className="font-semibold text-emerald-900 text-base">File Ready!</p>
        <p className="text-xs text-emerald-700">
          {toolName} finished successfully.
        </p>
        {job.output_filename && (
          <p className="text-xs font-mono text-emerald-800 bg-white/70 py-1 px-2.5 rounded-md inline-block mt-1 border border-emerald-200/50">
            {job.output_filename}
          </p>
        )}
        {job.output_size_bytes !== undefined && (
          <p className="text-[11px] text-emerald-600 font-mono mt-0.5">
            Output size: {formatFileSize(job.output_size_bytes)}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={onDownload}
          className="btn-primary w-full sm:w-auto text-xs py-2.5 px-5 font-semibold"
        >
          <Download className="w-4 h-4" />
          Download Result
        </button>
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-4"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Process Another
        </button>
      </div>
    </div>
  )
}
