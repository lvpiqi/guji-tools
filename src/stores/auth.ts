/**
 * 用户认证状态管理
 * 支持 Supabase 和本地 Mock 模式
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Database } from '@core/types/database'
import { DEFAULT_PLANS } from '@core/types/user'
import type { PlanType, GuestTracker } from '@core/types/user'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserQuota = Database['public']['Tables']['user_quotas']['Row']

// 是否使用 Mock 模式
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_SUPABASE_URL

// 存储键
const STORAGE_KEYS = {
  GUEST: 'guji_guest_tracker',
  MOCK_USER: 'guji_mock_user',
  MOCK_USERS: 'guji_mock_users',
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Mock 用户数据
interface MockUser {
  id: string
  email: string
  username: string
  password: string
  role: 'user' | 'admin'
  plan: PlanType
  createdAt: string
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const profile = ref<Profile | null>(null)
  const quota = ref<UserQuota | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const guestTracker = ref<GuestTracker | null>(null)
  const initialized = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!profile.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isGuest = computed(() => !isAuthenticated.value)
  const currentPlan = computed(() => (profile.value?.plan || 'free') as PlanType)
  
  const user = computed(() => {
    if (!profile.value) return null
    return {
      id: profile.value.id,
      email: (profile.value as any).email || '',
      username: profile.value.username,
      avatar: profile.value.avatar_url,
      role: profile.value.role,
      plan: profile.value.plan,
      createdAt: new Date(profile.value.created_at).getTime(),
      lastLoginAt: Date.now(),
      phone: profile.value.phone,
      verified: true,
    }
  })

  const planInfo = computed(() => {
    return DEFAULT_PLANS.find(p => p.id === currentPlan.value) || DEFAULT_PLANS[0]
  })

  // ==================== Mock 模式实现 ====================
  
  function getMockUsers(): MockUser[] {
    const saved = localStorage.getItem(STORAGE_KEYS.MOCK_USERS)
    let users: MockUser[] = saved ? JSON.parse(saved) : []
    
    // 确保默认管理员账号存在
    const adminExists = users.some(u => u.email === 'admin@test.com')
    if (!adminExists) {
      users.unshift({
        id: 'admin-001',
        email: 'admin@test.com',
        username: 'Admin',
        password: '123456',
        role: 'admin',
        plan: 'pro',
        createdAt: new Date().toISOString(),
      })
      localStorage.setItem(STORAGE_KEYS.MOCK_USERS, JSON.stringify(users))
    }
    
    return users
  }

  function saveMockUsers(users: MockUser[]) {
    localStorage.setItem(STORAGE_KEYS.MOCK_USERS, JSON.stringify(users))
  }

  async function mockLogin(emailOrUsername: string, password: string): Promise<boolean> {
    const users = getMockUsers()
    // 支持邮箱或用户名登录
    const user = users.find(u => 
      (u.email === emailOrUsername || u.username === emailOrUsername) && 
      u.password === password
    )
    
    if (!user) {
      error.value = '用户名/邮箱或密码错误'
      return false
    }

    // 设置 profile
    profile.value = {
      id: user.id,
      username: user.username,
      avatar_url: null,
      role: user.role,
      plan: user.plan,
      phone: null,
      created_at: user.createdAt,
      updated_at: new Date().toISOString(),
    } as Profile
    
    // 添加 email 到 profile（mock 专用）
    ;(profile.value as any).email = user.email

    // 设置配额
    const planLimits: Record<string, { daily: number; monthly: number }> = {
      free: { daily: 10, monthly: 200 },
      basic: { daily: 50, monthly: 1000 },
      pro: { daily: 200, monthly: 5000 },
      enterprise: { daily: -1, monthly: -1 },
    }
    const limits = planLimits[user.plan] || planLimits.free

    quota.value = {
      id: generateId(),
      user_id: user.id,
      daily_limit: limits.daily,
      daily_used: 0,
      daily_reset_at: new Date(Date.now() + 86400000).toISOString(),
      monthly_limit: limits.monthly,
      monthly_used: 0,
      monthly_reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      total_credits: 0,
      used_credits: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 保存登录状态
    localStorage.setItem(STORAGE_KEYS.MOCK_USER, JSON.stringify({ profile: profile.value, quota: quota.value }))

    return true
  }

  async function mockRegister(email: string, password: string, username: string): Promise<boolean> {
    const users = getMockUsers()
    
    if (users.find(u => u.email === email)) {
      error.value = '该邮箱已注册'
      return false
    }

    const newUser: MockUser = {
      id: generateId(),
      email,
      username,
      password,
      role: 'user',
      plan: 'free',
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    saveMockUsers(users)

    // 自动登录
    return mockLogin(email, password)
  }

  function mockLogout() {
    profile.value = null
    quota.value = null
    localStorage.removeItem(STORAGE_KEYS.MOCK_USER)
  }

  function restoreMockSession() {
    const saved = localStorage.getItem(STORAGE_KEYS.MOCK_USER)
    if (saved) {
      const { profile: p, quota: q } = JSON.parse(saved)
      profile.value = p
      quota.value = q
    }
  }

  // ==================== Supabase 模式实现 ====================

  async function supabaseLogin(emailOrUsername: string, password: string): Promise<boolean> {
    const { authService } = await import('@core/services/authService')
    
    // 判断是邮箱还是用户名
    let email = emailOrUsername
    if (!emailOrUsername.includes('@')) {
      // 是用户名，需要先查询对应的邮箱
      const { userService } = await import('@core/services/userService')
      const foundEmail = await userService.getEmailByUsername(emailOrUsername)
      if (!foundEmail) {
        error.value = '用户名不存在'
        return false
      }
      email = foundEmail
    }
    
    const result = await authService.signIn(email, password)
    
    if (!result.success) {
      error.value = result.error || '登录失败'
      return false
    }

    if (result.user) {
      await loadUserData(result.user.id)
    }

    return true
  }

  async function supabaseRegister(email: string, password: string, username: string): Promise<boolean> {
    const { authService } = await import('@core/services/authService')
    const result = await authService.signUp(email, password, username)
    
    if (!result.success) {
      error.value = result.error || '注册失败'
      return false
    }

    return true
  }

  async function supabaseLogout() {
    const { authService } = await import('@core/services/authService')
    await authService.signOut()
    profile.value = null
    quota.value = null
  }

  async function loadUserData(userId: string) {
    const { userService } = await import('@core/services/userService')
    const [profileData, quotaData] = await Promise.all([
      userService.getProfile(userId),
      userService.getQuota(userId),
    ])
    profile.value = profileData
    quota.value = quotaData
  }

  // ==================== 公共方法 ====================

  // 初始化
  async function init() {
    if (initialized.value) return

    loading.value = true

    try {
      if (USE_MOCK) {
        console.log('🔧 使用 Mock 模式')
        restoreMockSession()
      } else {
        const { authService } = await import('@core/services/authService')
        const session = await authService.getSession()
        
        if (session?.user) {
          await loadUserData(session.user.id)
        }

        // 监听认证状态变化
        authService.onAuthStateChange(async (_event, newSession) => {
          if (newSession?.user) {
            await loadUserData(newSession.user.id)
          } else {
            profile.value = null
            quota.value = null
          }
        })
      }

      // 初始化游客追踪
      initGuestTracker()
      initialized.value = true
    } catch (e) {
      console.error('初始化认证失败:', e)
    } finally {
      loading.value = false
    }
  }

  // 初始化游客追踪器
  function initGuestTracker() {
    const saved = localStorage.getItem(STORAGE_KEYS.GUEST)
    if (saved) {
      guestTracker.value = JSON.parse(saved)
    } else {
      guestTracker.value = {
        guestId: generateId(),
        toolUsage: {},
        firstVisit: Date.now(),
        lastVisit: Date.now(),
        totalUsage: 0,
      }
      saveGuestTracker()
    }
  }

  function saveGuestTracker() {
    if (guestTracker.value) {
      localStorage.setItem(STORAGE_KEYS.GUEST, JSON.stringify(guestTracker.value))
    }
  }

  // 登录（支持邮箱或用户名）
  async function login(emailOrUsername: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null

    const success = USE_MOCK 
      ? await mockLogin(emailOrUsername, password)
      : await supabaseLogin(emailOrUsername, password)

    loading.value = false
    return success
  }

  // 注册
  async function register(email: string, password: string, username: string): Promise<boolean> {
    loading.value = true
    error.value = null

    const success = USE_MOCK
      ? await mockRegister(email, password, username)
      : await supabaseRegister(email, password, username)

    loading.value = false
    return success
  }

  // 登出
  async function logout() {
    if (USE_MOCK) {
      mockLogout()
    } else {
      await supabaseLogout()
    }
  }

  // 发送密码重置邮件
  async function resetPassword(email: string): Promise<boolean> {
    if (USE_MOCK) {
      // Mock 模式直接返回成功
      return true
    }

    loading.value = true
    error.value = null

    const { authService } = await import('@core/services/authService')
    const result = await authService.resetPassword(email)

    loading.value = false

    if (!result.success) {
      error.value = result.error || '发送失败'
      return false
    }

    return true
  }

  // 检查工具是否可用
  function canUseTool(toolId: string, guestFreeCount: number = 3): { allowed: boolean; reason?: string } {
    if (isAdmin.value) {
      return { allowed: true }
    }

    if (isAuthenticated.value && quota.value) {
      if (quota.value.daily_limit !== -1 && quota.value.daily_used >= quota.value.daily_limit) {
        return { allowed: false, reason: '今日使用次数已达上限' }
      }
      if (quota.value.monthly_limit !== -1 && quota.value.monthly_used >= quota.value.monthly_limit) {
        return { allowed: false, reason: '本月使用次数已达上限' }
      }
      return { allowed: true }
    }

    if (guestTracker.value) {
      const used = guestTracker.value.toolUsage[toolId] || 0
      if (used >= guestFreeCount) {
        return { allowed: false, reason: `免费试用${guestFreeCount}次已用完，请登录继续使用` }
      }
      return { allowed: true }
    }

    return { allowed: true }
  }

  // 记录工具使用
  async function recordToolUsage(toolId: string, toolName: string, creditCost: number = 1) {
    if (isAuthenticated.value && quota.value) {
      // 扣减配额
      quota.value.daily_used += creditCost
      quota.value.monthly_used += creditCost

      if (USE_MOCK) {
        // 更新本地存储
        localStorage.setItem(STORAGE_KEYS.MOCK_USER, JSON.stringify({ profile: profile.value, quota: quota.value }))
      } else {
        const { userService } = await import('@core/services/userService')
        await userService.deductQuota(profile.value!.id, creditCost)
        await userService.recordUsage({
          user_id: profile.value!.id,
          tool_id: toolId,
          tool_name: toolName,
          credit_cost: creditCost,
          success: true,
        })
      }
    } else if (guestTracker.value) {
      guestTracker.value.toolUsage[toolId] = (guestTracker.value.toolUsage[toolId] || 0) + 1
      guestTracker.value.totalUsage += 1
      guestTracker.value.lastVisit = Date.now()
      saveGuestTracker()
    }
  }

  // 获取工具剩余次数
  function getRemainingUsage(toolId: string, guestFreeCount: number = 3): number {
    if (isAdmin.value) return -1

    if (isAuthenticated.value && quota.value) {
      if (quota.value.daily_limit === -1) return -1
      return Math.max(0, quota.value.daily_limit - quota.value.daily_used)
    }

    if (guestTracker.value) {
      const used = guestTracker.value.toolUsage[toolId] || 0
      return Math.max(0, guestFreeCount - used)
    }

    return guestFreeCount
  }

  // 更新用户信息
  async function updateProfile(updates: Partial<Profile>): Promise<boolean> {
    if (!profile.value) return false

    if (USE_MOCK) {
      profile.value = { ...profile.value, ...updates }
      localStorage.setItem(STORAGE_KEYS.MOCK_USER, JSON.stringify({ profile: profile.value, quota: quota.value }))
      return true
    }

    const { userService } = await import('@core/services/userService')
    const success = await userService.updateProfile(profile.value.id, updates)
    if (success) {
      profile.value = { ...profile.value, ...updates }
    }
    return success
  }

  return {
    // 状态
    user,
    profile,
    loading,
    error,
    quota,
    guestTracker,
    initialized,
    // 计算属性
    isAuthenticated,
    isAdmin,
    isGuest,
    currentPlan,
    planInfo,
    // 方法
    init,
    login,
    register,
    logout,
    resetPassword,
    canUseTool,
    recordToolUsage,
    getRemainingUsage,
    updateProfile,
  }
})
