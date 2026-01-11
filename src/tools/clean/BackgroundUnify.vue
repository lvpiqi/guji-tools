<script setup lang="ts">
/**
 * 背景统一/匀光工具
 * 纯 Canvas 实现，解决扫描光照不均问题
 */
import { ref, computed } from 'vue'
import FileDropzone from '@components/common/FileDropzone.vue'
import ImageCompare from '@components/common/ImageCompare.vue'
import ProgressBar from '@components/common/ProgressBar.vue'
import RelatedTools from '@/components/common/RelatedTools.vue'

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
const blockSize = ref(64) // 背景采样块大小
const strength = ref(0.8) // 匀光强度 0-1
const enhanceContrast = ref(true) // 增强对比度
const removeYellow = ref(true) // 去黄

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

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // 1. 估算背景（形态学开运算的简化版）
    const background = estimateBackground(data, canvas.width, canvas.height, blockSize.value)

    // 2. 匀光处理
    applyUniformLighting(data, background, canvas.width, canvas.height, strength.value)

    // 3. 去黄
    if (removeYellow.value) {
      removeYellowTint(data)
    }

    // 4. 增强对比度
    if (enhanceContrast.value) {
      enhanceImageContrast(data)
    }

    // 输出结果
    ctx.putImageData(imageData, 0, 0)
    
    const blob = await canvasToBlob(canvas)
    task.resultUrl = URL.createObjectURL(blob)
    task.status = 'done'
  } catch (e) {
    task.status = 'error'
    task.error = e instanceof Error ? e.message : 'Processing failed'
    console.error('BackgroundUnify error:', e)
  }
}

/**
 * 估算背景亮度（分块取最大值）
 */
function estimateBackground(
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  blockSize: number
): Float32Array {
  const background = new Float32Array(width * height)
  
  // 分块计算每块的最大亮度
  const blocksX = Math.ceil(width / blockSize)
  const blocksY = Math.ceil(height / blockSize)
  const blockMax = new Float32Array(blocksX * blocksY)

  // 计算每块最大亮度
  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      let max = 0
      const startX = bx * blockSize
      const startY = by * blockSize
      const endX = Math.min(startX + blockSize, width)
      const endY = Math.min(startY + blockSize, height)

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
          if (gray > max) max = gray
        }
      }
      blockMax[by * blocksX + bx] = max
    }
  }

  // 双线性插值到每个像素
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bx = x / blockSize
      const by = y / blockSize
      
      const bx0 = Math.floor(bx)
      const by0 = Math.floor(by)
      const bx1 = Math.min(bx0 + 1, blocksX - 1)
      const by1 = Math.min(by0 + 1, blocksY - 1)
      
      const fx = bx - bx0
      const fy = by - by0

      const v00 = blockMax[by0 * blocksX + bx0]
      const v10 = blockMax[by0 * blocksX + bx1]
      const v01 = blockMax[by1 * blocksX + bx0]
      const v11 = blockMax[by1 * blocksX + bx1]

      const v0 = v00 * (1 - fx) + v10 * fx
      const v1 = v01 * (1 - fx) + v11 * fx
      
      background[y * width + x] = v0 * (1 - fy) + v1 * fy
    }
  }

  return background
}

/**
 * 应用匀光
 */
function applyUniformLighting(
  data: Uint8ClampedArray,
  background: Float32Array,
  width: number,
  height: number,
  strength: number
) {
  // 计算目标背景亮度（取中位数）
  const sorted = Array.from(background).sort((a, b) => a - b)
  const targetBg = sorted[Math.floor(sorted.length * 0.9)] // 取90%分位数

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    const bg = background[i]
    
    if (bg > 10) { // 避免除以0
      // 计算校正因子
      const factor = 1 + (targetBg / bg - 1) * strength
      
      data[idx] = Math.min(255, Math.max(0, data[idx] * factor))
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] * factor))
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] * factor))
    }
  }
}

/**
 * 去除黄色色偏
 */
function removeYellowTint(data: Uint8ClampedArray) {
  // 统计平均色偏
  let totalR = 0, totalG = 0, totalB = 0, count = 0
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3
    // 只统计亮区（背景）
    if (gray > 200) {
      totalR += data[i]
      totalG += data[i + 1]
      totalB += data[i + 2]
      count++
    }
  }

  if (count === 0) return

  const avgR = totalR / count
  const avgG = totalG / count
  const avgB = totalB / count
  const avgGray = (avgR + avgG + avgB) / 3

  // 计算校正系数
  const rFactor = avgGray / avgR
  const gFactor = avgGray / avgG
  const bFactor = avgGray / avgB

  // 应用校正
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * rFactor)
    data[i + 1] = Math.min(255, data[i + 1] * gFactor)
    data[i + 2] = Math.min(255, data[i + 2] * bFactor)
  }
}

/**
 * 增强对比度（自动色阶）
 */
function enhanceImageContrast(data: Uint8ClampedArray) {
  // 统计直方图
  const histogram = new Array(256).fill(0)
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3)
    histogram[gray]++
  }

  // 找到1%和99%分位点
  const total = data.length / 4
  let cumulative = 0
  let low = 0, high = 255

  for (let i = 0; i < 256; i++) {
    cumulative += histogram[i]
    if (cumulative < total * 0.01) low = i
    if (cumulative < total * 0.99) high = i
  }

  if (high <= low) return

  // 拉伸对比度
  const scale = 255 / (high - low)
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, (data[i] - low) * scale))
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - low) * scale))
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - low) * scale))
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
  a.download = `unified_${task.file.name}`
  a.click()
}

async function downloadAll() {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  
  for (const task of tasks.value) {
    if (task.resultUrl) {
      const response = await fetch(task.resultUrl)
      const blob = await response.blob()
      zip.file(`unified_${task.file.name}`, blob)
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'unified_images.zip'
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
      <h1 class="tool-title">背景统一 / 匀光</h1>
      <p class="tool-desc">解决扫描光照不均、去除黄斑、增强对比度，纯浏览器处理无需上传</p>
    </header>

    <div class="tool-body">
      <!-- 左侧 -->
      <div class="tool-left">
        <FileDropzone
          accept="image/jpeg,image/png,image/webp"
          :max-size="50"
          @files="handleFiles"
        />

        <!-- 参数设置 -->
        <div class="settings-panel">
          <h3 class="settings-title">处理选项</h3>
          
          <div class="setting-item">
            <span>采样块大小</span>
            <input 
              type="range" 
              v-model.number="blockSize" 
              min="16" 
              max="128" 
              step="16"
              class="range-input"
            />
            <span class="range-value">{{ blockSize }}px</span>
          </div>

          <div class="setting-item">
            <span>匀光强度</span>
            <input 
              type="range" 
              v-model.number="strength" 
              min="0" 
              max="1" 
              step="0.1"
              class="range-input"
            />
            <span class="range-value">{{ (strength * 100).toFixed(0) }}%</span>
          </div>
          
          <label class="setting-item">
            <input type="checkbox" v-model="removeYellow" />
            <span>去除黄斑/色偏</span>
          </label>
          
          <label class="setting-item">
            <input type="checkbox" v-model="enhanceContrast" />
            <span>自动增强对比度</span>
          </label>
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
            {{ processing ? '处理中...' : '开始处理' }}
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
