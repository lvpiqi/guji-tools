// 通用类型定义

/** 工具分类 */
export type ToolCategory = 'input' | 'clean' | 'read' | 'search' | 'export' | 'pro'

/** 工具元信息 */
export interface ToolMeta {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: string
  tags: string[]
  isPro?: boolean
}

/** 图像处理任务 */
export interface ImageTask {
  id: string
  file: File
  status: 'pending' | 'processing' | 'done' | 'error'
  progress: number
  result?: ProcessedImage
  error?: string
}

/** 处理后的图像 */
export interface ProcessedImage {
  blob: Blob
  width: number
  height: number
  format: 'png' | 'webp' | 'jpeg'
  metadata?: Record<string, unknown>
}

/** OCR结果 */
export interface OcrResult {
  text: string
  confidence: number
  boxes: OcrBox[]
  language: 'zh-Hant' | 'zh-Hans'
}

export interface OcrBox {
  x: number
  y: number
  width: number
  height: number
  text: string
  confidence: number
}

/** 用户配额 */
export interface UserQuota {
  daily: { used: number; limit: number }
  storage: { used: number; limit: number }
  isPro: boolean
}

/** WASM模块状态 */
export interface WasmModuleState {
  loaded: boolean
  loading: boolean
  error?: string
  progress: number
}
