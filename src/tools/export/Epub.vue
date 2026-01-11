<script setup lang="ts">
/**
 * EPUB生成工具
 * SEO 优化版本
 */
import { ref, computed } from 'vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'
import { useQuota } from '@core/composables/useQuota'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: 'EPUB生成',
  path: '/export/epub',
  category: '导出分享',
  categoryPath: '/export',
  
  description: '免费在线EPUB电子书生成工具。将古籍文本转换为EPUB格式，支持竖排排版、自定义字体大小和封面图片。',
  keywords: ['EPUB生成', '电子书制作', '古籍电子书', '竖排电子书', 'EPUB转换', '电子书格式'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '将古籍文本转换为EPUB电子书格式',
  
  features: [
    '支持横排和竖排排版',
    '可自定义字体大小',
    '可调节行高间距',
    '支持添加封面图片',
    '自动生成目录导航',
    '符合EPUB 3.0标准',
    '兼容主流阅读器',
    '本地生成保护隐私'
  ],
  
  howToUse: [
    '输入书名和作者信息',
    '可选上传封面图片',
    '选择排版方向和字体大小',
    '粘贴或输入古籍文本内容',
    '点击「生成EPUB」下载电子书'
  ],
  
  introduction: `EPUB是最流行的电子书格式，被各种阅读器和阅读软件广泛支持。本工具可以将古籍文本快速转换为EPUB格式。

工具支持竖排排版，这是阅读古籍的传统方式。竖排模式下文字从上到下、从右到左排列，更符合古籍阅读习惯。

生成的EPUB文件可以在Kindle、Apple Books、多看阅读等各种阅读器上打开。`,

  faq: [
    {
      question: '竖排模式兼容性如何？',
      answer: '大多数现代阅读器都支持竖排。如果显示异常，可以尝试横排模式。'
    },
    {
      question: '封面图片有什么要求？',
      answer: '建议使用JPG或PNG格式，尺寸建议600x800像素左右。'
    },
    {
      question: '如何分段落？',
      answer: '用空行分隔段落。工具会自动识别空行并转换为段落。'
    },
    {
      question: '可以添加章节吗？',
      answer: '当前版本暂不支持多章节。所有内容会作为一个章节。'
    },
    {
      question: '生成的文件在哪些设备上可以阅读？',
      answer: 'EPUB是通用格式，可在手机、平板、电脑、电子书阅读器上阅读。'
    }
  ],
  
  supportedFormats: ['TXT'],
  maxFileSize: 10,
  isOffline: true,
  isFree: true
}

// 配额检查
const { canPerform, consume } = useQuota('epub', 'EPUB生成')

const title = ref('')
const author = ref('')
const content = ref('')
const language = ref('zh')
const coverImage = ref<File | null>(null)
const coverPreview = ref<string | null>(null)

// 排版选项
const fontSize = ref(16)
const lineHeight = ref(1.8)
const writingMode = ref<'horizontal' | 'vertical'>('horizontal')

const generating = ref(false)
const generated = ref(false)
const downloadUrl = ref<string | null>(null)

const canGenerate = computed(() => title.value.trim() && content.value.trim())

function handleCover(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    coverImage.value = file
    coverPreview.value = URL.createObjectURL(file)
  }
}

function removeCover() {
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  coverImage.value = null
  coverPreview.value = null
}

async function generateEpub() {
  if (!canGenerate.value) return
  
  const check = canPerform()
  if (!check.allowed) {
    alert(check.reason || '使用次数已达上限')
    return
  }
  
  generating.value = true
  
  await consume(1)
  
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    // EPUB 结构
    // mimetype (必须是第一个文件，不压缩)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
    
    // META-INF/container.xml
    zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`)
    
    // 生成唯一ID
    const bookId = crypto.randomUUID()
    
    // 封面处理
    let coverManifest = ''
    let coverSpine = ''
    if (coverImage.value) {
      const coverData = await coverImage.value.arrayBuffer()
      const ext = coverImage.value.name.split('.').pop() || 'jpg'
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
      zip.file(`OEBPS/images/cover.${ext}`, coverData)
      coverManifest = `<item id="cover-image" href="images/cover.${ext}" media-type="${mimeType}" properties="cover-image"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`
      coverSpine = '<itemref idref="cover"/>'
      
      // 封面页
      zip.file('OEBPS/cover.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>封面</title></head>
<body style="margin:0;padding:0;text-align:center;">
  <img src="images/cover.${ext}" alt="封面" style="max-width:100%;max-height:100vh;"/>
</body>
</html>`)
    }
    
    // content.opf
    zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${bookId}</dc:identifier>
    <dc:title>${escapeXml(title.value)}</dc:title>
    <dc:creator>${escapeXml(author.value || '佚名')}</dc:creator>
    <dc:language>${language.value}</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
    ${coverManifest}
  </manifest>
  <spine>
    ${coverSpine}
    <itemref idref="content"/>
  </spine>
</package>`)
    
    // nav.xhtml (目录)
    zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>目录</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc">
    <h1>目录</h1>
    <ol>
      <li><a href="content.xhtml">正文</a></li>
    </ol>
  </nav>
</body>
</html>`)
    
    // style.css
    const verticalStyle = writingMode.value === 'vertical' 
      ? 'writing-mode: vertical-rl; text-orientation: mixed;' 
      : ''
    
    zip.file('OEBPS/style.css', `
body {
  font-family: "Songti SC", "SimSun", "Source Han Serif CN", serif;
  font-size: ${fontSize.value}px;
  line-height: ${lineHeight.value};
  margin: 1em;
  ${verticalStyle}
}
h1 { font-size: 1.5em; text-align: center; margin-bottom: 1em; }
p { text-indent: 2em; margin: 0.5em 0; }
`)
    
    // content.xhtml (正文)
    const paragraphs = content.value
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p)
      .map(p => `<p>${escapeXml(p).replace(/\n/g, '<br/>')}</p>`)
      .join('\n    ')
    
    zip.file('OEBPS/content.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(title.value)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${escapeXml(title.value)}</h1>
  ${paragraphs}
</body>
</html>`)
    
    // 生成EPUB
    const blob = await zip.generateAsync({ 
      type: 'blob',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    })
    
    if (downloadUrl.value) URL.revokeObjectURL(downloadUrl.value)
    downloadUrl.value = URL.createObjectURL(blob)
    generated.value = true
    
  } catch (e) {
    console.error('EPUB generation error:', e)
    alert('生成失败: ' + (e instanceof Error ? e.message : '未知错误'))
  } finally {
    generating.value = false
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function downloadEpub() {
  if (!downloadUrl.value) return
  const a = document.createElement('a')
  a.href = downloadUrl.value
  a.download = `${title.value || 'book'}.epub`
  a.click()
}

function reset() {
  title.value = ''
  author.value = ''
  content.value = ''
  removeCover()
  generated.value = false
  if (downloadUrl.value) {
    URL.revokeObjectURL(downloadUrl.value)
    downloadUrl.value = null
  }
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">
      <div class="tool-left">
        <!-- 基本信息 -->
        <div class="form-section">
          <h3 class="section-title">书籍信息</h3>
          
          <div class="form-item">
            <label>书名 *</label>
            <input v-model="title" type="text" placeholder="请输入书名" class="input" />
          </div>
          
          <div class="form-item">
            <label>作者</label>
            <input v-model="author" type="text" placeholder="佚名" class="input" />
          </div>
          
          <div class="form-item">
            <label>封面图片</label>
            <div v-if="coverPreview" class="cover-preview">
              <img :src="coverPreview" alt="封面预览" />
              <button @click="removeCover" class="remove-cover">×</button>
            </div>
            <input v-else type="file" accept="image/*" @change="handleCover" class="file-input" />
          </div>
        </div>

        <!-- 排版设置 -->
        <div class="form-section">
          <h3 class="section-title">排版设置</h3>
          
          <div class="form-item">
            <label>排版方向</label>
            <select v-model="writingMode" class="select">
              <option value="horizontal">横排</option>
              <option value="vertical">竖排（从右到左）</option>
            </select>
          </div>
          
          <div class="form-item">
            <label>字号: {{ fontSize }}px</label>
            <input v-model.number="fontSize" type="range" min="12" max="24" class="range" />
          </div>
          
          <div class="form-item">
            <label>行高: {{ lineHeight }}</label>
            <input v-model.number="lineHeight" type="range" min="1.2" max="2.5" step="0.1" class="range" />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="tool-actions">
          <button class="btn-primary" :disabled="!canGenerate || generating" @click="generateEpub">
            {{ generating ? '生成中...' : '生成EPUB' }}
          </button>
          <button v-if="generated" class="btn-success" @click="downloadEpub">
            下载EPUB
          </button>
          <button class="btn-text" @click="reset">重置</button>
          <ToolFeedback tool-name="EPUB生成" />
        </div>
      </div>

      <div class="tool-right">
        <div class="form-section full-height">
          <h3 class="section-title">正文内容 *</h3>
          <textarea
            v-model="content"
            placeholder="粘贴或输入古籍文本内容...&#10;&#10;段落之间用空行分隔"
            class="content-textarea"
          ></textarea>
        </div>
      </div>
    </div>

    </ToolPageSeo>
</template>

<style scoped>
.tool-body { @apply grid grid-cols-1 lg:grid-cols-2 gap-6; }
.tool-left { @apply space-y-4; }
.tool-right { @apply space-y-4; }
.form-section { @apply bg-white rounded-lg border border-stone-200 p-4; }
.form-section.full-height { @apply flex flex-col min-h-[400px]; }
.section-title { @apply font-medium text-stone-800 mb-3; }
.form-item { @apply mb-3; }
.form-item label { @apply block text-sm text-stone-600 mb-1; }
.input { @apply w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500; }
.select { @apply w-full px-3 py-2 border border-stone-300 rounded-lg; }
.range { @apply w-full accent-amber-500; }
.file-input { @apply text-sm text-stone-500; }
.cover-preview { @apply relative inline-block; }
.cover-preview img { @apply w-32 h-auto rounded border; }
.remove-cover { @apply absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600; }
.content-textarea { @apply flex-1 w-full px-3 py-2 border border-stone-300 rounded-lg resize-none font-serif focus:outline-none focus:ring-2 focus:ring-amber-500; }
.tool-actions { @apply flex gap-3 flex-wrap; }
.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed; }
.btn-success { @apply px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600; }
.btn-text { @apply px-4 py-2 text-stone-500 hover:text-stone-700; }
</style>
