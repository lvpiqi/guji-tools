/**
 * 为每个工具页生成独立的 HTML 文件（SEO 优化）
 * 运行: node scripts/generate-html.js
 * 在 npm run build 之后执行
 */
const fs = require('fs')
const path = require('path')

const BASE_URL = 'https://www.gujitools.com'
const SITE_NAME = '古籍工具'

// 完整的工具页面配置（26个工具）
const tools = [
  // 输入场景 (8个)
  {
    path: '/input/remove-finger',
    title: '去手指阴影',
    description: '免费在线去除古籍拍摄时的手指和阴影。基于AI智能识别，自动检测并修复手指遮挡区域，支持批量处理，本地运行保护隐私。',
    keywords: '去手指阴影,古籍拍摄,图像修复,阴影去除,AI修复,古籍数字化',
  },
  {
    path: '/input/deskew',
    title: '自动纠偏',
    description: '免费在线古籍图片自动纠偏工具。智能检测倾斜角度并校正，支持批量处理扫描件和拍摄图片，提升古籍数字化质量。',
    keywords: '自动纠偏,图片校正,倾斜校正,古籍扫描,图像处理,批量纠偏',
  },
  {
    path: '/input/ocr-vertical',
    title: '竖排OCR',
    description: '免费在线竖排OCR识别工具。专为古籍竖排文字优化，支持繁体字、异体字识别，准确率高，本地处理保护隐私。',
    keywords: '竖排OCR,古籍识别,文字识别,繁体字OCR,古文识别,竖排文字',
  },
  {
    path: '/input/punctuation',
    title: '自动句读',
    description: '免费在线古文自动句读工具。基于AI语义理解为文言文自动添加标点符号，支持多种标点风格，提高古籍阅读效率。',
    keywords: '自动句读,古文标点,断句工具,文言文标点,AI句读,古籍标点',
  },
  {
    path: '/input/convert',
    title: '繁简转换',
    description: '免费在线繁简转换工具。繁体简体中文双向转换，支持批量转换，保留异体字选项，适合古籍文本处理。',
    keywords: '繁简转换,繁体转简体,简体转繁体,中文转换,异体字,古籍转换',
  },
  {
    path: '/input/batch-rename',
    title: '批量重命名',
    description: '免费在线批量重命名工具。按规则批量重命名文件并打包下载，支持序号、日期等多种命名规则，适合古籍整理。',
    keywords: '批量重命名,文件重命名,ZIP打包,文件整理,古籍整理',
  },
  {
    path: '/input/segmentation',
    title: '古汉语分词',
    description: '免费在线古汉语分词工具。文言文自动分词和词性标注，基于AI语义分析，帮助理解古文结构。',
    keywords: '古汉语分词,文言文分词,词性标注,古文分析,NLP,自然语言处理',
  },
  {
    path: '/input/pinyin',
    title: '拼音注音',
    description: '免费在线拼音注音工具。为古文添加拼音或注音标注，支持多音字选择，帮助古籍阅读和学习。',
    keywords: '拼音注音,汉语拼音,注音符号,古文注音,多音字,古籍阅读',
  },
  
  // 清理场景 (8个)
  {
    path: '/clean/background-unify',
    title: '背景统一',
    description: '免费在线古籍背景统一工具。统一页面背景色，消除光照不均和色差，提升古籍数字化质量。',
    keywords: '背景统一,匀光处理,古籍修复,图像增强,色差消除,扫描优化',
  },
  {
    path: '/clean/inpaint',
    title: '蠹鱼眼修复',
    description: '免费在线古籍蠹鱼眼修复工具。AI智能修复虫蛀、墨点、污渍等缺陷，还原古籍文字内容。',
    keywords: '蠹鱼眼修复,古籍修复,AI修复,图像修复,虫蛀修复,污渍去除',
  },
  {
    path: '/clean/super-resolution',
    title: 'AI超分',
    description: '免费在线AI超分辨率工具。提升古籍图像分辨率和清晰度，让模糊的扫描件变得清晰可读。',
    keywords: 'AI超分,超分辨率,图像增强,清晰度提升,古籍修复,图像放大',
  },
  {
    path: '/clean/extract-seal',
    title: '印章提取',
    description: '免费在线印章提取工具。从古籍文档中智能提取印章图像，支持红色印章自动识别和分离。',
    keywords: '印章提取,印章识别,古籍印章,图像分离,红色印章,文档处理',
  },
  {
    path: '/clean/spine-remove',
    title: '中缝去除',
    description: '免费在线中缝阴影去除工具。消除书籍扫描时中缝产生的黑影，让页面更加均匀清晰。',
    keywords: '中缝去除,阴影补偿,书脊阴影,古籍扫描,图像修复,扫描优化',
  },
  {
    path: '/clean/compress',
    title: '图片压缩',
    description: '免费在线图片压缩工具。视觉无损压缩，支持WebP/AVIF格式转换，大幅减小古籍图片文件体积。',
    keywords: '图片压缩,WebP转换,AVIF转换,图像优化,文件压缩,古籍图片',
  },
  {
    path: '/clean/blank-detect',
    title: '空白页检测',
    description: '免费在线空白页检测工具。自动检测古籍扫描件中的空白页和重复页，批量清理无效页面。',
    keywords: '空白页检测,重复页检测,古籍清理,批量删除,图像去重,扫描整理',
  },
  {
    path: '/clean/stain-remove',
    title: '污渍修复',
    description: '免费在线古籍污渍修复工具。自动检测并修复水渍、黄斑、霉斑等污渍，还原清晰页面。',
    keywords: '污渍修复,水渍去除,黄斑修复,古籍修复,图像修复,霉斑去除',
  },
  
  // 阅读场景 (4个)
  {
    path: '/read/vertical-horizontal',
    title: '竖横排转换',
    description: '免费在线竖横排转换工具。将古籍竖排文字转为横排显示，支持自定义字体和行距，方便阅读。',
    keywords: '竖排转换,横排转换,古文排版,竖排阅读,古籍排版,文字方向',
  },
  {
    path: '/read/dictionary',
    title: '划词释义',
    description: '免费在线划词释义工具。点击或选中古文汉字即可查看释义、异体字、韵部等信息，辅助古籍阅读。',
    keywords: '划词释义,古文字典,汉字释义,异体字,韵部查询,古文阅读',
  },
  {
    path: '/read/tts',
    title: '古文朗读',
    description: '免费在线古文朗读工具。使用语音合成朗读古文，支持调节语速、音调，帮助理解古籍内容。',
    keywords: '古文朗读,文字转语音,TTS,语音合成,古籍朗读,有声古文',
  },
  {
    path: '/read/translate',
    title: '古文翻译',
    description: '免费在线古文翻译工具。使用AI将文言文翻译为现代汉语和英文，支持直译和意译两种风格。',
    keywords: '古文翻译,文言文翻译,古文白话,古籍翻译,AI翻译,中英翻译',
  },
  
  // 搜索场景 (2个)
  {
    path: '/search/variant-search',
    title: '异体字搜索',
    description: '免费在线异体字搜索工具。输入汉字查找所有异体字变体，支持AI动态生成，每个字有独立详情页。',
    keywords: '异体字,异体字查询,汉字变体,繁简转换,古今字,通假字',
  },
  {
    path: '/search/diff-compare',
    title: '版本对比',
    description: '免费在线版本对比工具。对比两个版本的古籍文本差异，高亮显示增删改，支持并排和内联视图。',
    keywords: '版本对比,文本对比,差异比较,古籍校勘,文字校对,异文对比',
  },
  
  // 导出场景 (4个)
  {
    path: '/export/dual-layer-pdf',
    title: '双层PDF',
    description: '免费在线双层PDF生成工具。图像作为背景层，透明文字作为搜索层，生成可搜索的古籍PDF文档。',
    keywords: '双层PDF,可搜索PDF,OCR PDF,古籍PDF,文字层,图像PDF',
  },
  {
    path: '/export/epub',
    title: 'EPUB生成',
    description: '免费在线EPUB电子书生成工具。将古籍文本转换为EPUB格式，支持竖排排版、自定义字体和封面。',
    keywords: 'EPUB生成,电子书制作,古籍电子书,竖排电子书,EPUB转换,电子书格式',
  },
  {
    path: '/export/long-image',
    title: '长图生成',
    description: '免费在线长图生成工具。将多张古籍图片或文本拼接成小红书风格长图，支持自定义背景和水印。',
    keywords: '长图生成,图片拼接,小红书长图,文字长图,图片合并,古籍分享',
  },
  {
    path: '/export/plain-text',
    title: '纯文本导出',
    description: '免费在线纯文本导出工具。将古籍内容导出为TXT/Markdown格式，支持标点转换和行号添加。',
    keywords: '纯文本导出,TXT导出,Markdown导出,古籍文本,标点转换,文本格式化',
  },
  
  // 专业场景 (4个)
  {
    path: '/pro/glyph-evolution',
    title: '字形演变',
    description: '免费在线字形演变查询工具。查看汉字从甲骨文、金文、篆书、隶书到楷书的演变历程，了解汉字发展史。',
    keywords: '字形演变,甲骨文,金文,篆书,隶书,汉字演变,文字学',
  },
  {
    path: '/pro/rhyme-check',
    title: '押韵检测',
    description: '免费在线押韵检测工具。基于平水韵检测古诗词的韵部和押韵情况，支持AI查询未收录字的韵部。',
    keywords: '押韵检测,平水韵,韵部查询,古诗词,诗词格律,韵脚分析',
  },
  {
    path: '/pro/color-palette',
    title: '古画色卡',
    description: '免费在线古画色卡提取工具。从古画中提取主要颜色，自动匹配中国传统色名，支持复制色值。',
    keywords: '古画色卡,颜色提取,中国传统色,配色方案,古典配色,色彩分析',
  },
  {
    path: '/pro/summary',
    title: '自动摘要',
    description: '免费在线古文自动摘要工具。AI全面分析古文，生成摘要、翻译、关键词、主题分析和深度解读。',
    keywords: '自动摘要,古文分析,AI摘要,关键词提取,主题分析,古文翻译',
  },
]

// HTML 模板
function generateHTML(tool, cssPath, jsPath) {
  const fullUrl = `${BASE_URL}${tool.path}`
  const ogImage = `${BASE_URL}/og-images/default.png`
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tool.title} - ${SITE_NAME}</title>
  
  <!-- SEO Meta -->
  <meta name="description" content="${tool.description}" />
  <meta name="keywords" content="${tool.keywords}" />
  <meta name="author" content="${SITE_NAME}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${fullUrl}" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="${tool.title} - ${SITE_NAME}" />
  <meta property="og:description" content="${tool.description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${fullUrl}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="zh_CN" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${tool.title} - ${SITE_NAME}" />
  <meta name="twitter:description" content="${tool.description}" />
  <meta name="twitter:image" content="${ogImage}" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  
  <!-- Preconnect -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  
  <!-- Styles -->
  <link rel="stylesheet" crossorigin href="${cssPath}" />
</head>
<body>
  <div id="app"></div>
  <script type="module" crossorigin src="${jsPath}"></script>
</body>
</html>`
}

// 生成文件
function generate() {
  const distDir = path.join(__dirname, '../dist')
  
  if (!fs.existsSync(distDir)) {
    console.log('dist 目录不存在，跳过 HTML 生成')
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
  
  let count = 0
  tools.forEach(tool => {
    const html = generateHTML(tool, cssPath, jsPath)
    
    // 创建目录
    const toolDir = path.join(distDir, tool.path)
    fs.mkdirSync(toolDir, { recursive: true })
    
    // 写入 index.html
    fs.writeFileSync(path.join(toolDir, 'index.html'), html)
    console.log(`✓ 生成: ${tool.path}/index.html`)
    count++
  })
  
  console.log(`\n✅ 完成! 共生成 ${count} 个工具页面`)
}

generate()
