/**
 * 为汉字和摘要生成 SEO 友好的静态 HTML 页面
 * 运行: node scripts/generate-seo-pages.js
 * 在 npm run build 之后执行
 * 
 * 功能：
 * 1. 为热门汉字生成独立 HTML 页面
 * 2. 为摘要生成独立 HTML 页面
 * 3. 自动更新 sitemap.xml
 */
const fs = require('fs')
const path = require('path')

const BASE_URL = 'https://www.gujitools.com'
const SITE_NAME = '古籍工具'

// 常用汉字列表（可以从数据库获取热门汉字）
const POPULAR_CHARS = [
  // 论语常用字
  '子', '曰', '学', '而', '时', '习', '之', '不', '亦', '说', '乎', '有', '朋', '自', '远', '方', '来', '乐', '人', '知', '愠', '君',
  // 道德经常用字
  '道', '可', '非', '常', '名', '无', '天', '地', '始', '万', '物', '母', '故', '欲', '观', '妙', '徼', '同', '出', '异', '玄', '众',
  // 常用古文字
  '仁', '义', '礼', '智', '信', '忠', '孝', '悌', '德', '善', '恶', '是', '此', '彼', '何', '谁', '吾', '我', '汝', '尔', '其', '者',
  // 诗词常用字
  '春', '秋', '风', '月', '花', '雪', '山', '水', '云', '雨', '日', '夜', '明', '暗', '高', '低', '远', '近', '古', '今', '生', '死',
  // 更多常用字
  '心', '意', '情', '思', '念', '忆', '梦', '醒', '行', '止', '动', '静', '言', '语', '书', '文', '诗', '词', '歌', '赋', '画', '琴',
]

// 生成汉字页面 HTML
function generateCharHTML(char, cssPath, jsPath) {
  const fullUrl = `${BASE_URL}/char/${encodeURIComponent(char)}`
  const ogImage = `${BASE_URL}/og-images/default.png`
  
  // 基础描述（实际内容由 Vue 组件动态加载）
  const description = `「${char}」字形演变、释义、异体字、韵部查询。查看${char}从甲骨文、金文、篆书、隶书到楷书的演变历程。`
  const keywords = `${char},${char}字形演变,${char}释义,${char}异体字,${char}韵部,汉字详情,古文字`
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>「${char}」字形演变·释义·韵部 - ${SITE_NAME}</title>
  
  <!-- SEO Meta -->
  <meta name="description" content="${description}" />
  <meta name="keywords" content="${keywords}" />
  <meta name="author" content="${SITE_NAME}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${fullUrl}" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="「${char}」字形演变·释义·韵部 - ${SITE_NAME}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${fullUrl}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="zh_CN" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="「${char}」字形演变·释义·韵部 - ${SITE_NAME}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${ogImage}" />
  
  <!-- JSON-LD 结构化数据 -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": "${char}",
    "description": "${description}",
    "inDefinedTermSet": {
      "@type": "DefinedTermSet",
      "name": "汉字字典",
      "url": "${BASE_URL}/"
    },
    "termCode": "${char.charCodeAt(0).toString(16).toUpperCase()}"
  }
  </script>
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  
  <!-- Styles -->
  <link rel="stylesheet" crossorigin href="${cssPath}" />
</head>
<body>
  <div id="app"></div>
  <script type="module" crossorigin src="${jsPath}"></script>
</body>
</html>`
}

// 生成摘要页面 HTML（需要从数据库获取数据）
function generateSummaryHTML(summary, cssPath, jsPath) {
  const fullUrl = `${BASE_URL}/summary/${summary.slug}`
  const ogImage = `${BASE_URL}/og-images/default.png`
  
  const title = summary.title || summary.original_text.slice(0, 20) + '...'
  const description = summary.summary ? summary.summary.slice(0, 150) : summary.original_text.slice(0, 150)
  const keywords = summary.keywords ? summary.keywords.join(',') : '古文摘要,文言文分析,古籍解读'
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - 古籍摘要 - ${SITE_NAME}</title>
  
  <!-- SEO Meta -->
  <meta name="description" content="${description}" />
  <meta name="keywords" content="${keywords}" />
  <meta name="author" content="${SITE_NAME}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${fullUrl}" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="${title} - 古籍摘要 - ${SITE_NAME}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${fullUrl}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="zh_CN" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title} - 古籍摘要" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${ogImage}" />
  
  <!-- JSON-LD 结构化数据 -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${description}",
    "keywords": "${keywords}",
    "datePublished": "${summary.created_at || new Date().toISOString()}",
    "publisher": {
      "@type": "Organization",
      "name": "${SITE_NAME}",
      "url": "${BASE_URL}"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${fullUrl}"
    }
  }
  </script>
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  
  <!-- Styles -->
  <link rel="stylesheet" crossorigin href="${cssPath}" />
</head>
<body>
  <div id="app"></div>
  <script type="module" crossorigin src="${jsPath}"></script>
</body>
</html>`
}

// 生成 sitemap.xml
function generateSitemap(chars, summaries) {
  const today = new Date().toISOString().split('T')[0]
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 首页 -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 工具页面 -->
`

  // 工具页面
  const toolPaths = [
    '/input/remove-finger', '/input/deskew', '/input/ocr-vertical', '/input/punctuation',
    '/input/convert', '/input/batch-rename', '/input/segmentation', '/input/pinyin',
    '/clean/background-unify', '/clean/inpaint', '/clean/super-resolution', '/clean/extract-seal',
    '/clean/spine-remove', '/clean/compress', '/clean/blank-detect', '/clean/stain-remove',
    '/read/vertical-horizontal', '/read/dictionary', '/read/tts', '/read/translate',
    '/search/variant-search', '/search/diff-compare',
    '/export/dual-layer-pdf', '/export/epub', '/export/long-image', '/export/plain-text',
    '/pro/glyph-evolution', '/pro/rhyme-check', '/pro/color-palette', '/pro/summary',
  ]
  
  toolPaths.forEach(p => {
    xml += `  <url>
    <loc>${BASE_URL}${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
  })
  
  xml += `
  <!-- 汉字详情页 -->
`
  
  // 汉字页面
  chars.forEach(char => {
    xml += `  <url>
    <loc>${BASE_URL}/char/${encodeURIComponent(char)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`
  })
  
  xml += `
  <!-- 摘要详情页 -->
`
  
  // 摘要页面
  summaries.forEach(s => {
    xml += `  <url>
    <loc>${BASE_URL}/summary/${s.slug}</loc>
    <lastmod>${s.updated_at || s.created_at || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`
  })
  
  xml += `</urlset>`
  
  return xml
}

// 主函数
async function generate() {
  const distDir = path.join(__dirname, '../dist')
  
  if (!fs.existsSync(distDir)) {
    console.log('dist 目录不存在，请先运行 npm run build')
    return
  }
  
  // 读取构建后的 index.html 获取实际的资源路径
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8')
  const cssMatch = indexHtml.match(/href="([^"]+\.css)"/)
  const jsMatch = indexHtml.match(/src="([^"]+\.js)"/)
  
  const cssPath = cssMatch ? cssMatch[1] : '/assets/index.css'
  const jsPath = jsMatch ? jsMatch[1] : '/assets/index.js'
  
  console.log('CSS:', cssPath)
  console.log('JS:', jsPath)
  console.log('')
  
  // 1. 生成汉字页面
  console.log('📝 生成汉字详情页...')
  let charCount = 0
  
  for (const char of POPULAR_CHARS) {
    const html = generateCharHTML(char, cssPath, jsPath)
    const charDir = path.join(distDir, 'char', encodeURIComponent(char))
    fs.mkdirSync(charDir, { recursive: true })
    fs.writeFileSync(path.join(charDir, 'index.html'), html)
    charCount++
  }
  console.log(`✓ 生成 ${charCount} 个汉字页面`)
  
  // 2. 尝试从本地 JSON 文件读取摘要数据（如果有的话）
  // 实际部署时可以从数据库 API 获取
  let summaries = []
  const summariesFile = path.join(__dirname, '../data/summaries.json')
  if (fs.existsSync(summariesFile)) {
    try {
      summaries = JSON.parse(fs.readFileSync(summariesFile, 'utf-8'))
      console.log(`\n📄 生成摘要详情页...`)
      
      let summaryCount = 0
      for (const summary of summaries) {
        if (!summary.slug || !summary.is_public) continue
        
        const html = generateSummaryHTML(summary, cssPath, jsPath)
        const summaryDir = path.join(distDir, 'summary', summary.slug)
        fs.mkdirSync(summaryDir, { recursive: true })
        fs.writeFileSync(path.join(summaryDir, 'index.html'), html)
        summaryCount++
      }
      console.log(`✓ 生成 ${summaryCount} 个摘要页面`)
    } catch (e) {
      console.log('⚠️ 读取摘要数据失败:', e.message)
    }
  }
  
  // 3. 生成 sitemap.xml
  console.log('\n🗺️ 生成 sitemap.xml...')
  const sitemap = generateSitemap(POPULAR_CHARS, summaries)
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap)
  console.log('✓ sitemap.xml 已更新')
  
  console.log('\n✅ SEO 页面生成完成!')
  console.log(`   - ${charCount} 个汉字页面`)
  console.log(`   - ${summaries.length} 个摘要页面`)
  console.log(`   - sitemap.xml 已更新`)
}

generate().catch(console.error)
