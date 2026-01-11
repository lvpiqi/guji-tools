/**
 * OpenCV.js 加载器和工具函数
 */
import { ref } from 'vue'

declare global {
  interface Window {
    cv: any
    Module: any
  }
}

const isLoaded = ref(false)
const isLoading = ref(false)
const loadError = ref<string | null>(null)

// 优先使用本地文件，备用 CDN
const OPENCV_URLS = [
  '/wasm/opencv.js', // 本地文件
  'https://docs.opencv.org/4.9.0/opencv.js',
]

const LOAD_TIMEOUT = 30000 // 30秒超时

/**
 * 加载 OpenCV.js
 */
export async function loadOpenCV(): Promise<typeof window.cv> {
  if (isLoaded.value && window.cv) {
    return window.cv
  }

  if (isLoading.value) {
    // 等待加载完成
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (isLoaded.value) {
          clearInterval(check)
          resolve(window.cv)
        }
        if (loadError.value) {
          clearInterval(check)
          reject(new Error(loadError.value))
        }
      }, 100)
    })
  }

  isLoading.value = true
  loadError.value = null

  // 尝试多个 CDN
  for (const url of OPENCV_URLS) {
    try {
      console.log('Trying to load OpenCV from:', url)
      await loadFromUrl(url)
      return window.cv
    } catch (e) {
      console.warn('Failed to load from', url, e)
    }
  }

  isLoading.value = false
  loadError.value = 'All CDN sources failed'
  throw new Error(loadError.value)
}

function loadFromUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 超时处理
    const timeout = setTimeout(() => {
      reject(new Error('Load timeout'))
    }, LOAD_TIMEOUT)

    const script = document.createElement('script')
    script.src = url
    script.async = true

    // OpenCV.js 使用 Module 回调
    window.Module = {
      onRuntimeInitialized: () => {
        clearTimeout(timeout)
        isLoaded.value = true
        isLoading.value = false
        console.log('OpenCV.js loaded successfully from', url)
        resolve()
      }
    }

    script.onerror = () => {
      clearTimeout(timeout)
      document.head.removeChild(script)
      reject(new Error('Script load error'))
    }

    document.head.appendChild(script)
  })
}

/**
 * OpenCV 加载状态
 */
export function useOpenCVStatus() {
  return { isLoaded, isLoading, loadError }
}

/**
 * Canvas 转 cv.Mat
 */
export function canvasToMat(canvas: HTMLCanvasElement): any {
  const cv = window.cv
  return cv.imread(canvas)
}

/**
 * cv.Mat 转 Canvas
 */
export function matToCanvas(mat: any, canvas: HTMLCanvasElement): void {
  const cv = window.cv
  cv.imshow(canvas, mat)
}

/**
 * 图像灰度化
 */
export function toGray(src: any): any {
  const cv = window.cv
  const gray = new cv.Mat()
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
  return gray
}

/**
 * 高斯模糊
 */
export function gaussianBlur(src: any, ksize = 5): any {
  const cv = window.cv
  const blurred = new cv.Mat()
  cv.GaussianBlur(src, blurred, new cv.Size(ksize, ksize), 0)
  return blurred
}

/**
 * 释放 Mat 内存
 */
export function releaseMats(...mats: any[]): void {
  mats.forEach(mat => {
    if (mat && !mat.isDeleted()) {
      mat.delete()
    }
  })
}
