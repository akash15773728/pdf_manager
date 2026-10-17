import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, ChevronRight } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import type { Tool } from '../types'
import { apiClient } from '../lib/api'
import { CATEGORIES, CATEGORY_ORDER } from '../lib/toolRegistry'

export default function AllToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    apiClient.getTools().then(setTools).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase()) ||
      tool.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = filtered.filter(t => t.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Tool[]>)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-surface-400 mb-6 font-medium">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-surface-300" />
        <span className="text-ink">All Tools</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            All PDF Tools
          </h1>
          <p className="text-sm sm:text-base text-surface-500 mt-1 max-w-xl">
            Browse our full catalog of {tools.length || 26} browser-based PDF utilities. Everything is free, private, and fast.
          </p>
        </div>
        <span className="badge-neutral text-xs font-medium self-start md:self-end">
          {filtered.length} {filtered.length === 1 ? 'tool available' : 'tools available'}
        </span>
      </div>

      {/* Search Bar & Category Filters */}
      <div className="space-y-4 mb-10">
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter tools by name, action or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-ink transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Tools
          </button>
          {CATEGORY_ORDER.map(cat => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORIES[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-xl border border-border-subtle p-5 animate-pulse flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-surface-100" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-surface-100 rounded" />
                <div className="h-3 w-full bg-surface-100 rounded" />
              </div>
              <div className="h-5 w-16 bg-surface-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border-subtle p-8 max-w-md mx-auto">
          <Search className="w-10 h-10 text-surface-300 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-ink mb-1">No tools matched</h2>
          <p className="text-surface-500 text-sm mb-4">
            No tools found for "{search}". Try searching another keyword or resetting filters.
          </p>
          <button
            onClick={() => {
              setSearch('')
              setActiveCategory('all')
            }}
            className="btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([cat, catTools]) => (
            <div key={cat} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-ink">
                  {CATEGORIES[cat as keyof typeof CATEGORIES]?.label || cat}
                </h2>
                <span className="badge-lavender text-[11px] font-semibold">
                  {catTools.length} {catTools.length === 1 ? 'tool' : 'tools'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {catTools.map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
