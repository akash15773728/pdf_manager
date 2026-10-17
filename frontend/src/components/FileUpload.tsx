import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image, File, AlertCircle } from 'lucide-react'
import { formatFileSize } from '../lib/toolRegistry'
import type { UploadedFile } from '../types'

interface FileUploadProps {
  acceptedTypes: string[]
  maxFiles: number
  maxSizeMb: number
  files: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
  multiple?: boolean
  className?: string
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'].includes(ext || '')) {
    return <Image className="w-5 h-5 text-primary" strokeWidth={1.8} />
  }
  if (ext === 'pdf') return <FileText className="w-5 h-5 text-coral" strokeWidth={1.8} />
  return <File className="w-5 h-5 text-surface-400" strokeWidth={1.8} />
}

export default function FileUpload({
  acceptedTypes,
  maxFiles,
  maxSizeMb,
  files,
  onChange,
  multiple = true,
  className = '',
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      setError(null)

      if (rejectedFiles && Array.isArray(rejectedFiles) && rejectedFiles.length > 0) {
        const reasons = (rejectedFiles as Array<{errors: Array<{code: string; message: string}>}>)
          .flatMap(rf => rf.errors)
          .map(e => e.message)
        setError(reasons[0] || 'Some files could not be uploaded.')
        return
      }

      const totalFiles = files.length + acceptedFiles.length
      if (totalFiles > maxFiles) {
        setError(`Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed.`)
        return
      }

      const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
        file,
        id: Math.random().toString(36).slice(2),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }))

      onChange(multiple ? [...files, ...newFiles] : newFiles)
    },
    [files, maxFiles, multiple, onChange]
  )

  // Build accept object for react-dropzone
  const buildAccept = () => {
    const mimeMap: Record<string, string[]> = {
      '.pdf': ['application/pdf'],
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.gif': ['image/gif'],
      '.bmp': ['image/bmp'],
      '.tiff': ['image/tiff'],
      '.tif': ['image/tiff'],
      '.webp': ['image/webp'],
      '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      '.doc': ['application/msword'],
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.xls': ['application/vnd.ms-excel'],
      '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      '.txt': ['text/plain'],
    }

    const accept: Record<string, string[]> = {}
    acceptedTypes.forEach(ext => {
      const mimes = mimeMap[ext] || []
      mimes.forEach(mime => {
        if (!accept[mime]) accept[mime] = [];
        if (!accept[mime].includes(ext)) accept[mime].push(ext)
      })
    })
    return accept
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: buildAccept(),
    maxFiles: maxFiles - files.length,
    maxSize: maxSizeMb * 1024 * 1024,
    multiple,
    disabled: files.length >= maxFiles,
  })

  const removeFile = (id: string) => {
    const updated = files.filter(f => f.id !== id)
    onChange(updated)
    setError(null)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop zone */}
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`upload-zone py-10 px-6 text-center cursor-pointer ${
            isDragActive ? 'drag-active' : ''
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                isDragActive ? 'bg-primary text-white shadow-md' : 'bg-lavender text-primary'
              }`}
            >
              <Upload className="w-6 h-6" strokeWidth={2} />
            </div>
            
            <div className="space-y-1">
              <p className="text-base font-semibold text-ink">
                {isDragActive ? 'Drop your files now' : 'Drag & drop files here'}
              </p>
              <p className="text-xs text-surface-500">
                or use the button below to browse from your device
              </p>
            </div>

            <button
              type="button"
              className="btn-primary py-2.5 px-6 text-xs font-semibold shadow-subtle pointer-events-none"
            >
              Choose {acceptedTypes.includes('.pdf') ? 'PDF' : 'Files'} to Upload
            </button>

            {/* Constraints */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-surface-400">
              <span className="font-mono uppercase">
                {acceptedTypes.map(t => t.replace('.', '')).join(', ')}
              </span>
              <span>•</span>
              <span>Max {maxSizeMb}MB</span>
              {maxFiles > 1 && (
                <>
                  <span>•</span>
                  <span>Up to {maxFiles} files</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Selected file list */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-surface-700">
              Uploaded files ({files.length}{maxFiles > 1 ? `/${maxFiles}` : ''})
            </span>
            {files.length > 1 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-coral hover:text-coral-600 font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="divide-y divide-border-subtle border border-border-subtle rounded-xl bg-white overflow-hidden">
            {files.map((uf, idx) => (
              <div
                key={uf.id}
                className="flex items-center justify-between gap-3 p-3 hover:bg-canvas/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {maxFiles > 1 && (
                    <span className="w-5 h-5 rounded-full bg-surface-100 text-surface-500 text-[10px] font-mono flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-surface-50 border border-border-subtle flex items-center justify-center flex-shrink-0">
                    <FileIcon name={uf.file.name} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink truncate max-w-xs sm:max-w-md">
                      {uf.file.name}
                    </p>
                    <p className="text-[11px] text-surface-400 font-mono">
                      {formatFileSize(uf.file.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(uf.id)}
                  className="p-1 rounded-md text-surface-400 hover:text-coral hover:bg-rose-50 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
