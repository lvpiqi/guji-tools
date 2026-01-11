/**
 * 增量构建脚本 - 自动为新增的汉字和摘要生成静态 HTML
 * 
 * 使用方式：
 * 1. 设置定时任务（如每小时运行一次）
 * 2. 或者在 Netlify/Vercel 设置 webhook 触发
 * 
 * 运行: node scripts/incremental-build.js
 */
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
const BASE_URL = 'https://www.gujitools.com'
const SITE_NAME = '古籍工具'

// 记录已生成页面的文件
const GENERATED_FILE = path.join(__dirname, '../data/generated-pages.json')

async function fetchFromSupabase(table, select = '*', options = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`
  
  if (options.order) {
    url += `&order=${options.order}`
  }
  if (options.limit) {
    url += `&limit=${options.limit}`
  }
  if (options.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      url += `&${key}=eq.${value}`
    })
  }
  
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  })
  
  if (!response.ok) {
    throw new Error(`Supabase API error: ${response.status}`)
  }
  
  return response.json()
}

// 读取已生成的页面记录
function getGeneratedPages() {
  try {
    if (fs.existsSync(GENERATED_FILE)) {
      return JSON.parse(fs.readFileSync(GENERATED_FILE, 'utf-8'))
    }
  } catch {}
  return { chars: [], summaries: [] }
}

// 保存已生成的页面记录
function saveGeneratedPages(data) {
  const dir = path.dirname(GENERATED_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(GENERATED_FILE, JSON.stringify(data, null, 2))
}

// 生成汉字页面 HTML
function generateCharHTML(charData) {
  const char = charData.char
  const fullUrl = `${BASE_URL}/char/${encodeURIComponent(char)}`
  const description = charData.definition?.basic 
    ? `「${char}」：${charData.definition.basic}。查看${char}的字形演变、释义、异体字、韵部信息。`
    : `「${char}」字形演变、释义、异体字、韵部查询。`
  const keywords = `${char},${char}字形演变,${char}释义,${char}异体字,汉字详情`
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>「${char}」字形演变·释义·韵部 - ${SITE_NAME}</title>
  <meta name="description" content="${description}" />
  <meta name="keywords" content="${keywords}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${fullUrl}" />
  <meta property="og:title" content="「${char}」字形演变·释义·韵部 - ${SITE_NAME}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${fullUrl}" />
  <meta property="og:image" content="${BASE_URL}/og-images/default.png" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": "${char}",
    "description": "${charData.definition?.basic || ''}",
    "inDefinedTermSet": { "@type": "DefinedTermSet", "name": "汉字字典", "url": "${BASE_URL}/" }
  }
  </script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="stylesheet" href="/assets/index.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`
}

// 生成摘要页面 HTML
function generateSummaryHTML(summary) {
  const fullUrl = `${BASE_URL}/summary/${summary.slug}`
  const title = summary.title || summary.original_text.slice(0, 20) + '...'
  const description = summary.summary ? summary.summary.slice(0, 150) : summary.original_text.slice(0, 150)
  const keywords = summary.keywords ? summary.keywords.join(',') : '古文摘要,文言文分析'
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - 古籍摘要 - ${SITE_NAME}</title>
  <meta name="description" content="${description}" />
  <meta name="keywords" content="${keywords}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${fullUrl}" />
  <meta property="og:title" content="${title} - 古籍摘要" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${fullUrl}" />
  <meta property="og:image" content="${BASE_URL}/og-images/default.png" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${description}",
    "datePublished": "${summary.created_at || new Date().toISOString()}",
    "publisher": { "@type": "Organization", "name": "${SITE_NAME}", "url": "${BASE_URL}" }
  }
  </script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="stylesheet" href="/assets/index.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`
}

// 更新 sitemap.xml
async function updateSitemap(chars, summaries) {
  const distDir = path.join(__dirname, '../dist')
  if (!fs.existsSync(distDir)) return
  
  const today = new Date().toISOString().split('T')[0]
  
  // 读取现有 sitemap 或创建新的
  let existingUrls = new Set()
  const sitemapPath = path.join(distDir, 'sitemap.xml')
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`

  // 添加汉字页面
  for (const char of chars) {
    xml += `  <url>
    <loc>${BASE_URL}/char/${encodeURIComponent(char)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`
  }
  
  // 添加摘要页面
  for (const slug of summaries) {
    xml += `  <url>
    <loc>${BASE_URL}/summary/${encodeURIComponent(slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`
  }
  
  xml += `</urlset>`
  
  fs.writeFileSync(sitemapPath, xml)
  console.log('✓ sitemap.xml 已更新')
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ 请设置环境变量 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
    process.exit(1)
  }
  
  const distDir = path.join(__dirname, '../dist')
  if (!fs.existsSync(distDir)) {
    console.log('⚠️ dist 目录不存在，请先运行 npm run build:only')
    process.exit(1)
  }
  
  console.log('🔄 开始增量构建...\n')
  
  // 获取已生成的页面
  const generated = getGeneratedPages()
  const generatedCharsSet = new Set(generated.chars)
  const generatedSummariesSet = new Set(generated.summaries)
  
  // 从数据库获取所有数据
  const [dbChars, dbSummaries] = await Promise.all([
    fetchFromSupabase('character_data', 'char,definition'),
    fetchFromSupabase('summary_data', 'slug,title,original_text,summary,keywords,created_at', {
      filter: { is_public: true }
    })
  ])
  
  console.log(`数据库: ${dbChars.length} 个汉字, ${dbSummaries.length} 个摘要`)
  console.log(`已生成: ${generated.chars.length} 个汉字, ${generated.summaries.length} 个摘要`)
  
  // 找出新增的内容
  const newChars = dbChars.filter(c => !generatedCharsSet.has(c.char))
  const newSummaries = dbSummaries.filter(s => !generatedSummariesSet.has(s.slug))
  
  console.log(`\n新增: ${newChars.length} 个汉字, ${newSummaries.length} 个摘要\n`)
  
  if (newChars.length === 0 && newSummaries.length === 0) {
    console.log('✅ 没有新内容需要生成')
    return
  }
  
  // 生成新的汉字页面
  for (const charData of newChars) {
    const html = generateCharHTML(charData)
    const charDir = path.join(distDir, 'char', encodeURIComponent(charData.char))
    fs.mkdirSync(charDir, { recursive: true })
    fs.writeFileSync(path.join(charDir, 'index.html'), html)
    generated.chars.push(charData.char)
    console.log(`✓ 生成汉字页面: /char/${charData.char}`)
  }
  
  // 生成新的摘要页面
  for (const summary of newSummaries) {
    const html = generateSummaryHTML(summary)
    const summaryDir = path.join(distDir, 'summary', summary.slug)
    fs.mkdirSync(summaryDir, { recursive: true })
    fs.writeFileSync(path.join(summaryDir, 'index.html'), html)
    generated.summaries.push(summary.slug)
    console.log(`✓ 生成摘要页面: /summary/${summary.slug}`)
  }
  
  // 保存记录
  saveGeneratedPages(generated)
  
  // 更新 sitemap
  await updateSitemap(generated.chars, generated.summaries)
  
  console.log(`\n✅ 增量构建完成!`)
  console.log(`   新增 ${newChars.length} 个汉字页面`)
  console.log(`   新增 ${newSummaries.length} 个摘要页面`)
}

main().catch(console.error)
