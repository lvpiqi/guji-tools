/**
 * 工具策略服务
 * 管理工具访问权限配置
 */
import { supabase } from './supabase'
import type { Database } from '@core/types/database'

type ToolPolicy = Database['public']['Tables']['tool_policies']['Row']
type ToolPolicyInsert = Database['public']['Tables']['tool_policies']['Insert']
type ToolPolicyUpdate = Database['public']['Tables']['tool_policies']['Update']

// 本地缓存
let policiesCache: Record<string, ToolPolicy> = {}
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

export const toolPolicyService = {
  /**
   * 获取所有工具策略
   */
  async getAllPolicies(forceRefresh = false): Promise<Record<string, ToolPolicy>> {
    // 检查缓存
    if (!forceRefresh && Date.now() - cacheTime < CACHE_TTL && Object.keys(policiesCache).length > 0) {
      return policiesCache
    }

    const { data, error } = await supabase
      .from('tool_policies')
      .select('*')
      .order('category', { ascending: true })

    if (error) {
      console.error('获取工具策略失败:', error)
      return policiesCache // 返回缓存
    }

    // 更新缓存
    policiesCache = {}
    data?.forEach(policy => {
      policiesCache[policy.tool_id] = policy
    })
    cacheTime = Date.now()

    return policiesCache
  },

  /**
   * 获取单个工具策略
   */
  async getPolicy(toolId: string): Promise<ToolPolicy | null> {
    // 先查缓存
    if (policiesCache[toolId]) {
      return policiesCache[toolId]
    }

    const { data, error } = await supabase
      .from('tool_policies')
      .select('*')
      .eq('tool_id', toolId)
      .single()

    if (error) {
      console.error('获取工具策略失败:', error)
      return null
    }

    // 更新缓存
    if (data) {
      policiesCache[toolId] = data
    }

    return data
  },

  /**
   * 创建或更新工具策略
   */
  async upsertPolicy(policy: ToolPolicyInsert): Promise<boolean> {
    const { error } = await supabase
      .from('tool_policies')
      .upsert({
        ...policy,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tool_id',
      })

    if (error) {
      console.error('保存工具策略失败:', error)
      return false
    }

    // 清除缓存
    delete policiesCache[policy.tool_id]

    return true
  },

  /**
   * 更新工具策略
   */
  async updatePolicy(toolId: string, updates: ToolPolicyUpdate): Promise<boolean> {
    const { error } = await supabase
      .from('tool_policies')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('tool_id', toolId)

    if (error) {
      console.error('更新工具策略失败:', error)
      return false
    }

    // 清除缓存
    delete policiesCache[toolId]

    return true
  },

  /**
   * 批量更新工具策略
   */
  async batchUpdate(updates: Array<{ toolId: string; updates: ToolPolicyUpdate }>): Promise<boolean> {
    const promises = updates.map(({ toolId, updates: u }) =>
      supabase
        .from('tool_policies')
        .update({ ...u, updated_at: new Date().toISOString() })
        .eq('tool_id', toolId)
    )

    const results = await Promise.all(promises)
    const hasError = results.some(r => r.error)

    if (hasError) {
      console.error('批量更新失败')
      return false
    }

    // 清除缓存
    updates.forEach(({ toolId }) => delete policiesCache[toolId])

    return true
  },

  /**
   * 初始化工具策略（首次部署时使用）
   */
  async initializePolicies(tools: Array<{ id: string; name: string; category: string }>): Promise<boolean> {
    const policies: ToolPolicyInsert[] = tools.map(tool => ({
      tool_id: tool.id,
      tool_name: tool.name,
      category: tool.category,
      guest_allowed: true,
      guest_free_count: 3,
      login_required: false,
      min_plan: 'free',
      credit_cost: 1,
      enabled: true,
    }))

    const { error } = await supabase
      .from('tool_policies')
      .upsert(policies, { onConflict: 'tool_id' })

    if (error) {
      console.error('初始化工具策略失败:', error)
      return false
    }

    // 清除缓存
    policiesCache = {}

    return true
  },

  /**
   * 检查用户是否可以访问工具
   */
  canAccess(
    policy: ToolPolicy | null,
    userPlan: string,
    isGuest: boolean
  ): { allowed: boolean; reason?: string } {
    if (!policy) {
      return { allowed: true }
    }

    if (!policy.enabled) {
      return { allowed: false, reason: '该工具暂时不可用' }
    }

    if (isGuest && !policy.guest_allowed) {
      return { allowed: false, reason: '请登录后使用此工具' }
    }

    if (policy.login_required && isGuest) {
      return { allowed: false, reason: '此工具需要登录' }
    }

    // 检查计划等级
    const planOrder = ['free', 'basic', 'pro', 'enterprise']
    const userPlanIndex = planOrder.indexOf(userPlan)
    const minPlanIndex = planOrder.indexOf(policy.min_plan)

    if (userPlanIndex < minPlanIndex) {
      const planNames: Record<string, string> = {
        free: '免费版',
        basic: '基础版',
        pro: '专业版',
        enterprise: '企业版',
      }
      return { allowed: false, reason: `此工具需要${planNames[policy.min_plan]}或更高版本` }
    }

    return { allowed: true }
  },

  /**
   * 清除缓存
   */
  clearCache() {
    policiesCache = {}
    cacheTime = 0
  },
}
