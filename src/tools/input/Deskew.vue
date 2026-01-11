<script setup lang="ts">
/**
 * 自动纠偏裁边工具
 * 使用 Web Worker 运行 OpenCV，避免阻塞 UI
 */
import { ref, computed } from 'vue'
import FileDropzone from '@components/common/FileDropzone.vue'
import ImageCompare from '@components/common/ImageCompare.vue'
import ProgressBar from '@components/common/ProgressBar.vue'
import RelatedTools from '@/components/common/RelatedTools.vue'
import { 
  initOpenCVWorker, 
  deskewInWorker, 
  useOpenCVWorkerStatus 
} from '@core/wasm/opencv-worker-client'

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
    // 加载图像到 Canvas 获取 ImageData
    const img = await loadImage(task.file)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    console.log('Sending to worker:', imageData.width, 'x', imageData.height)

    // 在 Worker 中处理
    const result = await deskewInWorker(imageData, {
      autoDetect: autoDetect.value,
      cropWhiteBorder: cropWhiteBorder.value,
      rotateAngle: rotateAngle.value
    })

    console.log('Got result:', result.width, 'x', result.height)

    // 结果转回图像
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = result.width
    outputCanvas.height = result.height
    const outputCtx = outputCanvas.getContext('2d')!
    const outputImageData = new ImageData(result.data, result.width, result.height)
    outputCtx.putImageData(outputImageData, 0, 0)
    
    const blob = await canvasToBlob(outputCanvas)
    task.resultUrl = URL.createObjectURL(blob)
    task.status = 'done'
    
    console.log('Task done:', task.file.name)
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
  <div class="tool-page">
    <header class="tool-header">
      <h1 class="tool-title">自动纠偏裁边</h1>
      <p class="tool-desc">自动检测倾斜角度并矫正，裁切多余白边，基于 OpenCV.js (Web Worker)</p>
    </header>

    <!-- OpenCV 加载状态 -->
    <div v-if="cvLoading" class="loading-banner">
      <span class="loading-spinner"></span>
      正在后台加载 OpenCV.js（首次约需5-10秒，页面不会卡顿）...
    </div>
    <div v-else-if="cvError" class="error-banner">
      OpenCV 加载失败: {{ cvError }}
      <button @click="retryLoad" class="retry-btn">重试</button>
    </div>
    <div v-else-if="!cvLoaded" class="info-banner">
      💡 点击"开始处理"时将在后台加载 OpenCV（首次约需5-10秒）
    </div>
    <div v-else class="success-banner">
      ✓ OpenCV 已就绪
    </div>

    <div class="tool-body">
      <!-- 左侧：上传和设置 -->
      <div class="tool-left">
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
          <img :src="currentTask.originalUrl" class="preview-image" alt="预览" />
        </template>
        <div v-else class="preview-empty">
          <span>上传图片开始处理</span>
        </div>
      </div>
    </div>

    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page {
  @apply max-w-6xl mx-auto;
}
.tool-header {
  @apply mb-6;
}
.tool-title {
  @apply text-2xl font-bold text-stone-800;
}
.tool-desc {
  @apply text-stone-600 mt-1;
}
.info-banner {
  @apply p-3 mb-4 bg-blue-50 text-blue-700 rounded-lg text-sm;
}
.loading-banner {
  @apply flex items-center gap-2 p-3 mb-4 bg-amber-50 text-amber-700 rounded-lg;
}
.loading-spinner {
  @apply w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin;
}
.error-banner {
  @apply flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg;
}
.success-banner {
  @apply p-3 mb-4 bg-green-50 text-green-700 rounded-lg text-sm;
}
.retry-btn {
  @apply ml-auto px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600;
}
.tool-body {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}
.tool-left {
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
  @apply flex gap-3 flex-wrap;
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
