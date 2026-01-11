/**
 * 用户配额管理 - 统一使用 auth store 的配额系统
 * 
 * 游客：每个工具免费 3 次（存 localStorage）
 * 登录用户：按计划配额（free/basic/pro/enterprise）
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useQuota(toolId: string = 'default', toolName: string = '工具') {
  const authStore = useAuthStore()

  // 是否已登录
  const isLoggedIn = computed(() => authStore.isAuthenticated)
  
  // 是否是管理员（无限制）
  const isAdmin = computed(() => authStore.isAdmin)

  // 当前计划
  const currentPlan = computed(() => authStore.currentPlan)

  // 剩余次数
  const remaining = computed(() => authStore.getRemainingUsage(toolId))

  // 配额信息
  const quotaInfo = computed(() => {
    if (isAdmin.value) {
      return { daily: -1, monthly: -1, dailyUsed: 0, monthlyUsed: 0 }
    }
    
    if (authStore.quota) {
      return {
        daily: authStore.quota.daily_limit,
        monthly: authStore.quota.monthly_limit,
        dailyUsed: authStore.quota.daily_used,
        monthlyUsed: authStore.quota.monthly_used,
      }
    }
    
    // 游客
    const guestUsed = authStore.guestTracker?.toolUsage[toolId] || 0
    return {
      daily: 3,
      monthly: 3,
      dailyUsed: guestUsed,
      monthlyUsed: guestUsed,
    }
  })

  /**
   * 检查是否可以使用工具
   * @param guestFreeCount 游客免费次数，默认 3
   */
  function canPerform(guestFreeCount: number = 3): { allowed: boolean; reason?: string } {
    return authStore.canUseTool(toolId, guestFreeCount)
  }

  /**
   * 消耗配额（使用工具后调用）
   * @param creditCost 消耗的点数，默认 1
   */
  async function consume(creditCost: number = 1): Promise<boolean> {
    const check = canPerform()
    if (!check.allowed) return false
    
    await authStore.recordToolUsage(toolId, toolName, creditCost)
    return true
  }

  /**
   * 获取提示文案
   */
  const usageHint = computed(() => {
    if (isAdmin.value) return '管理员无限制'
    
    if (isLoggedIn.value) {
      const r = remaining.value
      if (r === -1) return '无限次数'
      return `今日剩余 ${r} 次`
    }
    
    // 游客
    const r = remaining.value
    if (r <= 0) return '免费次数已用完，请登录继续使用'
    return `免费试用剩余 ${r} 次`
  })

  return {
    isLoggedIn,
    isAdmin,
    currentPlan,
    remaining,
    quotaInfo,
    canPerform,
    consume,
    usageHint,
  }
}
