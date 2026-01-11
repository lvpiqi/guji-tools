<script setup lang="ts">
/**
 * 空白/重复页检测
 * SEO 优化版本
 */
import { ref, computed } from 'vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '空白页检测',
  path: '/clean/blank-detect',
  category: '图像清理',
  categoryPath: '/clean',
  
  description: '免费在线古籍空白页和重复页检测工具。自动识别空白页、重复扫描页，批量清理无效页面，提高古籍数字化效率。',
  keywords: ['空白页检测', '重复页检测', '古籍清理', '批量删除', '图像去重', '扫描件整理'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '自动检测空白页和重复页，批量清理无效页面',
  
  features: [
    '自动检测空白页（基于亮度分析）',
    '智能识别重复页（感知哈希算法）',
    '可调节空白页亮度阈值',
    '可调节重复检测灵敏度',
    '支持批量选中问题页',
    '一键删除选中页面',
    '导出清理后的图片包',
    '按文件名自动排序'
  ],
  
  howToUse: [
    '上传需要检测的古籍扫描图片',
    '调整空白页阈值和重复检测灵敏度',
    '点击「开始检测」进行分析',
    '查看检测结果，点击「选中问题页」',
    '确认后删除选中页或导出清理后的图片'
  ],
  
  introduction: `古籍扫描过程中常会产生空白页和重复扫描的页面，手动逐一检查非常耗时。本工具可以自动检测这些问题页面。

空白页检测基于图像亮度分析，当页面平均亮度超过设定阈值时判定为空白页。重复页检测使用感知哈希算法，可以识别内容相似的页面。

检测完成后，可以一键选中所有问题页，确认无误后批量删除，最后导出清理后的图片包。`,

  faq: [
    {
      question: '空白页阈值如何设置？',
      answer: '默认95%适合大多数情况。如果有浅色背景的页面被误判，可以适当提高阈值。'
    },
    {
      question: '重复检测灵敏度如何调整？',
      answer: '灵敏度越高，越容易检测到相似页面。如果误判较多，可以降低灵敏度。'
    },
    {
      question: '检测速度如何？',
      answer: '取决于图片数量和大小。100张图片通常在10-30秒内完成检测。'
    },
    {
      question: '会误删重要页面吗？',
      answer: '工具只是标记问题页，删除前需要您确认。建议仔细检查后再删除。'
    },
    {
      question: '支持哪些图片格式？',
      answer: '支持常见的 JPG、PNG、WebP 等图片格式。'
    }
  ],
  
  supportedFormats: ['JPG', 'PNG', 'WebP', 'BMP'],
  maxFileSize: 20,
  isOffline: true,
  isFree: true
}

interface PageInfo {
  file: File
  url: string
  isBlank: boolean
  isDuplicate: boolean
  duplicateOf?: number
  brightness: number
  hash: string
  selected: boolean
}

const pages = ref<PageInfo[]>([])
const processing = ref(false)
const progress = ref(0)

// 设置
const blankThreshold = ref(95) // 亮度阈值，高于此值视为空白
const duplicateSensitivity = ref(90) // 相似度阈值

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const items = e.dataTransfer?.files
  if (items) addFiles(Array.from(items))
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
}

function addFiles(newFiles: File[]) {
  const imageFiles = newFiles.filter(f => f.type.startsWith('image/'))
  imageFiles.sort((a, b) => a.name.localeCompare(b.name))
  
  for (const file of imageFiles) {
    pages.value.push({
      file,
      url: URL.createObjectURL(file),
      isBlank: false,
      isDuplicate: false,
      brightness: 0,
      hash: '',
      selected: false
    })
  }
}

// 计算图片平均亮度
function calcBrightness(imageData: ImageData): number {
  const data = imageData.data
  let total = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    total += (r + g + b) / 3
  }
  return (total / (data.length / 4)) / 255 * 100
}

// 计算感知哈希 (pHash 简化版)
function calcHash(imageData: ImageData): string {
  const size = 8
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  // 缩小到 8x8
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = imageData.width
  tempCanvas.height = imageData.height
  tempCanvas.getContext('2d')!.putImageData(imageData, 0, 0)
  ctx.drawImage(tempCanvas, 0, 0, size, size)
  
  const smallData = ctx.getImageData(0, 0, size, size).data
  const grays: number[] = []
  for (let i = 0; i < smallData.length; i += 4) {
    grays.push((smallData[i] + smallData[i + 1] + smallData[i + 2]) / 3)
  }
  
  const avg = grays.reduce((a, b) => a + b, 0) / grays.length
  return grays.map(g => g > avg ? '1' : '0').join('')
}

// 计算汉明距离
function hammingDistance(h1: string, h2: string): number {
  let dist = 0
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) dist++
  }
  return dist
}

async function analyzeImage(file: File): Promise<{ brightness: number; hash: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(200 / img.width, 200 / img.height, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      resolve({
        brightness: calcBrightness(imageData),
        hash: calcHash(imageData)
      })
    }
    img.src = URL.createObjectURL(file)
  })
}

async function doAnalyze() {
  if (pages.value.length === 0) return
  
  processing.value = true
  progress.value = 0
  
  // 分析每张图片
  for (let i = 0; i < pages.value.length; i++) {
    const page = pages.value[i]
    const { brightness, hash } = await analyzeImage(page.file)
    page.brightness = brightness
    page.hash = hash
    page.isBlank = brightness >= blankThreshold.value
    progress.value = Math.round(((i + 1) / pages.value.length) * 100)
  }
  
  // 检测重复页
  const threshold = Math.floor((100 - duplicateSensitivity.value) / 100 * 64)
  for (let i = 1; i < pages.value.length; i++) {
    for (let j = 0; j < i; j++) {
      if (hammingDistance(pages.value[i].hash, pages.value[j].hash) <= threshold) {
        pages.value[i].isDuplicate = true
        pages.value[i].duplicateOf = j
        break
      }
    }
  }
  
  processing.value = false
}

function selectProblems() {
  pages.value.forEach(p => {
    p.selected = p.isBlank || p.isDuplicate
  })
}

function deleteSelected() {
  pages.value = pages.value.filter(p => !p.selected)
}

async function exportClean() {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  
  const cleanPages = pages.value.filter(p => !p.selected)
  for (let i = 0; i < cleanPages.length; i++) {
    const p = cleanPages[i]
    const ext = p.file.name.split('.').pop()
    zip.file(`page_${String(i + 1).padStart(4, '0')}.${ext}`, p.file)
  }
  
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = 'clean_pages.zip'
  a.click()
}

function clearAll() {
  pages.value.forEach(p => URL.revokeObjectURL(p.url))
  pages.value = []
}

const stats = computed(() => ({
  total: pages.value.length,
  blank: pages.value.filter(p => p.isBlank).length,
  duplicate: pages.value.filter(p => p.isDuplicate).length,
  selected: pages.value.filter(p => p.selected).length
}))
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">

    <!-- 设置 -->
    <div class="settings-section">
      <div class="setting-group">
        <label>空白页阈值: {{ blankThreshold }}%</label>
        <input type="range" v-model="blankThreshold" min="80" max="100" class="slider" />
        <span class="hint">亮度高于此值视为空白</span>
      </div>
      <div class="setting-group">
        <label>重复检测灵敏度: {{ duplicateSensitivity }}%</label>
        <input type="range" v-model="duplicateSensitivity" min="70" max="100" class="slider" />
      </div>
    </div>

    <!-- 上传区域 -->
    <div 
      class="upload-zone"
      @drop="handleDrop"
      @dragover.prevent
      @click="($refs.fileInput as HTMLInputElement).click()"
    >
      <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="handleFileSelect" />
      <p class="upload-text">📁 拖放图片到此处，或点击选择</p>
      <p class="upload-hint">支持批量上传，按文件名排序</p>
    </div>

    <!-- 操作栏 -->
    <div v-if="pages.length > 0" class="action-bar">
      <span>共 {{ stats.total }} 页</span>
      <button @click="doAnalyze" :disabled="processing" class="analyze-btn">
        {{ processing ? `分析中 ${progress}%` : '开始检测' }}
      </button>
      <button @click="selectProblems" class="select-btn">选中问题页</button>
      <button @click="deleteSelected" :disabled="stats.selected === 0" class="delete-btn">
        删除选中 ({{ stats.selected }})
      </button>
      <button @click="exportClean" class="export-btn">导出清理后</button>
      <button @click="clearAll" class="clear-btn">清空</button>
      <ToolFeedback tool-name="空白页检测" />
    </div>

    <!-- 统计 -->
    <div v-if="stats.blank > 0 || stats.duplicate > 0" class="stats-bar">
      <span class="stat blank">⬜ 空白页: {{ stats.blank }}</span>
      <span class="stat duplicate">🔁 重复页: {{ stats.duplicate }}</span>
    </div>

    <!-- 页面网格 -->
    <div v-if="pages.length > 0" class="pages-grid">
      <div 
        v-for="(page, i) in pages" 
        :key="i"
        class="page-card"
        :class="{ selected: page.selected, blank: page.isBlank, duplicate: page.isDuplicate }"
        @click="page.selected = !page.selected"
      >
        <img :src="page.url" :alt="page.file.name" />
        <div class="page-info">
          <span class="page-num">#{{ i + 1 }}</span>
          <span v-if="page.isBlank" class="badge blank">空白</span>
          <span v-if="page.isDuplicate" class="badge duplicate">重复 #{{ (page.duplicateOf ?? 0) + 1 }}</span>
        </div>
        <div class="page-name">{{ page.file.name }}</div>
      </div>
    </div>

    </ToolPageSeo>
</template>

<style scoped>
.tool-body { @apply space-y-4; }
.settings-section { @apply bg-white rounded-xl p-4 flex flex-wrap gap-6; }
.setting-group { @apply flex flex-col gap-1; }
.setting-group label { @apply text-sm text-stone-600; }
.slider { @apply w-48; }
.hint { @apply text-xs text-stone-400; }

.upload-zone {
  @apply bg-white border-2 border-dashed border-stone-300 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 transition-colors;
}
.upload-text { @apply text-stone-600 mb-1; }
.upload-hint { @apply text-sm text-stone-400; }

.action-bar { @apply bg-white rounded-xl p-3 flex flex-wrap items-center gap-3; }
.action-bar span { @apply text-sm text-stone-600; }
.analyze-btn { @apply px-4 py-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50; }
.select-btn { @apply px-3 py-1.5 border border-stone-300 rounded hover:bg-stone-50; }
.delete-btn { @apply px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50; }
.export-btn { @apply px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600; }
.clear-btn { @apply px-3 py-1.5 text-stone-500 hover:text-red-500; }

.stats-bar { @apply bg-amber-50 rounded-lg p-3 flex gap-6; }
.stat { @apply text-sm font-medium; }
.stat.blank { @apply text-orange-600; }
.stat.duplicate { @apply text-purple-600; }

.pages-grid { @apply grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3; }
.page-card {
  @apply relative bg-white rounded-lg overflow-hidden border-2 border-transparent cursor-pointer hover:border-amber-400 transition-all;
}
.page-card.selected { @apply border-amber-500 ring-2 ring-amber-200; }
.page-card.blank { @apply bg-orange-50; }
.page-card.duplicate { @apply bg-purple-50; }
.page-card img { @apply w-full aspect-[3/4] object-cover; }
.page-info { @apply absolute top-1 left-1 right-1 flex flex-wrap gap-1; }
.page-num { @apply bg-black/50 text-white text-xs px-1 rounded; }
.badge { @apply text-xs px-1 rounded; }
.badge.blank { @apply bg-orange-500 text-white; }
.badge.duplicate { @apply bg-purple-500 text-white; }
.page-name { @apply text-xs text-stone-500 p-1 truncate; }
</style>
