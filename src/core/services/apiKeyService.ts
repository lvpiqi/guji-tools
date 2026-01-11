/**
 * API Key 服务
 * 统一管理 DeepSeek API Key 的获取
 */
import { ref } from 'vue'
import { supabase } from './supabase'

// 缓存的 API Key
let cachedApiKey: string | null = null
let isLoading = false
let loadPromise: Promise<string | null> | null = null

/**
 * 获取 DeepSeek API Key
 * 优先级: localStorage > 数据库
 */
export async function getApiKey(): Promise<string | null> {
  // 如果已缓存，直接返回
  if (cachedApiKey) return cachedApiKey
  
  // 如果正在加载，等待加载完成
  if (isLoading && loadPromise) {
    return loadPromise
  }
  
  isLoading = true
  loadPromise = loadApiKey()
  
  try {
    cachedApiKey = await loadPromise
    return cachedApiKey
  } finally {
    isLoading = false
    loadPromise = null
  }
}

async function loadApiKey(): Promise<string | null> {
  // 1. 先从 localStorage 获取
  const localKey = localStorage.getItem('deepseek_api_key')
  if (localKey && localKey.trim()) {
    return localKey.trim()
  }
  
  // 2. 从数据库获取
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'deepseek_api_key')
      .maybeSingle()
    
    if (!error && data?.value) {
      const key = data.value.trim()
      // 缓存到 localStorage
      localStorage.setItem('deepseek_api_key', key)
      return key
    }
  } catch (e) {
    console.log('Failed to load API key from DB:', e)
  }
  
  return null
}

/**
 * 清除缓存的 API Key
 */
export function clearApiKeyCache() {
  cachedApiKey = null
}

/**
 * 清理 API Key，移除非 ASCII 字符
 */
export function cleanApiKey(key: string): string {
  return key.trim().replace(/[^\x00-\x7F]/g, '')
}

/**
 * Vue composable for API Key
 */
export function useApiKey() {
  const apiKey = ref<string | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  
  async function load() {
    loading.value = true
    error.value = null
    
    try {
      apiKey.value = await getApiKey()
      if (!apiKey.value) {
        error.value = '系统未配置 AI 服务，请联系管理员'
      }
    } catch (e) {
      error.value = '加载 API 配置失败'
    } finally {
      loading.value = false
    }
  }
  
  load()
  
  return {
    apiKey,
    loading,
    error,
    reload: load
  }
}
