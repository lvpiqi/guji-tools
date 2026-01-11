/**
 * 用户配额管理
 * 控制免费/付费功能限制
 */
import { ref, computed } from 'vue'
import type { UserQuota } from '@core/types'

const STORAGE_KEY = 'guji_quota'

// 免费用户限制
const FREE_LIMITS = {
  dailyProcessing: 20,    // 每日处理次数
  dailyOcr: 10,           // 每日OCR次数
  dailyExport: 5,         // 每日导出次数
  maxFileSize: 10,        // 单文件最大MB
  storageLimit: 100,      // 存储上限MB
}

// Pro用户限制
const PRO_LIMITS = {
  dailyProcessing: Infinity,
  dailyOcr: Infinity,
  dailyExport: Infinity,
  maxFileSize: 100,
  storageLimit: 10000,
}

export function useQuota() {
  const quota = ref<UserQuota>(loadQuota())

  const limits = computed(() => quota.value.isPro ? PRO_LIMITS : FREE_LIMITS)

  const dailyRemaining = computed(() => ({
    processing: Math.max(0, limits.value.dailyProcessing - quota.value.daily.used),
    ocr: Math.max(0, limits.value.dailyOcr - quota.value.daily.used),
    export: Math.max(0, limits.value.dailyExport - quota.value.daily.used),
  }))

  /** 检查是否可以执行操作 */
  function canPerform(type: 'processing' | 'ocr' | 'export', count = 1): boolean {
    if (quota.value.isPro) return true
    return dailyRemaining.value[type] >= count
  }

  /** 消耗配额 */
  function consume(type: 'processing' | 'ocr' | 'export', count = 1): boolean {
    if (!canPerform(type, count)) return false
    quota.value.daily.used += count
    saveQuota(quota.value)
    return true
  }

  /** 检查每日重置 */
  function checkDailyReset() {
    const lastReset = localStorage.getItem('guji_last_reset')
    const today = new Date().toDateString()
    
    if (lastReset !== today) {
      quota.value.daily.used = 0
      localStorage.setItem('guji_last_reset', today)
      saveQuota(quota.value)
    }
  }

  /** 升级到Pro */
  function upgradeToPro() {
    quota.value.isPro = true
    saveQuota(quota.value)
  }

  // 初始化时检查重置
  checkDailyReset()

  return {
    quota,
    limits,
    dailyRemaining,
    canPerform,
    consume,
    upgradeToPro,
  }
}

function loadQuota(): UserQuota {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  
  return {
    daily: { used: 0, limit: FREE_LIMITS.dailyProcessing },
    storage: { used: 0, limit: FREE_LIMITS.storageLimit },
    isPro: false,
  }
}

function saveQuota(quota: UserQuota) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quota))
}
