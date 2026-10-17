import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import type { Tool } from '../types'
import { TOOL_DISPLAY } from '../lib/toolRegistry'

interface ToolCardProps {
  tool: Tool
}

export default function ToolCard({ tool }: ToolCardProps) {
  const display = TOOL_DISPLAY[tool.id] || { 
    color: 'bg-softblue text-primary', 
    hoverBorder: 'hover:border-primary',
    hoverShadow: 'hover:shadow-card-hover'
  }

  // Dynamically resolve icon from lucide-react with fallback
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>)[tool.icon]

  // Microanimation classes based on tool type
  const getIconAnimation = (id: string) => {
    if (id === 'rotate') return 'group-hover:rotate-45 transition-transform duration-300 ease-out'
    if (id === 'compress') return 'group-hover:scale-90 transition-transform duration-250 ease-out'
    if (id === 'split') return 'group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-250 ease-out'
    if (id === 'merge') return 'group-hover:translate-x-0.5 transition-transform duration-200 ease-out'
    if (id.includes('to-')) return 'group-hover:translate-x-1 transition-transform duration-200 ease-out'
    return 'group-hover:scale-105 transition-transform duration-200 ease-out'
  }

  return (
    <Link
      to={`/tools/${tool.id}`}
      className={`tool-card group text-left h-full flex flex-col justify-between bg-white border border-border-subtle ${display.hoverBorder} ${display.hoverShadow} transition-all duration-200 ease-out`}
      aria-label={`${tool.name} - ${tool.description}`}
    >
      <div>
        {/* Header row: Icon Container + Minimal Circular Arrow */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${display.color} transition-all duration-200 group-hover:shadow-sm`}
          >
            <div className={getIconAnimation(tool.id)}>
              {IconComponent ? (
                <IconComponent className="w-5 h-5" strokeWidth={1.8} />
              ) : (
                <Icons.File className="w-5 h-5" strokeWidth={1.8} />
              )}
            </div>
          </div>

          {/* Minimal circular arrow control */}
          <div className="w-7 h-7 rounded-full bg-canvas border border-border-subtle flex items-center justify-center text-surface-400 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-200">
            <Icons.ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-ink text-[15px] leading-snug group-hover:text-primary transition-colors duration-150 mb-1.5">
          {tool.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-surface-500 leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </div>

      {/* Footer labels */}
      <div className="flex items-center gap-1.5 pt-4 mt-auto">
        <span className="badge-neutral uppercase text-[10px] font-mono tracking-tight font-medium">
          {tool.output_type}
        </span>
        {tool.max_files > 1 && (
          <span className="badge-lavender text-[10px] font-medium">
            Multi-file
          </span>
        )}
      </div>
    </Link>
  )
}
