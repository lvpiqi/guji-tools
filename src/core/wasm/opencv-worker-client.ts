/**
 * OpenCV Worker 客户端
 * 在 Web Worker 中运行 OpenCV，避免阻塞主线程
 */
import { ref } from 'vue'

let worker: Worker | null = null
let messageId = 0
const pendingCallbacks = new Map<number, { resolve: Function; reject: Function }>()

export const isLoaded = ref(false)
export const isLoading = ref(false)
export const loadError = ref<string | null>(null)

/**
 * 初始化 OpenCV Worker
 */
export async function initOpenCVWorker(): Promise<void> {
  if (isLoaded.value) return
  if (isLoading.value) {
    // 等待加载完成
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (isLoaded.value) {
          clearInterval(check)
          resolve()
        }
        if (loadError.value) {
          clearInterval(check)
          reject(new Error(loadError.value || 'Unknown error'))
        }
      }, 100)
    })
  }

  isLoading.value = true
  loadError.value = null

  return new Promise((resolve, reject) => {
    worker = new Worker('/wasm/opencv-worker.js')
    
    worker.onmessage = (e) => {
      const { type, id, success, error, result } = e.data
      
      if (type === 'init') {
        if (success) {
          isLoaded.value = true
          isLoading.value = false
          resolve()
        } else {
          isLoading.value = false
          loadError.value = error || 'Failed to init OpenCV'
          reject(new Error(loadError.value || 'Init failed'))
        }
        return
      }
      
      // 处理其他消息
      const callback = pendingCallbacks.get(id)
      if (callback) {
        pendingCallbacks.delete(id)
        if (success) {
          callback.resolve(result)
        } else {
          callback.reject(new Error(error))
        }
      }
    }

    worker.onerror = (e) => {
      isLoading.value = false
      loadError.value = e.message || 'Worker error'
      reject(new Error(loadError.value || 'Worker error'))
    }

    // 发送初始化消息
    worker.postMessage({ type: 'init', id: messageId++ })
  })
}

/**
 * 在 Worker 中处理纠偏
 */
export async function deskewInWorker(
  imageData: ImageData,
  options: {
    autoDetect: boolean
    cropWhiteBorder: boolean
    rotateAngle: number
  }
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  if (!worker || !isLoaded.value) {
    throw new Error('OpenCV Worker not initialized')
  }

  const id = messageId++
  
  // 转换为普通数组以确保跨 Worker 传输正确
  const dataArray = Array.from(imageData.data)
  
  return new Promise((resolve, reject) => {
    pendingCallbacks.set(id, { 
      resolve: (result: any) => {
        resolve({
          data: new Uint8ClampedArray(result.data),
          width: result.width,
          height: result.height
        })
      }, 
      reject 
    })
    
    console.log('[Client] Sending to worker:', imageData.width, 'x', imageData.height, 'data length:', dataArray.length)
    
    // 发送图像数据到 Worker
    worker!.postMessage({
      type: 'deskew',
      id,
      data: {
        imageData: dataArray,
        width: imageData.width,
        height: imageData.height,
        options
      }
    })
  })
}

/**
 * 获取 Worker 状态
 */
export function useOpenCVWorkerStatus() {
  return { isLoaded, isLoading, loadError }
}

/**
 * 终止 Worker
 */
export function terminateWorker() {
  if (worker) {
    worker.terminate()
    worker = null
    isLoaded.value = false
  }
}
