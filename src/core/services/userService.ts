/**
 * 用户服务
 * 用户信息、配额、使用记录等
 */
import { supabase } from './supabase'
import type { Database } from '@core/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserQuota = Database['public']['Tables']['user_quotas']['Row']
type UsageRecord = Database['public']['Tables']['usage_records']['Insert']

export const userService = {
  /**
   * 获取用户 Profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('获取用户信息失败:', error)
      return null
    }

    return data
  },

  /**
   * 更新用户 Profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('更新用户信息失败:', error)
      return false
    }

    return true
  },

  /**
   * 获取用户配额
   */
  async getQuota(userId: string): Promise<UserQuota | null> {
    const { data, error } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('获取配额失败:', error)
      return null
    }

    // 检查是否需要重置
    const now = new Date()
    const dailyReset = new Date(data.daily_reset_at)
    const monthlyReset = new Date(data.monthly_reset_at)

    let needsUpdate = false
    const updates: Partial<UserQuota> = {}

    if (now >= dailyReset) {
      updates.daily_used = 0
      updates.daily_reset_at = getNextDayReset().toISOString()
      needsUpdate = true
    }

    if (now >= monthlyReset) {
      updates.monthly_used = 0
      updates.monthly_reset_at = getNextMonthReset().toISOString()
      needsUpdate = true
    }

    if (needsUpdate) {
      await supabase
        .from('user_quotas')
        .update(updates)
        .eq('user_id', userId)

      return { ...data, ...updates } as UserQuota
    }

    return data
  },

  /**
   * 扣减配额
   */
  async deductQuota(userId: string, amount: number = 1): Promise<boolean> {
    // 先获取当前配额
    const quota = await this.getQuota(userId)
    if (!quota) return false

    // 检查是否超限
    if (quota.daily_limit !== -1 && quota.daily_used + amount > quota.daily_limit) {
      return false
    }
    if (quota.monthly_limit !== -1 && quota.monthly_used + amount > quota.monthly_limit) {
      return false
    }

    // 扣减
    const { error } = await supabase
      .from('user_quotas')
      .update({
        daily_used: quota.daily_used + amount,
        monthly_used: quota.monthly_used + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    return !error
  },

  /**
   * 记录使用
   */
  async recordUsage(record: UsageRecord): Promise<boolean> {
    const { error } = await supabase.from('usage_records').insert(record)

    if (error) {
      console.error('记录使用失败:', error)
      return false
    }

    return true
  },

  /**
   * 获取使用记录
   */
  async getUsageRecords(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('usage_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('获取使用记录失败:', error)
      return []
    }

    return data
  },

  /**
   * 获取用户列表（管理员）
   */
  async getUsers(options: {
    page?: number
    pageSize?: number
    search?: string
    plan?: string
    role?: string
  } = {}) {
    const { page = 1, pageSize = 20, search, plan, role } = options

    let query = supabase
      .from('profiles')
      .select('*, user_quotas(*)', { count: 'exact' })

    if (search) {
      query = query.or(`username.ilike.%${search}%,id.ilike.%${search}%`)
    }

    if (plan && plan !== 'all') {
      query = query.eq('plan', plan)
    }

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) {
      console.error('获取用户列表失败:', error)
      return { users: [], total: 0 }
    }

    return { users: data || [], total: count || 0 }
  },

  /**
   * 更新用户角色/计划（管理员）
   */
  async updateUserByAdmin(userId: string, updates: { role?: string; plan?: string }): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('更新用户失败:', error)
      return false
    }

    // 如果更新了计划，同步更新配额
    if (updates.plan) {
      const quotaLimits: Record<string, { daily: number; monthly: number }> = {
        free: { daily: 10, monthly: 200 },
        basic: { daily: 50, monthly: 1000 },
        pro: { daily: 200, monthly: 5000 },
        enterprise: { daily: -1, monthly: -1 },
      }

      const limits = quotaLimits[updates.plan] || quotaLimits.free

      await supabase
        .from('user_quotas')
        .update({
          daily_limit: limits.daily,
          monthly_limit: limits.monthly,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    }

    return true
  },
}

// 辅助函数
function getNextDayReset(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
}

function getNextMonthReset(): Date {
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  nextMonth.setDate(1)
  nextMonth.setHours(0, 0, 0, 0)
  return nextMonth
}
