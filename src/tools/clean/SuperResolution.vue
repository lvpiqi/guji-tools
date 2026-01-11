<script setup lang="ts">
/**
 * AI超分工具
 * SEO 优化版本
 */
import { ref, computed } from 'vue'
import FileDropzone from '@components/common/FileDropzone.vue'
import ImageCompare from '@components/common/ImageCompare.vue'
import ProgressBar from '@components/common/ProgressBar.vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: 'AI超分辨率',
  path: '/clean/super-resolution',
  category: '图像清理',
  categoryPath: '/clean',
  
  description: '免费在线古籍图像超分辨率放大工具。支持2x/3x/4x放大，可选锐化增强和降噪处理，提升古籍扫描件清晰度。',
  keywords: ['AI超分', '图像放大', '超分辨率', '古籍清晰', '图像增强', '锐化', '降噪'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '提升古籍图像分辨率，支持2x/3x/4x放大，可选锐化增强',
  
  features: [
    '支持2x、3x、4x倍率放大',
    '高质量双线性插值算法',
    '可选锐化增强，让文字更清晰',
    '可选降噪处理，减少噪点',
    '支持批量处理多张图片',
    '显示放大前后尺寸对比',
    '处理前后对比预览',
    '一键打包下载处理结果'
  ],
  
  howToUse: [
    '上传需要放大的古籍图片',
    '选择放大倍数（2x/3x/4x）',
    '根据需要开启锐化或降噪',
    '点击「开始放大」进行处理',
    '在预览区对比效果，满意后下载'
  ],
  
  introduction: `古籍扫描件分辨率不足时，文字会显得模糊，影响阅读和后续处理。本工具可以将图像放大2-4倍，同时保持较好的清晰度。

工具使用高质量的双线性插值算法进行图像放大，并提供锐化增强选项，可以让放大后的文字边缘更加清晰。对于有噪点的图像，还可以开启降噪处理。

放大后的图像可以用于打印、OCR识别或进一步的数字化处理。建议根据实际需求选择合适的放大倍数，过大的倍数可能导致文件体积过大。`,

  faq: [
    {
      question: '放大倍数如何选择？',
      answer: '根据原图分辨率和目标用途选择。一般OCR识别建议2x，打印建议3-4x。倍数越大文件越大。'
    },
    {
      question: '锐化功能有什么作用？',
      answer: '锐化可以增强图像边缘，让文字更加清晰。对于模糊的扫描件效果明显。'
    },
    {
      question: '降噪功能有什么作用？',
      answer: '降噪可以减少图像中的噪点，让背景更干净。但可能会轻微降低清晰度。'
    },
    {
      question: '处理速度如何？',
      answer: '处理速度取决于图片大小和放大倍数。一般2000x3000的图片2x放大约需2-5秒。'
    },
    {
      question: '图片会上传到服务器吗？',
      answer: '不会。所有处理都在浏览器本地完成，图片不会上传到任何服务器。'
    },
    {
      question: '放大后文件会变大多少？',
      answer: '文件大小与放大倍数的平方成正比。2x放大约4倍，4x放大约16倍。'
    }
  ],
  
  supportedFormats: ['JPG', 'PNG', 'WebP'],
  maxFileSize: 30,
  isOffline: true,
  isFree: true
}

interface Task {
  id: string
  file: File
  originalUrl: string
  resultUrl: string | null
  status: 'pending' | 'processing' | 'done' | 'error'
  originalSize: { width: number; height: number }
  resultSize?: { width: number; height: number }
}

const tasks = ref<Task[]>([])
const selectedId = ref<string | null>(null)
const processing = ref(false)
const progress = ref(0)

// 放大倍数
const scale = ref(2)
const scaleOptions = [
  { value: 2, label: '2x 放大' },
  { value: 3, label: '3x 放大' },
  { value: 4, label: '4x 放大' },
]

// 增强选项
const sharpen = ref(true)
const denoise = ref(false)

const currentTask = computed(() => tasks.value.find(t => t.id === selectedId.value))
const doneCount = computed(() => tasks.value.filter(t => t.status === 'done').length)

async function handleFiles(files: File[]) {
  for (const file of files) {
    const img = await loadImage(file)
    const task: Task = {
      id: crypto.randomUUID(),
      file,
      originalUrl: URL.createObjectURL(file),
      resultUrl: null,
      status: 'pending',
      originalSize: { width: img.width, height: img.height }
    }
    tasks.value.push(task)
    if (!selectedId.value) selectedId.value = task.id
  }
}

async function processAll() {
  processing.value = true
  progress.value = 0
  const pending = tasks.value.filter(t => t.status === 'pending')
  
  for (let i = 0; i < pending.length; i++) {
    await processTask(pending[i])
    progress.value = Math.round(((i + 1) / pending.length) * 100)
  }
  
  processing.value = false
}

async function processTask(task: Task) {
  task.status = 'processing'
  
  try {
    const img = await loadImage(task.file)
    const result = upscaleImage(img, scale.value, sharpen.value, denoise.value)
    
    task.resultSize = { width: result.width, height: result.height }
    const blob = await canvasToBlob(result)
    task.resultUrl = URL.createObjectURL(blob)
    task.status = 'done'
  } catch (e) {
    task.status = 'error'
    console.error('Upscale error:', e)
  }
}

function upscaleImage(img: HTMLImageElement, factor: number, applySharpen: boolean, applyDenoise: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const newWidth = img.width * factor
  const newHeight = img.height * factor
  canvas.width = newWidth
  canvas.height = newHeight
  
  const ctx = canvas.getContext('2d')!
  
  // 使用高质量插值
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, newWidth, newHeight)
  
  // 应用锐化
  if (applySharpen) {
    const imageData = ctx.getImageData(0, 0, newWidth, newHeight)
    sharpenImage(imageData)
    ctx.putImageData(imageData, 0, 0)
  }
  
  // 应用降噪（简单的均值滤波）
  if (applyDenoise) {
    const imageData = ctx.getImageData(0, 0, newWidth, newHeight)
    denoiseImage(imageData)
    ctx.putImageData(imageData, 0, 0)
  }
  
  return canvas
}

function sharpenImage(imageData: ImageData) {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const copy = new Uint8ClampedArray(data)
  
  // 锐化卷积核
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c
            sum += copy[idx] * kernel[(ky + 1) * 3 + (kx + 1)]
          }
        }
        const idx = (y * width + x) * 4 + c
        data[idx] = Math.max(0, Math.min(255, sum))
      }
    }
  }
}

function denoiseImage(imageData: ImageData) {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const copy = new Uint8ClampedArray(data)
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c
            sum += copy[idx]
          }
        }
        const idx = (y * width + x) * 4 + c
        data[idx] = Math.round(sum / 9)
      }
    }
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed')), 'image/png')
  })
}

function downloadResult(task: Task) {
  if (!task.resultUrl) return
  const a = document.createElement('a')
  a.href = task.resultUrl
  a.download = `upscale_${scale.value}x_${task.file.name}`
  a.click()
}

async function downloadAll() {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  
  for (const task of tasks.value) {
    if (task.resultUrl) {
      const response = await fetch(task.resultUrl)
      const blob = await response.blob()
      zip.file(`upscale_${scale.value}x_${task.file.name}`, blob)
    }
  }
  
  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'upscaled_images.zip'
  a.click()
}

function clearAll() {
  tasks.value.forEach(t => {
    if (t.originalUrl) URL.revokeObjectURL(t.originalUrl)
    if (t.resultUrl) URL.revokeObjectURL(t.resultUrl)
  })
  tasks.value = []
  selectedId.value = null
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">
      <div class="tool-left">
        <FileDropzone
          accept="image/jpeg,image/png,image/webp"
          :max-size="30"
          @files="handleFiles"
        />

        <div class="settings-panel">
          <h3 class="settings-title">放大设置</h3>
          
          <div class="setting-item">
            <span>放大倍数</span>
            <select v-model="scale" class="select-input">
              <option v-for="opt in scaleOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          
          <label class="setting-item">
            <input type="checkbox" v-model="sharpen" />
            <span>锐化增强</span>
          </label>
          
          <label class="setting-item">
            <input type="checkbox" v-model="denoise" />
            <span>降噪处理</span>
          </label>
        </div>

        <div v-if="tasks.length" class="task-list">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="task-item"
            :class="{ active: selectedId === task.id, done: task.status === 'done' }"
            @click="selectedId = task.id"
          >
            <div class="task-info">
              <span class="task-name">{{ task.file.name }}</span>
              <span class="task-size">
                {{ task.originalSize.width }}×{{ task.originalSize.height }}
                <template v-if="task.resultSize">
                  → {{ task.resultSize.width }}×{{ task.resultSize.height }}
                </template>
              </span>
            </div>
            <span class="task-status">
              <template v-if="task.status === 'pending'">待处理</template>
              <template v-else-if="task.status === 'processing'">处理中...</template>
              <template v-else-if="task.status === 'done'">✓</template>
              <template v-else>✗</template>
            </span>
          </div>
        </div>

        <div class="tool-actions">
          <div class="actions-left">
            <button class="btn-primary" :disabled="!tasks.length || processing" @click="processAll">
              {{ processing ? '处理中...' : '开始放大' }}
            </button>
            <button class="btn-secondary" :disabled="doneCount === 0" @click="downloadAll">
              打包下载 ({{ doneCount }})
            </button>
            <button class="btn-text" :disabled="!tasks.length" @click="clearAll">清空</button>
          </div>
          <ToolFeedback tool-name="AI超分辨率" />
        </div>

        <ProgressBar v-if="processing" :value="progress" class="mt-4" />
      </div>

      <div class="tool-preview">
        <template v-if="currentTask?.resultUrl">
          <ImageCompare :before="currentTask.originalUrl" :after="currentTask.resultUrl" />
          <button class="btn-download" @click="downloadResult(currentTask)">下载此图</button>
        </template>
        <template v-else-if="currentTask">
          <img :src="currentTask.originalUrl" class="preview-image" alt="预览" />
        </template>
        <div v-else class="preview-empty">上传图片开始处理</div>
      </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-page { @apply max-w-6xl mx-auto; }
.tool-header { @apply mb-6; }
.tool-title { @apply text-2xl font-bold text-stone-800; }
.tool-desc { @apply text-stone-600 mt-1; }
.tool-body { @apply grid grid-cols-1 lg:grid-cols-2 gap-6; }
.tool-left { @apply space-y-4; }
.settings-panel { @apply bg-white rounded-lg border border-stone-200 p-4; }
.settings-title { @apply font-medium text-stone-800 mb-3; }
.setting-item { @apply flex items-center gap-2 py-2 text-sm text-stone-700; }
.setting-item input[type="checkbox"] { @apply w-4 h-4 accent-amber-500; }
.select-input { @apply ml-auto px-3 py-1 border border-stone-300 rounded text-sm; }
.task-list { @apply bg-white rounded-lg border border-stone-200 divide-y divide-stone-100 max-h-48 overflow-auto; }
.task-item { @apply flex justify-between items-center px-4 py-2 cursor-pointer hover:bg-stone-50; }
.task-item.active { @apply bg-amber-50; }
.task-item.done .task-status { @apply text-green-600; }
.task-info { @apply flex flex-col; }
.task-name { @apply text-sm text-stone-700 truncate; }
.task-size { @apply text-xs text-stone-400; }
.task-status { @apply text-xs text-stone-500; }
.tool-actions { @apply flex gap-3 flex-wrap; }
.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed; }
.btn-secondary { @apply px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed; }
.btn-text { @apply px-4 py-2 text-stone-500 hover:text-stone-700 disabled:opacity-50; }
.tool-preview { @apply bg-white rounded-xl border border-stone-200 p-4 min-h-[400px] flex flex-col items-center justify-center; }
.preview-image { @apply max-w-full max-h-[500px] object-contain; }
.preview-empty { @apply text-stone-400; }
.btn-download { @apply mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600; }
</style>
