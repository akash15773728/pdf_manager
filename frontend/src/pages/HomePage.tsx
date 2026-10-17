import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, Shield, Zap, Lock, ChevronDown, ChevronUp, 
  GitMerge, Package, FileText, Scissors, X,
  ArrowRight, Sparkles, HelpCircle
} from 'lucide-react'
import ToolCard from '../components/ToolCard'
import type { Tool } from '../types'
import { apiClient } from '../lib/api'
import { CATEGORIES, CATEGORY_ORDER } from '../lib/toolRegistry'

const FAQS = [
  {
    q: 'Are my files kept private?',
    a: 'Yes. Files are processed locally by default using your browser and self-hosted backend. Documents are never stored permanently, never tracked, and automatically purged after processing. Zero cloud logging or third-party tracking.',
  },
  {
    q: 'Is DOCeasy free to use?',
    a: 'DOCeasy is 100% free and open source under the MIT license. There are no paywalls, no subscriptions, no daily limits, and no intrusive advertisements.',
  },
  {
    q: 'Which file formats are supported?',
    a: 'We support PDF, JPG, PNG, WEBP, TIFF, BMP, Microsoft Word (.docx, .doc), Excel (.xlsx, .xls), and PowerPoint (.pptx). Each tool explicitly indicates its supported formats.',
  },
  {
    q: 'Is there a file size limit?',
    a: 'The default upload limit is 100MB per file for PDF tools and 50MB for office documents/images. Because DOCeasy is open source, this limit can be customized in your self-hosted environment configuration.',
  },
  {
    q: 'Will PDF-to-Word preserve formatting?',
    a: 'DOCeasy extracts text, structural layout, headings, and images into clean, editable Word documents. While standard documents translate accurately, extremely intricate multi-column layouts or complex layered graphics may require minor manual touch-ups in Word.',
  },
  {
    q: 'Can I use DOCeasy on mobile?',
    a: 'Yes. DOCeasy is fully responsive and works directly in modern mobile web browsers like Safari and Chrome on iOS and Android without installing any app.',
  },
  {
    q: 'Does DOCeasy require an account?',
    a: 'No account, sign-up, or email address is needed. You can use every tool immediately upon visiting the website.',
  },
]

const POPULAR_ACTIONS = [
  { name: 'Merge PDF', path: '/tools/merge', bg: 'bg-softblue text-[#2C488F] border-[#D3E2FF] hover:bg-[#E0ECFF] hover:border-primary/40' },
  { name: 'Compress PDF', path: '/tools/compress', bg: 'bg-mint text-[#0B6B56] border-[#B9EED5] hover:bg-[#CCF4E2] hover:border-teal-500/40' },
  { name: 'PDF to Word', path: '/tools/pdf-to-word', bg: 'bg-lavender text-[#312E81] border-[#D6D2FE] hover:bg-[#DDD8FE] hover:border-primary/40' },
  { name: 'JPG to PDF', path: '/tools/jpg-to-pdf', bg: 'bg-peach text-[#A33B18] border-[#FED4C3] hover:bg-[#FFE5D8] hover:border-coral/40' },
]

export default function HomePage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    apiClient.getTools().then(setTools).catch(console.error).finally(() => setLoading(false))
  }, [])

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filtered = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase()) ||
      tool.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const searchResultsQuick = search.trim()
    ? tools.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) || 
        t.description.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : []

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = filtered.filter(t => t.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Tool[]>)

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* ──────────────────────────────────────────────────────────────────────────
          HERO SECTION: Modern Editorial Asymmetric Layout with Warm Tint
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-10 sm:pt-16 pb-14 sm:pb-20 border-b border-border-subtle bg-gradient-to-b from-[#F2F4FF] via-[#F7F8FF] to-canvas overflow-hidden">
        
        {/* Subtle, restrained decorative accent shapes */}
        <div className="absolute top-12 left-10 w-2.5 h-2.5 rounded-full bg-coral/60 animate-pulse-dot pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-3 h-3 rounded-full bg-primary/20 pointer-events-none" />
        <div className="absolute bottom-12 left-1/4 w-2 h-2 rounded-full bg-teal-500/30 pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-4 h-4 rounded-full bg-lavender-300/40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline, Copy, Search, Quick Actions */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7 animate-fade-in-up">
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lavender border border-lavender-200 text-xs font-semibold text-primary tracking-wide shadow-xs">
                <span className="w-2 h-2 rounded-full bg-coral inline-block shadow-xs" />
                FREE & OPEN SOURCE
              </div>

              {/* Bold Editorial Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-extrabold text-ink leading-[1.08] tracking-tight">
                Your PDFs.<br />
                <span className="text-primary relative inline-block">
                  Handled beautifully.
                  <span className="absolute -bottom-1 left-0 w-full h-[4px] bg-gradient-to-r from-coral via-coral-400 to-coral-300 rounded-full" />
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-surface-500 leading-relaxed max-w-xl font-normal">
                Everything you need to organize, convert, and manage PDFs. Free to use, private by design, and right in your browser.
              </p>

              {/* Functional Quick Search */}
              <div className="space-y-3 max-w-xl relative">
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-primary pointer-events-none">
                    <Search className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="What would you like to do with your PDF?"
                    className="w-full pl-12 pr-20 py-3.5 bg-white border border-[#D5DDEF] rounded-xl text-sm sm:text-base text-ink placeholder:text-surface-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                  />
                  <div className="absolute right-3.5 flex items-center gap-1.5">
                    {search ? (
                      <button
                        onClick={() => setSearch('')}
                        className="p-1 rounded-md text-surface-400 hover:text-ink hover:bg-surface-200 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-surface-100 text-[11px] font-mono text-surface-600 border border-surface-200">
                        /
                      </kbd>
                    )}
                  </div>
                </div>

                {/* Instant Search Dropdown if search query active */}
                {search.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-border-subtle shadow-popover z-30 p-2 space-y-1 animate-fadeIn">
                    {searchResultsQuick.length > 0 ? (
                      <>
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
                          Matching Tools
                        </div>
                        {searchResultsQuick.map(t => (
                          <button
                            key={t.id}
                            onClick={() => {
                              navigate(`/tools/${t.id}`)
                              setSearch('')
                            }}
                            className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-lavender/40 text-left group transition-colors"
                          >
                            <div>
                              <p className="text-sm font-semibold text-ink group-hover:text-primary">{t.name}</p>
                              <p className="text-xs text-surface-400 truncate max-w-sm">{t.description}</p>
                            </div>
                            <span className="badge-neutral group-hover:badge-primary text-[10px] uppercase font-mono">
                              {t.output_type}
                            </span>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 text-center text-sm text-surface-500">
                        No tools found matching "{search}".
                      </div>
                    )}
                  </div>
                )}

                {/* Popular Action Quick Links with alternating soft pastel backgrounds */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-surface-400 font-medium mr-0.5">Popular:</span>
                  {POPULAR_ACTIONS.map(action => (
                    <Link
                      key={action.name}
                      to={action.path}
                      className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all duration-150 ${action.bg}`}
                    >
                      {action.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* CTAs and Metrics */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href="#all-tools"
                  className="btn-primary group"
                >
                  Explore all tools
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </a>
                <a
                  href="https://github.com/akashkumar/doceasy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  View on GitHub
                </a>
              </div>

              {/* Understated trust / metrics bar with colored indicators */}
              <div className="pt-4 border-t border-border-subtle flex flex-wrap gap-8 text-xs text-surface-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                  <span><strong>{tools.length || 26}+</strong> PDF Utilities</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-xs" />
                  <span><strong>100MB</strong> Max File Size</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-coral shadow-xs" />
                  <span><strong>Zero</strong> Cloud Uploads</span>
                </div>
              </div>
            </div>

            {/* Right Column: Architectural Document Workspace Preview */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Soft blue-lavender glow behind product preview */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-lavender via-softblue to-peach rounded-3xl blur-xl opacity-60 pointer-events-none" />

                {/* Main Workspace Preview Card with subtle floating animation */}
                <div className="relative bg-gradient-to-b from-[#EAE8FF]/80 via-[#F0F3FF]/90 to-[#EAE8FF]/70 p-2 sm:p-2.5 rounded-2xl border border-[#D5DCFF] shadow-elevated animate-float-slow">
                  
                  {/* Inner crisp white panel */}
                  <div className="bg-white rounded-xl border border-border-subtle shadow-card overflow-hidden">
                    
                    {/* Top Bar: Document header */}
                    <div className="bg-[#FAF8FF] px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-coral" />
                          <span className="w-2.5 h-2.5 rounded-full bg-softyellow border border-amber-300" />
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                        </div>
                        <span className="text-xs font-mono text-surface-600 pl-2">quarterly_report.pdf</span>
                      </div>
                      <span className="badge-neutral text-[10px] font-mono">
                        4.2 MB • 24 pgs
                      </span>
                    </div>

                    {/* Document Workspace Action Tiles */}
                    <div className="p-4 sm:p-5 space-y-2.5">
                      <div className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Action Showcase</span>
                        <span className="text-[11px] text-primary lowercase font-medium">click any to try</span>
                      </div>

                      {/* Tile 1: Merge PDF (Blue & Soft Blue) */}
                      <Link
                        to="/tools/merge"
                        className="group flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-primary hover:bg-softblue/50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-softblue text-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                            <GitMerge className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">Merge PDF</p>
                            <p className="text-xs text-surface-500">Combine 2+ documents into one</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                          Open <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>

                      {/* Tile 2: Compress PDF (Mint & Teal) */}
                      <Link
                        to="/tools/compress"
                        className="group flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-teal-500 hover:bg-mint/40 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-mint text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                            <Package className="w-4.5 h-4.5 group-hover:scale-95 transition-transform" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink group-hover:text-teal-600 transition-colors">Compress PDF</p>
                            <p className="text-xs text-surface-500">4.2 MB → 1.1 MB (-74% reduction)</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-teal-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                          Open <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>

                      {/* Tile 3: PDF to Word (Lavender & Indigo) */}
                      <Link
                        to="/tools/pdf-to-word"
                        className="group flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-primary hover:bg-lavender/40 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-lavender text-indigo-deep flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                            <FileText className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">PDF to Word</p>
                            <p className="text-xs text-surface-500">Export clean editable .docx format</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                          Open <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>

                      {/* Tile 4: Split PDF (Peach & Coral) */}
                      <Link
                        to="/tools/split"
                        className="group flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-coral hover:bg-peach/50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-peach text-coral flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                            <Scissors className="w-4.5 h-4.5 group-hover:-rotate-12 transition-transform" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink group-hover:text-coral transition-colors">Split PDF</p>
                            <p className="text-xs text-surface-500">Split into separate pages in a zip</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-coral flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                          Open <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </div>

                    {/* Bottom preview note with status indicators */}
                    <div className="bg-[#FAF8FF] px-4 py-2.5 border-t border-border-subtle flex items-center justify-between text-[11px] text-surface-500">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-primary" />
                        Local execution
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-teal-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                        No watermark added
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          ALL TOOLS DIRECTORY SECTION
          ────────────────────────────────────────────────────────────────────────── */}
      <section id="all-tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Complete Toolkit
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink">
              All PDF Tools
            </h2>
            <p className="text-sm text-surface-500 mt-1">
              Organize, convert, edit, and secure your documents with our comprehensive tool suite.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-surface-500">
              Showing {filtered.length} of {tools.length} tools
            </span>
          </div>
        </div>

        {/* Category Filter Pills (horizontally scrollable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
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

        {/* Loading skeleton */}
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
          /* Empty state */
          <div className="text-center py-16 bg-white rounded-2xl border border-border-subtle p-8 max-w-lg mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-lavender/40 flex items-center justify-center mx-auto mb-3 text-primary">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-ink text-base mb-1">No tools matched your criteria</h3>
            <p className="text-surface-500 text-sm mb-4">
              We couldn't find any tool matching "{search}".
            </p>
            <button
              onClick={() => {
                setSearch('')
                setActiveCategory('all')
              }}
              className="btn-secondary"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          /* Grouped Tools Display */
          <div className="space-y-12">
            {Object.entries(grouped).map(([cat, catTools]) => (
              <div key={cat} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-ink">
                    {CATEGORIES[cat as keyof typeof CATEGORIES]?.label || cat}
                  </h3>
                  <span className="badge-lavender text-[11px] font-semibold">
                    {catTools.length} {catTools.length === 1 ? 'tool' : 'tools'}
                  </span>
                </div>

                {/* Responsive 5-column layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {catTools.map(tool => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 7: PRIVACY & PRODUCT BENEFITS WITH TINTED CARDS
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-border-subtle p-8 sm:p-12 shadow-card">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-3">
              Useful tools. No unnecessary complexity.
            </h2>
            <p className="text-surface-500 text-sm sm:text-base">
              Designed from the ground up to be reliable, transparent, and respectful of your document privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Benefit 1: Soft Blue / Lavender */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#F0F3FF] to-white border border-[#D8E3FF] shadow-card hover:shadow-card-hover transition-all duration-200 space-y-3.5">
              <div className="w-11 h-11 rounded-xl bg-lavender text-primary flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5" strokeWidth={2} />
              </div>
              <h3 className="font-bold text-ink text-base">Private by design</h3>
              <p className="text-surface-500 text-sm leading-relaxed">
                Files are processed locally whenever the tool supports local processing. Documents sent to the local helper server are automatically deleted right after completion.
              </p>
            </div>

            {/* Benefit 2: Soft Peach / Coral */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#FFF5F2] to-white border border-[#FFE2D9] shadow-card hover:shadow-card-hover-coral transition-all duration-200 space-y-3.5">
              <div className="w-11 h-11 rounded-xl bg-peach text-coral flex items-center justify-center shadow-xs">
                <Zap className="w-5 h-5" strokeWidth={2} />
              </div>
              <h3 className="font-bold text-ink text-base">Fast and straightforward</h3>
              <p className="text-surface-500 text-sm leading-relaxed">
                Simple workflows without unnecessary steps. No queues, no captcha puzzles, and zero conversion delays. Upload, select your options, and save.
              </p>
            </div>

            {/* Benefit 3: Soft Mint / Teal */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#F0FAF5] to-white border border-[#D0F2E2] shadow-card hover:shadow-card-hover-mint transition-all duration-200 space-y-3.5">
              <div className="w-11 h-11 rounded-xl bg-mint text-teal-600 flex items-center justify-center shadow-xs">
                <Lock className="w-5 h-5" strokeWidth={2} />
              </div>
              <h3 className="font-bold text-ink text-base">Free and open source</h3>
              <p className="text-surface-500 text-sm leading-relaxed">
                Transparent, accessible PDF utilities. Inspect the source code, run it completely offline or self-host within your company network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 8: FREQUENTLY ASKED QUESTIONS
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            Common Inquiries
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={idx}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'bg-[#F9F8FF] border-lavender-300 shadow-sm' 
                    : 'bg-white border-border-subtle hover:border-surface-300'
                }`}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-ink hover:text-primary transition-colors cursor-pointer"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span className={`text-sm sm:text-base font-semibold transition-colors ${isOpen ? 'text-primary' : 'text-ink'}`}>
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-primary flex-shrink-0 transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-surface-400 flex-shrink-0 transition-transform duration-200" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-sm text-surface-500 leading-relaxed border-t border-lavender-200/60">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
