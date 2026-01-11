/**
 * WASM模块懒加载器
 * 按需加载，避免首屏加载过大
 */
import { ref, shallowRef } from 'vue'
import type { WasmModuleState } from '@core/types'

type WasmModuleName = 'opencv' | 'lama' | 'esrgan' | 'potrace' | 'pdflib'

interface WasmModule {
  init: () => Promise<void>
  [key: string]: unknown
}

const moduleCache = new Map<WasmModuleName, WasmModule>()
const moduleStates = new Map<WasmModuleName, WasmModuleState>()

/** 模块CDN路径配置 */
const MODULE_PATHS: Record<WasmModuleName, string> = {
  opencv: '/wasm/opencv.js',
  lama: '/wasm/lama-cleaner.js',
  esrgan: '/wasm/real-esrgan.js',
  potrace: '/wasm/potrace.js',
  pdflib: '/wasm/pdf-lib.js',
}

/**
 * 加载WASM模块
 */
export async function loadWasmModule(name: WasmModuleName): Promise<WasmModule> {
  // 已缓存直接返回
  if (moduleCache.has(name)) {
    return moduleCache.get(name)!
  }

  const state = getModuleState(name)
  state.loading = true
  state.progress = 0

  try {
    // 动态导入模块
    const module = await import(/* @vite-ignore */ MODULE_PATHS[name])
    
    // 初始化WASM
    if (module.init) {
      await module.init()
    }

    moduleCache.set(name, module)
    state.loaded = true
    state.progress = 100
    
    return module
  } catch (error) {
    state.error = error instanceof Error ? error.message : 'Unknown error'
    throw error
  } finally {
    state.loading = false
  }
}

/**
 * 获取模块状态（响应式）
 */
export function getModuleState(name: WasmModuleName): WasmModuleState {
  if (!moduleStates.has(name)) {
    moduleStates.set(name, {
      loaded: false,
      loading: false,
      progress: 0,
    })
  }
  return moduleStates.get(name)!
}

/**
 * 预加载模块（空闲时）
 */
export function preloadModule(name: WasmModuleName): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => loadWasmModule(name).catch(() => {}))
  }
}

/**
 * 组合式API：使用WASM模块
 */
export function useWasmModule(name: WasmModuleName) {
  const module = shallowRef<WasmModule | null>(null)
  const state = ref<WasmModuleState>(getModuleState(name))

  const load = async () => {
    module.value = await loadWasmModule(name)
    return module.value
  }

  return { module, state, load }
}
