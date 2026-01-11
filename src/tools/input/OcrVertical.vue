<script setup lang="ts">
/**
 * 竖排OCR识别工具
 * 使用 Tesseract.js 识别古籍竖排文字
 */
import { ref, computed } from 'vue'
import { createWorker } from 'tesseract.js'
import FileDropzone from '@components/common/FileDropzone.vue'
import ProgressBar from '@components/common/ProgressBar.vue'
import RelatedTools from '@/components/common/RelatedTools.vue'

interface Task {
  id: string
  file: File
  previewUrl: string
  text: string
  status: 'pending' | 'processing' | 'done' | 'error'
  confidence: number
  error?: string
}

const tasks = ref<Task[]>([])
const selectedId = ref<string | null>(null)
const processing = ref(false)
const progress = ref(0)
const progressText = ref('')

// OCR 设置
const language = ref<'chi_tra' | 'chi_sim' | 'chi_tra_vert'>('chi_tra')
const pageSegMode = ref<number>(5) // PSM.SINGLE_BLOCK_VERT_TEXT

const currentTask = computed(() => tasks.value.find(t => t.id === selectedId.value))
const doneCount = computed(() => tasks.value.filter(t => t.status === 'done').length)

const languageOptions = [
  { value: 'chi_tra', label: '繁体中文' },
  { value: 'chi_sim', label: '简体中文' },
  { value: 'chi_tra_vert', label: '繁体竖排' },
]

const psmOptions = [
  { value: 5, label: '竖排文字块' },
  { value: 6, label: '横排文字块' },
  { value: 3, label: '自动检测' },
  { value: 4, label: '单列文字' },
]

function handleFiles(files: File[]) {
  for (const file of files) {
    const task: Task = {
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      text: '',
      status: 'pending',
      confidence: 0
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
  
  // 创建 Tesseract Worker
  progressText.value = '正在加载OCR引擎...'
  const worker = await createWorker(language.value, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        progress.value = Math.round(m.progress * 100)
      }
    }
  })

  // 设置页面分割模式
  await worker.setParameters({
    tessedit_pageseg_mode: pageSegMode.value,
  } as any)

  for (let i = 0; i < pending.length; i++) {
    progressText.value = `处理第 ${i + 1}/${pending.length} 张...`
    await processTask(pending[i], worker)
  }

  await worker.terminate()
  
  processing.value = false
  progressText.value = ''
}

async function processTask(task: Task, worker: Awaited<ReturnType<typeof createWorker>>) {
  task.status = 'processing'
  
  try {
    const result = await worker.recognize(task.file)
    
    task.text = result.data.text
    task.confidence = Math.round(result.data.confidence)
    task.status = 'done'
  } catch (e) {
    task.status = 'error'
    task.error = e instanceof Error ? e.message : 'OCR failed'
    console.error('OCR error:', e)
  }
}

function copyText(text: string) {
  navigator.clipboard.writeText(text)
}

function copyAllText() {
  const allText = tasks.value
    .filter(t => t.status === 'done')
    .map(t => t.text)
    .join('\n\n---\n\n')
  navigator.clipboard.writeText(allText)
}

function downloadText() {
  const allText = tasks.value
    .filter(t => t.status === 'done')
    .map((t, i) => `=== 第 ${i + 1} 页 ===\n\n${t.text}`)
    .join('\n\n')
  
  const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ocr_result.txt'
  a.click()
  URL.revokeObjectURL(url)
}

function clearAll() {
  tasks.value.forEach(t => URL.revokeObjectURL(t.previewUrl))
  tasks.value = []
  selectedId.value = null
}
</script>

<template>
  <div class="tool-page">
    <header class="tool-header">
      <h1 class="tool-title">竖排OCR识别</h1>
      <p class="tool-desc">识别古籍竖排文字，支持繁简体中文，基于 Tesseract.js</p>
    </header>

    <div class="tool-body">
      <!-- 左侧 -->
      <div class="tool-left">
        <FileDropzone
          accept="image/jpeg,image/png,image/webp,image/tiff"
          :max-size="20"
          @files="handleFiles"
        />

        <!-- OCR 设置 -->
        <div class="settings-panel">
          <h3 class="settings-title">OCR设置</h3>
          
          <div class="setting-row">
            <label class="setting-label">识别语言</label>
            <select v-model="language" class="setting-select">
              <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="setting-row">
            <label class="setting-label">版式模式</label>
            <select v-model="pageSegMode" class="setting-select">
              <option v-for="opt in psmOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 任务列表 -->
        <div v-if="tasks.length" class="task-list">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="task-item"
            :class="{ active: selectedId === task.id, done: task.status === 'done' }"
            @click="selectedId = task.id"
          >
            <img :src="task.previewUrl" class="task-thumb" />
            <div class="task-info">
              <span class="task-name">{{ task.file.name }}</span>
              <span v-if="task.status === 'done'" class="task-confidence">
                置信度: {{ task.confidence }}%
              </span>
            </div>
            <span class="task-status">
              <template v-if="task.status === 'pending'">待识别</template>
              <template v-else-if="task.status === 'processing'">识别中...</template>
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
            {{ processing ? '识别中...' : '开始识别' }}
          </button>
          <button
            class="btn-secondary"
            :disabled="doneCount === 0"
            @click="copyAllText"
          >
            复制全部
          </button>
          <button
            class="btn-secondary"
            :disabled="doneCount === 0"
            @click="downloadText"
          >
            导出TXT
          </button>
          <button
            class="btn-text"
            :disabled="!tasks.length"
            @click="clearAll"
          >
            清空
          </button>
        </div>

        <div v-if="processing" class="progress-section">
          <ProgressBar :value="progress" />
          <p class="progress-text">{{ progressText }}</p>
        </div>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="tool-right">
        <template v-if="currentTask">
          <div class="preview-section">
            <img :src="currentTask.previewUrl" class="preview-image" />
          </div>
          
          <div class="result-section">
            <div class="result-header">
              <h3>识别结果</h3>
              <button 
                v-if="currentTask.text"
                class="btn-copy"
                @click="copyText(currentTask.text)"
              >
                复制
              </button>
            </div>
            <textarea
              v-model="currentTask.text"
              class="result-textarea"
              :placeholder="currentTask.status === 'pending' ? '等待识别...' : '识别中...'"
              :readonly="currentTask.status === 'processing'"
            ></textarea>
          </div>
        </template>
        <div v-else class="preview-empty">
          <span>上传图片开始OCR识别</span>
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
.setting-row {
  @apply flex items-center gap-2 py-2;
}
.setting-label {
  @apply w-20 text-sm text-stone-600;
}
.setting-select {
  @apply flex-1 px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:border-amber-400 focus:outline-none;
}
.task-list {
  @apply bg-white rounded-lg border border-stone-200 divide-y divide-stone-100 max-h-64 overflow-auto;
}
.task-item {
  @apply flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-stone-50 transition-colors;
}
.task-item.active {
  @apply bg-amber-50;
}
.task-thumb {
  @apply w-10 h-14 object-cover rounded border border-stone-200;
}
.task-info {
  @apply flex-1 min-w-0;
}
.task-name {
  @apply block text-sm text-stone-700 truncate;
}
.task-confidence {
  @apply text-xs text-stone-400;
}
.task-status {
  @apply text-xs text-stone-500;
}
.task-item.done .task-status {
  @apply text-green-600;
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
.progress-section {
  @apply space-y-2;
}
.progress-text {
  @apply text-sm text-stone-500 text-center;
}
.tool-right {
  @apply space-y-4;
}
.preview-section {
  @apply bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-center max-h-[300px] overflow-hidden;
}
.preview-image {
  @apply max-w-full max-h-[280px] object-contain;
}
.preview-empty {
  @apply bg-white rounded-xl border border-stone-200 p-4 min-h-[400px] flex items-center justify-center text-stone-400;
}
.result-section {
  @apply bg-white rounded-xl border border-stone-200 p-4;
}
.result-header {
  @apply flex justify-between items-center mb-2;
}
.result-header h3 {
  @apply font-medium text-stone-800;
}
.btn-copy {
  @apply px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded transition-colors;
}
.result-textarea {
  @apply w-full h-48 px-3 py-2 border border-stone-200 rounded-lg text-sm font-guji
         focus:border-amber-400 focus:outline-none resize-none;
  writing-mode: vertical-rl;
}
</style>
