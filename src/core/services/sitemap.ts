/**
 * 站点地图生成服务
 * 根据用户查询过的汉字自动生成 sitemap
 * 用于搜索引擎收录
 */

import { getAllCachedCharacters, exportAllData } from './aiContent'

const BASE_URL = 'https://www.gujitools.com'

/**
 * 生成 sitemap.xml 内容
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
  <url><loc>${BASE_URL}/input/deskew</loc><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/input/ocr-vertical</loc><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/clean/background-unify</loc><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/pro/glyph-evolution</loc><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/pro/rhyme-check</loc><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/search/variant-search</loc><priority>0.8</priority></url>
  
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
      'name': '汉字字典',
      'url': `${BASE_URL}/`
    },
    'termCode': char.charCodeAt(0).toString(16).toUpperCase(),
    // 相关术语
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
 * 下载 sitemap.xml
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
