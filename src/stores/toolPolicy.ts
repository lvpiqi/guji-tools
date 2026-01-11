/**
 * 工具访问策略管理
 * 管理后台可配置每个工具的访问权限
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ToolAccessPolicy, PlanType } from '@core/types/user'
import { DEFAULT_TOOL_POLICY } from '@core/types/user'
import { toolRoutes } from '@/router'

const STORAGE_KEY = 'guji_tool_policies'

// 从路由提取所有工具
function extractToolsFromRoutes(): Array<{ id: string; name: string; category: string }> {
  const tools: Array<{ id: string; name: string; category: string }> = []
  
  toolRoutes.forEach(route => {
    if (route.children) {
      route.children.forEach(child => {
        if (child.name && child.meta?.title) {
          tools.push({
            id: child.name as string,
            name: child.meta.title as string,
            category: child.meta.category as string || route.name as string,
          })
        }
      })
    }
  })
  
  return tools
}

export const useToolPolicyStore = defineStore('toolPolicy', () => {
  // 所有工具策略
  const policies = ref<Record<string, ToolAccessPolicy>>({})
  
  // 初始化
  function init() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      policies.value = JSON.parse(saved)
    }
    
    // 确保所有工具都有策略
    const tools = extractToolsFromRoutes()
    tools.forEach(tool => {
      if (!policies.value[tool.id]) {
        policies.value[tool.id] = {
          toolId: tool.id,
          toolName: tool.name,
          category: tool.category,
          ...DEFAULT_TOOL_POLICY,
        }
      }
    })
    
    save()
  }
  
  // 保存
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policies.value))
  }
  
  // 获取工具策略
  function getPolicy(toolId: string): ToolAccessPolicy | null {
    return policies.value[toolId] || null
  }
  
  // 更新工具策略
  function updatePolicy(toolId: string, updates: Partial<ToolAccessPolicy>) {
    if (policies.value[toolId]) {
      policies.value[toolId] = { ...policies.value[toolId], ...updates }
      save()
    }
  }
  
  // 批量更新
  function batchUpdate(updates: Record<string, Partial<ToolAccessPolicy>>) {
    Object.entries(updates).forEach(([toolId, policy]) => {
      if (policies.value[toolId]) {
        policies.value[toolId] = { ...policies.value[toolId], ...policy }
      }
    })
    save()
  }
  
  // 重置为默认
  function resetToDefault(toolId?: string) {
    if (toolId && policies.value[toolId]) {
      const { toolId: id, toolName, category } = policies.value[toolId]
      policies.value[toolId] = {
        toolId: id,
        toolName,
        category,
        ...DEFAULT_TOOL_POLICY,
      }
    } else {
      // 重置所有
      Object.keys(policies.value).forEach(id => {
        const { toolId: tid, toolName, category } = policies.value[id]
        policies.value[id] = {
          toolId: tid,
          toolName,
          category,
          ...DEFAULT_TOOL_POLICY,
        }
      })
    }
    save()
  }
  
  // 按分类获取工具
  const toolsByCategory = computed(() => {
    const grouped: Record<string, ToolAccessPolicy[]> = {}
    Object.values(policies.value).forEach(policy => {
      if (!grouped[policy.category]) {
        grouped[policy.category] = []
      }
      grouped[policy.category].push(policy)
    })
    return grouped
  })
  
  // 获取所有工具列表
  const allTools = computed(() => Object.values(policies.value))
  
  // 检查用户是否可以访问工具
  function canAccess(toolId: string, userPlan: PlanType, isGuest: boolean): { allowed: boolean; reason?: string } {
    const policy = policies.value[toolId]
    if (!policy) return { allowed: true }
    
    if (!policy.enabled) {
      return { allowed: false, reason: '该工具暂时不可用' }
    }
    
    if (isGuest && !policy.guestAllowed) {
      return { allowed: false, reason: '请登录后使用此工具' }
    }
    
    if (policy.loginRequired && isGuest) {
      return { allowed: false, reason: '此工具需要登录' }
    }
    
    // 检查计划等级
    const planOrder: PlanType[] = ['free', 'basic', 'pro', 'enterprise']
    const userPlanIndex = planOrder.indexOf(userPlan)
    const minPlanIndex = planOrder.indexOf(policy.minPlan)
    
    if (userPlanIndex < minPlanIndex) {
      return { allowed: false, reason: `此工具需要${policy.minPlan}或更高版本` }
    }
    
    return { allowed: true }
  }
  
  // 导出配置
  function exportConfig(): string {
    return JSON.stringify(policies.value, null, 2)
  }
  
  // 导入配置
  function importConfig(json: string): boolean {
    try {
      const imported = JSON.parse(json)
      policies.value = { ...policies.value, ...imported }
      save()
      return true
    } catch {
      return false
    }
  }
  
  return {
    policies,
    toolsByCategory,
    allTools,
    init,
    getPolicy,
    updatePolicy,
    batchUpdate,
    resetToDefault,
    canAccess,
    exportConfig,
    importConfig,
  }
})
