<script setup lang="ts">
/**
 * 自动纠偏裁边工具
 * SEO 优化版本 - 使用 Web Worker 运行 OpenCV
 */
import { ref, computed } from 'vue'
import FileDropzone from '@components/common/FileDropzone.vue'
import ImageCompare from '@components/common/ImageCompare.vue'
import ProgressBar from '@components/common/ProgressBar.vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'
import { 
  initOpenCVWorker, 
  deskewInWorker, 
  useOpenCVWorkerStatus 
} from '@core/wasm/opencv-worker-client'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  // 基础信息
  name: '自动纠偏裁边',
  path: '/input/deskew',
  category: '输入处理',
  categoryPath: '/input',
  
  // SEO Meta
  title: '自动纠偏裁边 - 古籍图片倾斜校正与白边裁切工具',
  description: '免费在线古籍图片自动纠偏裁边工具。基于OpenCV智能检测倾斜角度，自动矫正歪斜图片，裁切多余白边，支持批量处理，本地运行保护隐私。',
  keywords: ['自动纠偏', '图片裁边', '倾斜校正', '古籍扫描', '图像处理', 'OpenCV', '批量处理', '古籍数字化'],
  ogImage: '/og-images/default.png',
  
  // 时间信息
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  // 内容
  shortDesc: '智能检测并矫正古籍图片倾斜角度，自动裁切多余白边，基于 OpenCV 技术',
  
  features: [
    '智能检测图片倾斜角度并自动矫正',
    '自动识别并裁切多余白边',
    '支持手动微调旋转角度（±45°）',
    '基于 OpenCV.js 的专业图像处理',
    '支持批量处理多张图片',
    '本地浏览器运行，无需上传服务器',
    '支持 JPG、PNG、WebP、TIFF 格式',
    '处理前后对比预览，一键打包下载'
  ],
  
  howToUse: [
    '点击上传区域或拖拽古籍图片到上传框',
    '根据需要调整处理选项（自动纠偏、裁切白边、手动旋转）',
    '点击「开始处理」按钮，首次使用会自动加载 OpenCV',
    '在预览区查看处理前后的对比效果',
    '满意后点击「打包下载」保存所有处理结果'
  ],
  
  introduction: `在扫描或拍摄古籍、古书、线装书等文献时，由于放置角度或扫描仪的原因，图片经常会出现倾斜。同时，扫描件周围往往会有大量多余的白边，这些问题都会影响后续的阅读体验和 OCR 识别效果。

本工具采用 OpenCV.js 图像处理技术，能够智能检测图片的倾斜角度，并自动进行矫正。同时还能识别图片中的有效内容区域，自动裁切掉周围多余的白边，让古籍图片更加规整美观。

整个处理过程完全在您的浏览器本地完成，使用 Web Worker 技术在后台运行，不会阻塞页面操作。图片不会上传到任何服务器，充分保护您的隐私和文献安全。首次使用时需要加载 OpenCV 库（约5-10秒），之后处理速度会非常快。

处理完成后，您还可以使用「去手指阴影」工具去除拍摄时的手指痕迹，或使用「竖排OCR」进行文字识别，实现古籍的完整数字化流程。`,

  faq: [
    {
      question: '支持哪些图片格式？',
      answer: '支持 JPG/JPEG、PNG、WebP、TIFF 等常见图片格式。建议使用高清扫描件以获得最佳效果。'
    },
    {
      question: '首次加载为什么比较慢？',
      answer: '首次使用需要加载 OpenCV.js 库（约2MB），这个过程需要5-10秒。加载完成后会缓存到浏览器，后续使用会很快。'
    },
    {
      question: '自动检测倾斜角度准确吗？',
      answer: '对于文字行清晰的古籍图片，自动检测准确率很高。如果自动检测效果不理想，可以关闭自动检测，使用手动旋转功能微调角度。'
    },
    {
      question: '图片会上传到服务器吗？',
      answer: '不会。所有图像处理都在您的浏览器本地完成，使用 Web Worker 技术运行，图片不会上传到任何服务器。'
    },
    {
      question: '处理时页面会卡顿吗？',
      answer: '不会。我们使用 Web Worker 技术在后台线程处理图片，不会阻塞页面的正常操作。'
    },
    {
      question: '可以只裁边不纠偏吗？',
      answer: '可以。在处理选项中取消勾选「自动检测倾斜并矫正」，只保留「自动裁切白边」即可。'
    },
    {
      question: '手动旋转角度范围是多少？',
      answer: '手动旋转支持 -45° 到 +45° 的范围，精度为 0.5°，可以满足大多数微调需求。'
    }
  ],
  
  // 技术信息
  supportedFormats: ['JPG', 'PNG', 'WebP', 'TIFF'],
  maxFileSize: 50,
  isOffline: true,
  isFree: true
}

// OpenCV Worker 状态
const { isLoaded: cvLoaded, isLoading: cvLoading, loadError: cvError } = useOpenCVWorkerStatus()

interface Task {
  id: string
  file: File
  originalUrl: string
  resultUrl: string | null
  status: 'pending' | 'processing' | 'done' | 'error'
  error?: string
}

const tasks = ref<Task[]>([])
const selectedId = ref<string | null>(null)
const processing = ref(false)
const progress = ref(0)

// 参数设置
const autoDetect = ref(true)
const cropWhiteBorder = ref(true)
const rotateAngle = ref(0)

const currentTask = computed(() => tasks.value.find(t => t.id === selectedId.value))
const doneCount = computed(() => tasks.value.filter(t => t.status === 'done').length)

function handleFiles(files: File[]) {
  for (const file of files) {
    const task: Task = {
      id: crypto.randomUUID(),
      file,
      originalUrl: URL.createObjectURL(file),
      resultUrl: null,
      status: 'pending'
    }
    tasks.value.push(task)
    if (!selectedId.value) {
      selectedId.value = task.id
    }
  }
}

async function processAll() {
  processing.value = true
  progress.value = 0

  // 按需加载 OpenCV Worker
  if (!cvLoaded.value) {
    try {
      await initOpenCVWorker()
    } catch (e) {
      processing.value = false
      return
    }
  }

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
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const result = await deskewInWorker(imageData, {
      autoDetect: autoDetect.value,
      cropWhiteBorder: cropWhiteBorder.value,
      rotateAngle: rotateAngle.value
    })

    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = result.width
    outputCanvas.height = result.height
    const outputCtx = outputCanvas.getContext('2d')!
    const outputImageData = new ImageData(result.data, result.width, result.height)
    outputCtx.putImageData(outputImageData, 0, 0)
    
    const blob = await canvasToBlob(outputCanvas)
    task.resultUrl = URL.createObjectURL(blob)
    task.status = 'done'
  } catch (e) {
    task.status = 'error'
    task.error = e instanceof Error ? e.message : 'Processing failed'
    console.error('Deskew error:', e)
  }
}

async function retryLoad() {
  try {
    await initOpenCVWorker()
  } catch (e) {
    console.error('OpenCV retry failed:', e)
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
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas to blob failed'))
    }, 'image/png')
  })
}

function downloadResult(task: Task) {
  if (!task.resultUrl) return
  const a = document.createElement('a')
  a.href = task.resultUrl
  a.download = `deskew_${task.file.name}`
  a.click()
}

async function downloadAll() {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  
  for (const task of tasks.value) {
    if (task.resultUrl) {
      const response = await fetch(task.resultUrl)
      const blob = await response.blob()
      zip.file(`deskew_${task.file.name}`, blob)
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'deskew_images.zip'
  a.click()
  URL.revokeObjectURL(url)
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
    <!-- OpenCV 加载状态 -->
    <div v-if="cvLoading" class="status-banner loading">
      <span class="loading-spinner"></span>
      正在后台加载 OpenCV.js（首次约需5-10秒，页面不会卡顿）...
    </div>
    <div v-else-if="cvError" class="status-banner error">
      OpenCV 加载失败: {{ cvError }}
      <button @click="retryLoad" class="retry-btn">重试</button>
    </div>
    <div v-else-if="cvLoaded" class="status-banner success">
      ✓ OpenCV 已就绪
    </div>

    <!-- 工具主体 -->
    <div class="tool-body">
      <!-- 左侧：上传和设置 -->
      <div class="tool-upload">
        <FileDropzone
          accept="image/jpeg,image/png,image/webp,image/tiff"
          :max-size="50"
          @files="handleFiles"
        />

        <!-- 参数设置 -->
        <div class="settings-panel">
          <h3 class="settings-title">处理选项</h3>
          
          <label class="setting-item">
            <input type="checkbox" v-model="autoDetect" />
            <span>自动检测倾斜并矫正</span>
          </label>
          
          <label class="setting-item">
            <input type="checkbox" v-model="cropWhiteBorder" />
            <span>自动裁切白边</span>
          </label>
          
          <div class="setting-item">
            <span>手动旋转角度</span>
            <input 
              type="range" 
              v-model.number="rotateAngle" 
              min="-45" 
              max="45" 
              step="0.5"
              class="range-input"
            />
            <span class="range-value">{{ rotateAngle }}°</span>
          </div>
        </div>

        <!-- 任务列表 -->
        <div v-if="tasks.length" class="task-list">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="task-item"
            :class="{ active: selectedId === task.id, done: task.status === 'done', error: task.status === 'error' }"
            @click="selectedId = task.id"
          >
            <span class="task-name">{{ task.file.name }}</span>
            <span class="task-status">
              <template v-if="task.status === 'pending'">待处理</template>
              <template v-else-if="task.status === 'processing'">处理中...</template>
              <template v-else-if="task.status === 'done'">✓</template>
              <template v-else>✗</template>
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="tool-actions">
          <div class="actions-left">
            <button
              class="btn-primary"
              :disabled="!tasks.length || processing"
              @click="processAll"
            >
              {{ processing ? (cvLoading ? '加载OpenCV...' : '处理中...') : '开始处理' }}
            </button>
            <button
              class="btn-secondary"
              :disabled="doneCount === 0"
              @click="downloadAll"
            >
              打包下载 ({{ doneCount }})
            </button>
            <button
              class="btn-text"
              :disabled="!tasks.length"
              @click="clearAll"
            >
              清空
            </button>
          </div>
          <ToolFeedback tool-name="自动纠偏裁边" />
        </div>

        <ProgressBar v-if="processing" :value="progress" class="mt-4" />
      </div>

      <!-- 右侧：预览区 -->
      <div class="tool-preview">
        <template v-if="currentTask?.resultUrl">
          <ImageCompare
            :before="currentTask.originalUrl"
            :after="currentTask.resultUrl"
          />
          <button class="btn-download" @click="downloadResult(currentTask)">
            下载此图
          </button>
        </template>
        <template v-else-if="currentTask">
          <img :src="currentTask.originalUrl" class="preview-image" alt="古籍图片预览" />
        </template>
        <div v-else class="preview-empty">
          <span>上传图片开始处理</span>
        </div>
      </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.status-banner {
  @apply p-3 mb-4 rounded-lg text-sm;
}
.status-banner.loading {
  @apply flex items-center gap-2 bg-amber-50 text-amber-700;
}
.status-banner.error {
  @apply flex items-center gap-2 bg-red-50 text-red-700;
}
.status-banner.success {
  @apply bg-green-50 text-green-700;
}
.loading-spinner {
  @apply w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin;
}
.retry-btn {
  @apply ml-auto px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600;
}

.tool-body {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}
.tool-upload {
  @apply space-y-4;
}

.settings-panel {
  @apply bg-white rounded-lg border border-stone-200 p-4;
}
.settings-title {
  @apply font-medium text-stone-800 mb-3;
}
.setting-item {
  @apply flex items-center gap-2 py-2 text-sm text-stone-700;
}
.setting-item input[type="checkbox"] {
  @apply w-4 h-4 accent-amber-500;
}
.range-input {
  @apply flex-1 mx-2 accent-amber-500;
}
.range-value {
  @apply w-12 text-right text-stone-500;
}

.task-list {
  @apply bg-white rounded-lg border border-stone-200 divide-y divide-stone-100 max-h-48 overflow-auto;
}
.task-item {
  @apply flex justify-between items-center px-4 py-2 cursor-pointer hover:bg-stone-50 transition-colors;
}
.task-item.active {
  @apply bg-amber-50;
}
.task-item.done .task-status {
  @apply text-green-600;
}
.task-item.error .task-status {
  @apply text-red-600;
}
.task-name {
  @apply text-sm text-stone-700 truncate flex-1 mr-2;
}
.task-status {
  @apply text-xs text-stone-500;
}

.tool-actions {
  @apply flex items-center justify-between;
}
.actions-left {
  @apply flex gap-3;
}
.btn-primary {
  @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}
.btn-secondary {
  @apply px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}
.btn-text {
  @apply px-4 py-2 text-stone-500 hover:text-stone-700 disabled:opacity-50 transition-colors;
}

.tool-preview {
  @apply bg-white rounded-xl border border-stone-200 p-4 min-h-[400px] flex flex-col items-center justify-center;
}
.preview-image {
  @apply max-w-full max-h-[500px] object-contain;
}
.preview-empty {
  @apply text-stone-400;
}
.btn-download {
  @apply mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors;
}
</style>
