// DOCeasy - Tool Registry (mirrors backend, used for routing and display)


// Category display info
export const CATEGORIES = {
  organize: { label: 'Organize PDF', color: 'blue' },
  compress: { label: 'Compress PDF', color: 'green' },
  convert: { label: 'Convert PDF', color: 'purple' },
  edit: { label: 'Edit PDF', color: 'orange' },
  security: { label: 'PDF Security', color: 'red' },
  extract: { label: 'Extract & Analyze', color: 'teal' },
} as const;

export const CATEGORY_ORDER = ['organize', 'compress', 'convert', 'edit', 'security', 'extract'] as const;

// Tool display configuration with rich, category-appropriate color sets
export const TOOL_DISPLAY: Record<string, { color: string; hoverBorder: string; hoverShadow: string }> = {
  // Organize PDF: blue & indigo
  merge: { color: 'bg-softblue text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  split: { color: 'bg-peach text-coral', hoverBorder: 'hover:border-coral', hoverShadow: 'hover:shadow-card-hover-coral' },
  'extract-pages': { color: 'bg-softblue text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  'delete-pages': { color: 'bg-rose-50 text-rose-600', hoverBorder: 'hover:border-rose-400', hoverShadow: 'hover:shadow-card-hover-coral' },
  rotate: { color: 'bg-softyellow text-amber-700', hoverBorder: 'hover:border-amber-400', hoverShadow: 'hover:shadow-card-hover' },
  reorder: { color: 'bg-softblue text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  reverse: { color: 'bg-softblue text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  'duplicate-pages': { color: 'bg-softblue text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  'add-page-numbers': { color: 'bg-lavender text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  'add-header-footer': { color: 'bg-lavender text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  // Compress PDF: emerald & mint
  compress: { color: 'bg-mint text-teal-600', hoverBorder: 'hover:border-teal-500', hoverShadow: 'hover:shadow-card-hover-mint' },
  // Convert PDF: blue, cyan & lavender
  'pdf-to-jpg': { color: 'bg-softblue text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  'pdf-to-png': { color: 'bg-softblue text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  'pdf-to-word': { color: 'bg-lavender text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  'pdf-to-excel': { color: 'bg-mint text-teal-600', hoverBorder: 'hover:border-teal-500', hoverShadow: 'hover:shadow-card-hover-mint' },
  'pdf-to-pptx': { color: 'bg-peach text-coral', hoverBorder: 'hover:border-coral', hoverShadow: 'hover:shadow-card-hover-coral' },
  'jpg-to-pdf': { color: 'bg-softblue text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  'png-to-pdf': { color: 'bg-softblue text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  'images-to-pdf': { color: 'bg-lavender text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  'word-to-pdf': { color: 'bg-lavender text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  // Edit PDF: coral & peach
  watermark: { color: 'bg-peach text-coral', hoverBorder: 'hover:border-coral', hoverShadow: 'hover:shadow-card-hover-coral' },
  flatten: { color: 'bg-lavender text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  // Security: rose & green
  protect: { color: 'bg-rose-50 text-rose-600', hoverBorder: 'hover:border-rose-400', hoverShadow: 'hover:shadow-card-hover-coral' },
  unlock: { color: 'bg-mint text-teal-600', hoverBorder: 'hover:border-teal-500', hoverShadow: 'hover:shadow-card-hover-mint' },
  metadata: { color: 'bg-softblue text-primary', hoverBorder: 'hover:border-primary', hoverShadow: 'hover:shadow-card-hover' },
  repair: { color: 'bg-amber-50 text-amber-700', hoverBorder: 'hover:border-amber-400', hoverShadow: 'hover:shadow-card-hover' },
  // Extract & Analyze: teal & cyan
  'extract-text': { color: 'bg-[#E2FAF6] text-teal-600', hoverBorder: 'hover:border-teal-500', hoverShadow: 'hover:shadow-card-hover-mint' },
  'extract-images': { color: 'bg-[#E2FAF6] text-teal-600', hoverBorder: 'hover:border-teal-500', hoverShadow: 'hover:shadow-card-hover-mint' },
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getAcceptString = (types: string[]): string => {
  const mimeMap: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.webp': 'image/webp',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
  };
  
  const accept: Record<string, string[]> = {};
  types.forEach(ext => {
    const mime = mimeMap[ext] || 'application/octet-stream';
    if (!accept[mime]) accept[mime] = [];
    accept[mime].push(ext);
  });
  return Object.entries(accept).map(([mime, exts]) => `${mime}${exts.map(e => ',' + e).join('')}`).join(',');
};
