<script setup lang="ts">
/**
 * 视觉无损压缩
 * SEO 优化版本
 */
import { ref, computed } from 'vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '图片压缩',
  path: '/clean/image-compress',
  category: '图像清理',
  categoryPath: '/clean',
  
  description: '免费在线古籍图片压缩工具。支持WebP/AVIF格式转换，视觉无损压缩，大幅减小文件体积，节省存储空间。',
  keywords: ['图片压缩', 'WebP转换', 'AVIF转换', '图像优化', '文件压缩', '古籍图片'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '转换为WebP/AVIF格式，大幅减小文件体积',
  
  features: [
    '支持WebP、AVIF、JPEG格式输出',
    '可调节压缩质量（50%-100%）',
    '可限制最大宽度自动缩放',
    '批量压缩多张图片',
    '显示压缩前后大小对比',
    '显示节省空间百分比',
    '一键打包下载所有结果',
    '本地处理保护隐私'
  ],
  
  howToUse: [
    '上传需要压缩的古籍图片',
    '选择输出格式（推荐WebP）',
    '调整压缩质量（推荐85%）',
    '点击「开始压缩」进行处理',
    '查看压缩效果，下载结果'
  ],
  
  introduction: `古籍扫描件通常文件较大，不便于存储和传输。本工具可以将图片转换为更高效的格式，在保持视觉质量的同时大幅减小文件体积。

WebP格式是目前最推荐的选择，兼容性好且压缩率高，通常可以减少50%-70%的文件大小。AVIF是更新的格式，压缩率更高，但兼容性稍差。

压缩质量建议设置在80-90%之间，这个范围内视觉差异几乎不可察觉，但文件大小会显著减小。`,

  faq: [
    {
      question: '哪种格式压缩效果最好？',
      answer: 'AVIF压缩率最高，但兼容性较差。WebP是最佳平衡选择，兼容性好且压缩率高。'
    },
    {
      question: '压缩后画质会下降吗？',
      answer: '85%以上的质量设置，视觉上几乎看不出差异。古籍文字类图片尤其适合压缩。'
    },
    {
      question: '最大宽度限制有什么用？',
      answer: '可以在压缩的同时缩小图片尺寸，进一步减小文件大小。设为0表示不限制。'
    },
    {
      question: '压缩速度如何？',
      answer: '取决于图片大小和数量。单张2000x3000的图片通常在1-2秒内完成。'
    },
    {
      question: '图片会上传到服务器吗？',
      answer: '不会。所有处理都在浏览器本地完成，图片不会上传到任何服务器。'
    }
  ],
  
  supportedFormats: ['JPG', 'PNG', 'BMP', 'WebP'],
  maxFileSize: 30,
  isOffline: true,
  isFree: true
}

const files = ref<File[]>([])
const results = ref<Array<{ name: string; original: number; compressed: number; url: string; format: string }>>([])
const processing = ref(false)
const progress = ref(0)

// 设置
const outputFormat = ref<'webp' | 'avif' | 'jpeg'>('webp')
const quality = ref(85)
const maxWidth = ref(0) // 0 = 不限制

const formatInfo = {
  webp: { name: 'WebP', desc: '兼容性好，压缩率高', support: true },
  avif: { name: 'AVIF', desc: '最新格式，压缩率最高', support: typeof window !== 'undefined' && 'OffscreenCanvas' in window },
  jpeg: { name: 'JPEG', desc: '传统格式，兼容性最好', support: true },
}

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
  files.value = [...files.value, ...imageFiles]
}

function removeFile(index: number) {
  files.value.splice(index, 1)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

async function compressImage(file: File): Promise<{ blob: Blob; format: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let width = img.width
      let height = img.height
      
      if (maxWidth.value > 0 && width > maxWidth.value) {
        height = (maxWidth.value / width) * height
        width = maxWidth.value
      }
      
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      
      const mimeType = `image/${outputFormat.value}`
      canvas.toBlob(
        blob => blob ? resolve({ blob, format: outputFormat.value }) : reject(new Error('Compress failed')),
        mimeType,
        quality.value / 100
      )
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

async function doCompress() {
  if (files.value.length === 0) return
  
  processing.value = true
  progress.value = 0
  results.value = []
  
  for (let i = 0; i < files.value.length; i++) {
    const file = files.value[i]
    try {
      const { blob, format } = await compressImage(file)
      const url = URL.createObjectURL(blob)
      results.value.push({
        name: file.name.replace(/\.[^.]+$/, `.${format}`),
        original: file.size,
        compressed: blob.size,
        url,
        format
      })
    } catch (e) {
      console.error(e)
    }
    progress.value = Math.round(((i + 1) / files.value.length) * 100)
  }
  
  processing.value = false
}

function downloadOne(result: typeof results.value[0]) {
  const a = document.createElement('a')
  a.href = result.url
  a.download = result.name
  a.click()
}

async function downloadAll() {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  
  for (const r of results.value) {
    const resp = await fetch(r.url)
    const blob = await resp.blob()
    zip.file(r.name, blob)
  }
  
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = `compressed_images.zip`
  a.click()
}

function clearAll() {
  files.value = []
  results.value = []
}

const totalSaved = computed(() => {
  const original = results.value.reduce((s, r) => s + r.original, 0)
  const compressed = results.value.reduce((s, r) => s + r.compressed, 0)
  return { original, compressed, saved: original - compressed, percent: original > 0 ? Math.round((1 - compressed / original) * 100) : 0 }
})
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">

    <!-- 设置 -->
    <div class="settings-section">
      <div class="setting-group">
        <label>输出格式</label>
        <div class="radio-group">
          <label v-for="(info, fmt) in formatInfo" :key="fmt" :class="{ disabled: !info.support }">
            <input type="radio" v-model="outputFormat" :value="fmt" :disabled="!info.support" />
            {{ info.name }}
            <span class="hint">{{ info.desc }}</span>
          </label>
        </div>
      </div>
      <div class="setting-group">
        <label>压缩质量: {{ quality }}%</label>
        <input type="range" v-model="quality" min="50" max="100" class="slider" />
      </div>
      <div class="setting-group">
        <label>最大宽度 (0=不限制)</label>
        <input type="number" v-model="maxWidth" min="0" step="100" class="num-input" placeholder="如 2000" />
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
      <p class="upload-hint">支持 JPG、PNG、BMP 等格式</p>
    </div>

    <!-- 文件列表 -->
    <div v-if="files.length > 0" class="file-list">
      <div class="file-header">
        <span>已选择 {{ files.length }} 个文件</span>
        <button @click="clearAll" class="clear-btn">清空</button>
      </div>
      <div v-for="(file, i) in files" :key="i" class="file-item">
        <span class="file-name">{{ file.name }}</span>
        <span class="file-size">{{ formatSize(file.size) }}</span>
        <button @click="removeFile(i)" class="remove-btn">×</button>
      </div>
      <div class="compress-btn-row">
        <button class="compress-btn" @click="doCompress" :disabled="processing">
          {{ processing ? `压缩中 ${progress}%` : '开始压缩' }}
        </button>
        <ToolFeedback tool-name="图片压缩" />
      </div>
    </div>

    <!-- 结果 -->
    <div v-if="results.length > 0" class="result-section">
      <div class="result-summary">
        <span>✅ 压缩完成！节省 {{ formatSize(totalSaved.saved) }} ({{ totalSaved.percent }}%)</span>
        <button @click="downloadAll" class="download-all-btn">打包下载</button>
      </div>
      <div v-for="(r, i) in results" :key="i" class="result-item">
        <span class="result-name">{{ r.name }}</span>
        <span class="result-size">{{ formatSize(r.original) }} → {{ formatSize(r.compressed) }}</span>
        <span class="result-saved">-{{ Math.round((1 - r.compressed / r.original) * 100) }}%</span>
        <button @click="downloadOne(r)" class="download-btn">下载</button>
      </div>
    </div>

    </ToolPageSeo>
</template>

<style scoped>
.tool-body { @apply max-w-4xl mx-auto space-y-4; }

.settings-section { @apply bg-white rounded-xl p-4 space-y-4; }
.setting-group label:first-child { @apply block text-sm text-stone-600 mb-2; }
.radio-group { @apply flex flex-col gap-2; }
.radio-group label { @apply flex items-center gap-2 text-sm cursor-pointer; }
.radio-group label.disabled { @apply opacity-50 cursor-not-allowed; }
.radio-group .hint { @apply text-xs text-stone-400 ml-1; }
.slider { @apply w-full max-w-xs; }
.num-input { @apply w-32 px-3 py-1 border border-stone-300 rounded; }

.upload-zone {
  @apply bg-white border-2 border-dashed border-stone-300 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 transition-colors;
}
.upload-text { @apply text-stone-600 mb-1; }
.upload-hint { @apply text-sm text-stone-400; }

.file-list { @apply bg-white rounded-xl p-4; }
.file-header { @apply flex justify-between items-center mb-3 pb-2 border-b border-stone-200; }
.clear-btn { @apply text-sm text-stone-500 hover:text-red-500; }
.file-item { @apply flex items-center gap-3 py-2 border-b border-stone-100 last:border-0; }
.file-name { @apply flex-1 truncate text-sm; }
.file-size { @apply text-sm text-stone-500; }
.remove-btn { @apply w-6 h-6 text-stone-400 hover:text-red-500; }
.compress-btn { @apply w-full mt-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50; }
.compress-btn-row { @apply flex gap-3 mt-4; }

.result-section { @apply bg-white rounded-xl p-4; }
.result-summary { @apply flex justify-between items-center mb-4 pb-3 border-b border-stone-200; }
.download-all-btn { @apply px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm; }
.result-item { @apply flex items-center gap-3 py-2 border-b border-stone-100 last:border-0; }
.result-name { @apply flex-1 truncate text-sm; }
.result-size { @apply text-sm text-stone-500; }
.result-saved { @apply text-sm text-green-600 font-medium; }
.download-btn { @apply px-3 py-1 border border-stone-300 rounded text-sm hover:bg-stone-50; }
</style>
