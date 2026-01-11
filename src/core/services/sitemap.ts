/**
 * 站点地图生成服务
 * 从数据库获取动态内容生成 sitemap
 * 用于搜索引擎收录
 */

import { getAllCachedCharacters, exportAllData } from './aiContent'
import { getAllCharacters, getAllSummarySlugs, getSitemapEntries } from './contentService'

const BASE_URL = 'https://www.gujitools.com'

// 静态工具页面列表
const STATIC_TOOL_PAGES = [
  // 输入工具
  '/input/remove-finger',
  '/input/deskew',
  '/input/ocr-vertical',
  '/input/punctuation',
  '/input/convert',
  '/input/batch-rename',
  '/input/segmentation',
  '/input/pinyin-annotation',
  // 清理工具
  '/clean/background-unify',
  '/clean/blank-detect',
  '/clean/extract-seal',
  '/clean/inpaint',
  '/clean/spine-remove',
  '/clean/stain-remove',
  '/clean/super-resolution',
  '/clean/image-compress',
  // 阅读工具
  '/read/dictionary',
  '/read/text-to-speech',
  '/read/vertical-horizontal',
  '/read/translate',
  // 搜索工具
  '/search/diff-compare',
  '/search/variant-search',
  // 导出工具
  '/export/dual-layer-pdf',
  '/export/epub',
  '/export/long-image',
  '/export/plain-text',
  // 专业工具
  '/pro/color-palette',
  '/pro/glyph-evolution',
  '/pro/rhyme-check',
  '/pro/summary'
]

/**
 * 生成完整的 sitemap.xml 内容（从数据库）
 */
export async function generateSitemapFromDB(): Promise<string> {
  const now = new Date().toISOString().split('T')[0]
  
  // 获取动态内容
  const [characters, summaries] = await Promise.all([
    getAllCharacters(),
    getAllSummarySlugs()
  ])
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 首页 -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 静态工具页面 -->
`

  for (const page of STATIC_TOOL_PAGES) {
    xml += `  <url>
    <loc>${BASE_URL}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
  }

  xml += `
  <!-- 汉字详情页（动态生成） -->
`
  for (const char of characters) {
    xml += `  <url>
    <loc>${BASE_URL}/char/${encodeURIComponent(char)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`
  }

  xml += `
  <!-- 摘要详情页（动态生成） -->
`
  for (const slug of summaries) {
    xml += `  <url>
    <loc>${BASE_URL}/summary/${encodeURIComponent(slug)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`
  }

  xml += `</urlset>`
  return xml
}

/**
 * 生成 sitemap.xml 内容（从本地缓存，兼容旧版）
 */
export function generateSitemap(): string {
  const chars = getAllCachedCharacters()
  const now = new Date().toISOString().split('T')[0]
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 首页 -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 工具页面 -->
`

  for (const page of STATIC_TOOL_PAGES) {
    xml += `  <url>
    <loc>${BASE_URL}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
  }

  xml += `
  <!-- 汉字详情页（动态生成） -->
`

  for (const char of chars) {
    xml += `  <url>
    <loc>${BASE_URL}/char/${encodeURIComponent(char)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`
  }

  xml += `</urlset>`
  return xml
}

/**
 * 生成 JSON-LD 结构化数据（用于搜索引擎理解页面内容）
 */
export function generateJsonLd(char: string, data: any): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    'name': char,
    'description': data.definition?.basic || '',
    'inDefinedTermSet': {
      '@type': 'DefinedTermSet',
      'name': '\u6C49\u5B57\u5B57\u5178',
      'url': `${BASE_URL}/`
    },
    'termCode': char.charCodeAt(0).toString(16).toUpperCase(),
    'sameAs': data.variants?.map((v: string) => `${BASE_URL}/char/${encodeURIComponent(v)}`) || []
  }
}

/**
 * 导出所有数据为 JSON（用于静态站点生成）
 */
export function exportForSSG(): string {
  const data = exportAllData()
  return JSON.stringify(data, null, 2)
}

/**
 * 生成内链 HTML（用于页面底部）
 */
export function generateInternalLinks(currentChar: string, limit = 20): string[] {
  const chars = getAllCachedCharacters()
  return chars
    .filter(c => c !== currentChar)
    .slice(0, limit)
    .map(c => `/char/${encodeURIComponent(c)}`)
}

/**
 * 下载 sitemap.xml（从数据库）
 */
export async function downloadSitemapFromDB() {
  const xml = await generateSitemapFromDB()
  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sitemap.xml'
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 下载 sitemap.xml（从本地缓存）
 */
export function downloadSitemap() {
  const xml = generateSitemap()
  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sitemap.xml'
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 下载所有数据 JSON
 */
export function downloadAllData() {
  const json = exportForSSG()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'character-data.json'
  a.click()
  URL.revokeObjectURL(url)
}
