/**
 * 图像处理通用组合式API
 * 所有图像工具共享的核心逻辑
 */
import { ref, computed } from 'vue'
import type { ImageTask } from '@core/types'

export interface ProcessorOptions {
  maxConcurrent?: number
  maxFileSize?: number // bytes
  allowedFormats?: string[]
}

const DEFAULT_OPTIONS: ProcessorOptions = {
  maxConcurrent: 2,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'],
}

export function useImageProcessor(options: ProcessorOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  const tasks = ref<ImageTask[]>([])
  const processing = ref(false)

  const pendingCount = computed(() => tasks.value.filter(t => t.status === 'pending').length)
  const doneCount = computed(() => tasks.value.filter(t => t.status === 'done').length)
  const progress = computed(() => {
    if (tasks.value.length === 0) return 0
    const total = tasks.value.reduce((sum, t) => sum + t.progress, 0)
    return Math.round(total / tasks.value.length)
  })

  /** 添加文件到队列 */
  function addFiles(files: FileList | File[]) {
    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      // 校验格式
      if (!opts.allowedFormats!.includes(file.type)) {
        console.warn(`不支持的格式: ${file.type}`)
        continue
      }
      // 校验大小
      if (file.size > opts.maxFileSize!) {
        console.warn(`文件过大: ${file.name}`)
        continue
      }

      tasks.value.push({
        id: crypto.randomUUID(),
        file,
        status: 'pending',
        progress: 0,
      })
    }
  }

  /** 处理单个任务 */
  async function processTask(
    task: ImageTask,
    processor: (canvas: HTMLCanvasElement) => Promise<HTMLCanvasElement>
  ): Promise<void> {
    task.status = 'processing'
    task.progress = 10

    try {
      // 加载图像到Canvas
      const img = await loadImage(task.file)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      task.progress = 30

      // 执行处理
      const resultCanvas = await processor(canvas)
      task.progress = 80

      // 导出结果
      const blob = await canvasToBlob(resultCanvas, 'image/png')
      task.result = {
        blob,
        width: resultCanvas.width,
        height: resultCanvas.height,
        format: 'png',
      }
      task.status = 'done'
      task.progress = 100
    } catch (error) {
      task.status = 'error'
      task.error = error instanceof Error ? error.message : 'Processing failed'
    }
  }

  /** 批量处理 */
  async function processAll(
    processor: (canvas: HTMLCanvasElement) => Promise<HTMLCanvasElement>
  ): Promise<void> {
    processing.value = true
    const pending = tasks.value.filter(t => t.status === 'pending')

    // 并发控制
    const chunks = chunkArray(pending, opts.maxConcurrent!)
    for (const chunk of chunks) {
      await Promise.all(chunk.map(task => processTask(task, processor)))
    }

    processing.value = false
  }

  /** 清空任务 */
  function clearTasks() {
    tasks.value = []
  }

  /** 下载单个结果 */
  function downloadResult(task: ImageTask) {
    if (!task.result) return
    const url = URL.createObjectURL(task.result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `processed_${task.file.name}`
    a.click()
    URL.revokeObjectURL(url)
  }

  /** 打包下载所有结果 */
  async function downloadAllAsZip() {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    for (const task of tasks.value) {
      if (task.result) {
        zip.file(`processed_${task.file.name}`, task.result.blob)
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'processed_images.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    tasks,
    processing,
    pendingCount,
    doneCount,
    progress,
    addFiles,
    processTask,
    processAll,
    clearTasks,
    downloadResult,
    downloadAllAsZip,
  }
}

// 工具函数
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas to blob failed'))
    }, type)
  })
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}
