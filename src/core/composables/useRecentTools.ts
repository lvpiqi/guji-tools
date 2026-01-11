/**
 * 最近使用工具的记录和获取
 */
const RECENT_KEY = 'guji_recent_tools'
const MAX_RECENT = 20

/**
 * 记录工具使用
 */
export function recordToolUsage(path: string) {
  // 只记录工具页面
  const toolPaths = ['/input/', '/clean/', '/read/', '/search/', '/export/', '/pro/']
  if (!toolPaths.some(p => path.startsWith(p))) return
  
  // 排除分类首页
  if (path.split('/').length < 3) return

  try {
    const recent = getRecentTools()
    // 移除已存在的，添加到最前面
    const filtered = recent.filter(p => p !== path)
    filtered.unshift(path)
    // 限制数量
    const limited = filtered.slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(limited))
  } catch (e) {
    console.error('记录最近使用失败:', e)
  }
}

/**
 * 获取最近使用的工具路径列表
 */
export function getRecentTools(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

/**
 * 清除最近使用记录
 */
export function clearRecentTools() {
  localStorage.removeItem(RECENT_KEY)
}
