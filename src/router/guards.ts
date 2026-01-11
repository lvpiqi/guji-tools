/**
 * 路由守卫
 * 处理认证和权限检查
 */
import type { Router, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToolPolicyStore } from '@/stores/toolPolicy'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import { recordToolUsage } from '@/core/composables/useRecentTools'

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const toolPolicyStore = useToolPolicyStore()

    // 初始化 stores（如果还没初始化）
    if (!authStore.user && localStorage.getItem('guji_auth_token')) {
      authStore.init()
    }
    toolPolicyStore.init()

    // 检查是否需要管理员权限
    if (to.path.startsWith('/admin')) {
      if (!authStore.isAuthenticated) {
        return next({ path: '/auth/login', query: { redirect: to.fullPath } })
      }
      if (!authStore.isAdmin) {
        return next({ path: '/', query: { error: 'no-permission' } })
      }
    }

    // 检查是否需要登录
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return next({ path: '/auth/login', query: { redirect: to.fullPath } })
    }

    // 已登录用户访问登录/注册页面，重定向到首页
    if (authStore.isAuthenticated && to.path.startsWith('/auth/')) {
      return next('/')
    }

    // 检查工具访问权限
    if (to.meta.category) {
      const toolId = to.name as string
      const policy = toolPolicyStore.getPolicy(toolId)
      
      if (policy) {
        const { allowed, reason } = toolPolicyStore.canAccess(
          toolId,
          authStore.currentPlan,
          authStore.isGuest
        )
        
        if (!allowed) {
          // 如果是因为需要登录
          if (reason?.includes('登录')) {
            return next({ path: '/auth/login', query: { redirect: to.fullPath, reason: 'tool-access' } })
          }
          // 如果是因为计划不够
          if (reason?.includes('版本')) {
            return next({ path: '/pricing', query: { upgrade: 'true', tool: toolId } })
          }
          // 其他原因
          return next({ path: '/', query: { error: reason } })
        }
      }
    }

    next()
  })

  // 设置页面标题并记录工具使用
  router.afterEach((to) => {
    const title = to.meta.title as string
    document.title = title ? `${title} - \u53E4\u7C4D\u5DE5\u5177` : '\u53E4\u7C4D\u5DE5\u5177'
    
    // 记录工具使用（用于最近使用功能）
    recordToolUsage(to.path)
    
    // 增加全站使用统计（仅工具页面）
    const toolPaths = ['/input/', '/clean/', '/read/', '/search/', '/export/', '/pro/']
    if (toolPaths.some(p => to.path.startsWith(p)) && to.path.split('/').length >= 3) {
      const siteSettings = useSiteSettingsStore()
      siteSettings.init()
      siteSettings.incrementUsage()
    }
  })
}

/**
 * 工具使用前检查
 * 在工具组件中调用，检查配额并记录使用
 */
export function useToolAccess(toolId: string) {
  const authStore = useAuthStore()
  const toolPolicyStore = useToolPolicyStore()

  const policy = toolPolicyStore.getPolicy(toolId)
  const guestFreeCount = policy?.guestFreeCount ?? 3

  // 检查是否可以使用
  function checkAccess(): { allowed: boolean; reason?: string; remaining: number } {
    const { allowed, reason } = authStore.canUseTool(toolId, guestFreeCount)
    const remaining = authStore.getRemainingUsage(toolId, guestFreeCount)
    return { allowed, reason, remaining }
  }

  // 记录使用
  function recordUsage() {
    const creditCost = policy?.creditCost ?? 1
    authStore.recordToolUsage(toolId, creditCost)
  }

  // 获取剩余次数
  function getRemainingCount(): number {
    return authStore.getRemainingUsage(toolId, guestFreeCount)
  }

  // 是否显示登录提示
  function shouldShowLoginPrompt(): boolean {
    if (authStore.isAuthenticated) return false
    const remaining = getRemainingCount()
    return remaining <= 1 // 剩余1次或更少时提示
  }

  return {
    checkAccess,
    recordUsage,
    getRemainingCount,
    shouldShowLoginPrompt,
    isGuest: authStore.isGuest,
    isAuthenticated: authStore.isAuthenticated,
  }
}
