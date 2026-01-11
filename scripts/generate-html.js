/**
 * 为每个工具页生成独立的 HTML 文件（SEO 优化）
 * 运行: node scripts/generate-html.js
 * 在 npm run build 之后执行
 */
const fs = require('fs')
const path = require('path')

const BASE_URL = 'https://www.gujitools.com'

// 工具页面配置
const tools = [
  {
    path: '/input/remove-finger',
    title: '去手指阴影',
    description: '免费在线去除古籍拍摄时的手指和阴影。基于AI智能识别，自动检测并修复手指遮挡区域，支持批量处理，本地运行保护隐私。',
    keywords: '去手指阴影,古籍拍摄,图像修复,阴影去除,AI修复,古籍数字化',
  },
  {
    path: '/input/deskew',
    title: '自动纠偏',
    description: '在线古籍图片自动纠偏工具，智能检测倾斜角度并校正，支持批量处理扫描件和拍摄图片。',
    keywords: '自动纠偏,图片校正,倾斜校正,古籍扫描,图像处理',
  },
  {
    path: '/input/ocr-vertical',
    title: '竖排OCR',
    description: '专为古籍竖排文字优化的OCR识别工具，支持繁体字、异体字识别，准确率高。',
    keywords: '竖排OCR,古籍识别,文字识别,繁体字OCR,古文识别',
  },
  {
    path: '/input/punctuation',
    title: '自动句读',
    description: '为古文自动添加标点符号，基于AI语义理解，支持多种标点风格。',
    keywords: '自动句读,古文标点,断句工具,文言文标点',
  },
  {
    path: '/input/convert',
    title: '繁简转换',
    description: '繁体简体中文双向转换工具，支持批量转换，保留异体字选项。',
    keywords: '繁简转换,繁体转简体,简体转繁体,中文转换',
  },
  {
    path: '/clean/background-unify',
    title: '背景统一',
    description: '统一古籍页面背景色，消除光照不均和色差，提升数字化质量。',
    keywords: '背景统一,匀光处理,古籍修复,图像增强',
  },
  {
    path: '/clean/inpaint',
    title: '蠹鱼眼修复',
    description: 'AI智能修复古籍虫蛀、墨点、污渍等缺陷，还原文字内容。',
    keywords: '蠹鱼眼修复,古籍修复,AI修复,图像修复',
  },
  {
    path: '/pro/glyph-evolution',
    title: '字形演变',
    description: '查看汉字从甲骨文、金文、篆书到楷书的演变历程，了解汉字发展史。',
    keywords: '字形演变,汉字演变,甲骨文,金文,篆书,汉字历史',
  },
  {
    path: '/pro/summary',
    title: '自动摘要',
    description: 'AI生成古籍文本摘要、关键词提取和主题分析，快速了解文献内容。',
    keywords: '自动摘要,AI摘要,关键词提取,古籍分析',
  },
]

// HTML 模板
function generateHTML(tool) {
  const fullUrl = `${BASE_URL}${tool.path}`
  const ogImage = `${BASE_URL}/og-images/default.png`
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tool.title} | 古籍工具</title>
  
  <!-- SEO Meta -->
  <meta name="description" content="${tool.description}" />
  <meta name="keywords" content="${tool.keywords}" />
  <meta name="author" content="古籍工具" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${fullUrl}" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="${tool.title} | 古籍工具" />
  <meta property="og:description" content="${tool.description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${fullUrl}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:site_name" content="古籍工具" />
  <meta property="og:locale" content="zh_CN" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${tool.title} | 古籍工具" />
  <meta name="twitter:description" content="${tool.description}" />
  <meta name="twitter:image" content="${ogImage}" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  
  <!-- Styles -->
  <link rel="stylesheet" href="/assets/index.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>` 

// 生成文件
function generate() {
  const distDir = path.join(__dirname, '../dist')
  
  if (!fs.existsSync(distDir)) {
    console.log('请先运行 npm run build')
    process.exit(1)
  }
  
  // 读取构建后的 index.html 获取实际的资源路径
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8')
  const cssMatch = indexHtml.match(/href="(\/assets\/index[^"]+\.css)"/)
  const jsMatch = indexHtml.match(/src="(\/assets\/index[^"]+\.js)"/)
  
  const cssPath = cssMatch ? cssMatch[1] : '/assets/index.css'
  const jsPath = jsMatch ? jsMatch[1] : '/assets/index.js'
  
  tools.forEach(tool => {
    const html = generateHTML(tool)
      .replace('/assets/index.css', cssPath)
      .replace('/assets/index.js', jsPath)
    
    // 创建目录
    const toolDir = path.join(distDir, tool.path)
    fs.mkdirSync(toolDir, { recursive: true })
    
    // 写入 index.html
    fs.writeFileSync(path.join(toolDir, 'index.html'), html)
    console.log(`✓ 生成: ${tool.path}/index.html`)
  })
  
  console.log(`\n完成! 共生成 ${tools.length} 个页面`)
}

generate()
