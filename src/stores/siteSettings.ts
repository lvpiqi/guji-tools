/**
 * 站点设置状态管理
 * 用于跨组件同步设置（如统计显示开关）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SETTINGS_KEY = 'guji_settings'
const STATS_KEY = 'guji_site_stats'

export const useSiteSettingsStore = defineStore('siteSettings', () => {
  // 设置状态
  const showUsageStats = ref(true)
  const totalUsageCount = ref(0)
  const initialized = ref(false)

  // 初始化
  function init() {
    if (initialized.value) return
    
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
      showUsageStats.value = settings.showUsageStats !== false
      
      const stats = JSON.parse(localStorage.getItem(STATS_KEY) || '{}')
      totalUsageCount.value = stats.totalUsage || 0
    } catch (e) {
      console.error('加载设置失败:', e)
    }
    
    initialized.value = true
  }

  // 更新统计显示设置
  function setShowUsageStats(show: boolean) {
    showUsageStats.value = show
    saveSettings()
  }

  // 更新统计数量
  function setTotalUsageCount(count: number) {
    totalUsageCount.value = count
    saveStats()
  }

  // 增加使用次数
  function incrementUsage(count: number = 1) {
    totalUsageCount.value += count
    saveStats()
  }

  // 保存设置到 localStorage
  function saveSettings() {
    try {
      const existing = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
      existing.showUsageStats = showUsageStats.value
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(existing))
    } catch (e) {
      console.error('保存设置失败:', e)
    }
  }

  // 保存统计到 localStorage
  function saveStats() {
    try {
      const stats = {
        totalUsage: totalUsageCount.value,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(STATS_KEY, JSON.stringify(stats))
    } catch (e) {
      console.error('保存统计失败:', e)
    }
  }

  return {
    showUsageStats,
    totalUsageCount,
    initialized,
    init,
    setShowUsageStats,
    setTotalUsageCount,
    incrementUsage,
  }
})
