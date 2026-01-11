/**
 * 全站使用统计
 * 记录和获取工具使用总次数
 */
const STATS_KEY = 'guji_site_stats'

interface SiteStats {
  totalUsage: number
  lastUpdated: string
}

/**
 * 获取统计数据
 */
export function getUsageStats(): SiteStats {
  try {
    const data = localStorage.getItem(STATS_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('获取统计失败:', e)
  }
  return { totalUsage: 0, lastUpdated: new Date().toISOString() }
}

/**
 * 增加使用次数
 */
export function incrementUsage(count: number = 1) {
  try {
    const stats = getUsageStats()
    stats.totalUsage += count
    stats.lastUpdated = new Date().toISOString()
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (e) {
    console.error('更新统计失败:', e)
  }
}

/**
 * 设置使用次数（管理员用）
 */
export function setUsageStats(totalUsage: number) {
  try {
    const stats: SiteStats = {
      totalUsage,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (e) {
    console.error('设置统计失败:', e)
  }
}

/**
 * 重置统计
 */
export function resetUsageStats() {
  localStorage.removeItem(STATS_KEY)
}
