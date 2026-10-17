import { Outlet, Link, useLocation } from 'react-router-dom'
import { FileText, Menu, X } from 'lucide-react'
import { useState } from 'react'

function GithubIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const currentYear = new Date().getFullYear()

  const isHome = location.pathname === '/'
  const isTools = location.pathname.startsWith('/tools')

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink selection:bg-primary-100 selection:text-primary-800">
      {/* Sticky Navigation Bar - 72px high with subtle bottom border */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border-subtle shadow-subtle">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-subtle group-hover:scale-105 group-hover:bg-primary-600 transition-all duration-200">
              <FileText className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <span className="text-xl font-bold tracking-tight text-ink flex items-center">
              DOC<span className="text-primary font-extrabold">easy</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block ml-1 animate-pulse-dot" />
            </span>
          </Link>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                isHome
                  ? 'text-primary bg-primary-50 font-semibold shadow-xs'
                  : 'text-surface-500 hover:text-ink hover:bg-surface-100'
              }`}
            >
              Home
            </Link>
            <Link
              to="/tools"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                isTools
                  ? 'text-primary bg-primary-50 font-semibold shadow-xs'
                  : 'text-surface-500 hover:text-ink hover:bg-surface-100'
              }`}
            >
              All Tools
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/akashkumar/doceasy"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-surface-500 hover:text-primary hover:bg-lavender/40 transition-colors"
              aria-label="DOCeasy on GitHub"
            >
              <GithubIcon className="w-5 h-5" />
            </a>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-xl text-surface-500 hover:text-ink hover:bg-surface-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-3 bg-white border-b border-border-subtle flex flex-col gap-1.5 animate-fadeIn">
            <Link
              to="/"
              className={`px-3 py-2 rounded-xl text-sm font-medium ${
                isHome ? 'text-primary bg-primary-50 font-semibold' : 'text-surface-600 hover:bg-surface-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/tools"
              className={`px-3 py-2 rounded-xl text-sm font-medium ${
                isTools ? 'text-primary bg-primary-50 font-semibold' : 'text-surface-600 hover:bg-surface-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              All Tools
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer - Premium Dark Navy Footer (#111827) with subtle colorful accents */}
      <footer className="bg-darkfooter text-surface-400 mt-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Col 1 & 2: Brand & Description */}
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-2.5 mb-4 group inline-flex">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
                  <FileText className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
                <span className="text-white font-bold text-lg tracking-tight">
                  DOC<span className="text-primary-400">easy</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 inline-block ml-1" />
                </span>
              </Link>
              <p className="text-sm text-surface-400 leading-relaxed max-w-sm mb-5">
                A modern, private, and open-source PDF utility suite. Fast document manipulation that operates right in your browser.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/akashkumar/doceasy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-surface-300 hover:text-white hover:border-primary/40 transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  GitHub Repository
                </a>
              </div>
            </div>

            {/* Col 3: Organize */}
            <div>
              <h3 className="text-xs font-semibold text-primary-300 uppercase tracking-wider mb-3.5">
                Organize PDF
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/tools/merge" className="hover:text-white transition-colors">Merge PDF</Link></li>
                <li><Link to="/tools/split" className="hover:text-white transition-colors">Split PDF</Link></li>
                <li><Link to="/tools/rotate" className="hover:text-white transition-colors">Rotate PDF</Link></li>
                <li><Link to="/tools/reorder" className="hover:text-white transition-colors">Reorder Pages</Link></li>
                <li><Link to="/tools/delete-pages" className="hover:text-white transition-colors">Delete Pages</Link></li>
                <li><Link to="/tools/add-page-numbers" className="hover:text-white transition-colors">Page Numbers</Link></li>
              </ul>
            </div>

            {/* Col 4: Convert */}
            <div>
              <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-3.5">
                Convert PDF
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/tools/pdf-to-word" className="hover:text-white transition-colors">PDF to Word</Link></li>
                <li><Link to="/tools/pdf-to-excel" className="hover:text-white transition-colors">PDF to Excel</Link></li>
                <li><Link to="/tools/pdf-to-jpg" className="hover:text-white transition-colors">PDF to JPG</Link></li>
                <li><Link to="/tools/jpg-to-pdf" className="hover:text-white transition-colors">JPG to PDF</Link></li>
                <li><Link to="/tools/images-to-pdf" className="hover:text-white transition-colors">Images to PDF</Link></li>
                <li><Link to="/tools/word-to-pdf" className="hover:text-white transition-colors">Word to PDF</Link></li>
              </ul>
            </div>

            {/* Col 5: Security & Tools */}
            <div>
              <h3 className="text-xs font-semibold text-coral-400 uppercase tracking-wider mb-3.5">
                Other Tools
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/tools/compress" className="hover:text-white transition-colors">Compress PDF</Link></li>
                <li><Link to="/tools/protect" className="hover:text-white transition-colors">Protect PDF</Link></li>
                <li><Link to="/tools/unlock" className="hover:text-white transition-colors">Unlock PDF</Link></li>
                <li><Link to="/tools/watermark" className="hover:text-white transition-colors">Add Watermark</Link></li>
                <li><Link to="/tools/extract-text" className="hover:text-white transition-colors">Extract Text</Link></li>
                <li><Link to="/tools/metadata" className="hover:text-white transition-colors">Edit Metadata</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-500">
            <p>
              © {currentYear} DOCeasy. Released under the MIT License. Free & Open Source.
            </p>
            <p className="text-surface-400 text-center sm:text-right">
              Files are processed locally whenever possible. Your privacy is respected by design.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
