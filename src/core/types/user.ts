/**
 * 用户系统类型定义
 * 可扩展的用户认证和权限架构
 */

// 用户角色
export type UserRole = 'guest' | 'user' | 'vip' | 'pro' | 'admin'

// 订阅计划类型
export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise'

// 用户基本信息
export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  role: UserRole
  plan: PlanType
  createdAt: number
  lastLoginAt: number
  // 扩展字段
  phone?: string
  verified: boolean
  metadata?: Record<string, unknown>
}

// 用户配额信息
export interface UserQuota {
  userId: string
  plan: PlanType
  // 每日配额
  dailyLimit: number
  dailyUsed: number
  dailyResetAt: number
  // 月度配额
  monthlyLimit: number
  monthlyUsed: number
  monthlyResetAt: number
  // 总配额（一次性购买）
  totalCredits: number
  usedCredits: number
}

// 工具访问策略
export interface ToolAccessPolicy {
  toolId: string
  toolName: string
  category: string
  // 访问控制
  guestAllowed: boolean        // 游客是否可用
  guestFreeCount: number       // 游客免费次数
  loginRequired: boolean       // 是否需要登录
  minPlan: PlanType           // 最低订阅计划
  // 配额消耗
  creditCost: number          // 每次消耗积分
  // 状态
  enabled: boolean
  // 自定义限制
  dailyLimit?: number         // 每日限制（覆盖计划默认值）
  rateLimit?: number          // 频率限制（每分钟）
}

// 订阅计划定义
export interface SubscriptionPlan {
  id: PlanType
  name: string
  description: string
  price: number               // 月价格（分）
  yearlyPrice?: number        // 年价格（分）
  features: string[]
  // 配额
  dailyQuota: number
  monthlyQuota: number
  // 工具访问
  allowedTools: string[] | 'all'
  // 优先级
  priority: number            // 用于排序
  recommended?: boolean
}

// 使用记录
export interface UsageRecord {
  id: string
  userId: string
  toolId: string
  toolName: string
  timestamp: number
  creditCost: number
  // 详情
  inputSize?: number
  outputSize?: number
  duration?: number
  success: boolean
  errorMessage?: string
}

// 登录凭证
export interface AuthCredentials {
  email: string
  password: string
  remember?: boolean
}

// 注册信息
export interface RegisterData {
  email: string
  username: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
  inviteCode?: string
}

// 认证状态
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  refreshToken: string | null
  expiresAt: number | null
  loading: boolean
  error: string | null
}

// 游客追踪
export interface GuestTracker {
  guestId: string
  toolUsage: Record<string, number>  // toolId -> 使用次数
  firstVisit: number
  lastVisit: number
  totalUsage: number
}

// API 响应
export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
  token?: string
  refreshToken?: string
  expiresIn?: number
}

// 默认订阅计划配置
export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: '免费版',
    description: '基础功能体验',
    price: 0,
    features: ['每日10次工具使用', '基础工具访问', '社区支持'],
    dailyQuota: 10,
    monthlyQuota: 200,
    allowedTools: 'all',
    priority: 0,
  },
  {
    id: 'basic',
    name: '基础版',
    description: '个人用户首选',
    price: 1900,
    yearlyPrice: 19000,
    features: ['每日50次工具使用', '全部工具访问', '优先处理', '邮件支持'],
    dailyQuota: 50,
    monthlyQuota: 1000,
    allowedTools: 'all',
    priority: 1,
    recommended: true,
  },
  {
    id: 'pro',
    name: '专业版',
    description: '专业研究者',
    price: 4900,
    yearlyPrice: 49000,
    features: ['每日200次工具使用', '全部工具访问', 'API访问', '批量处理', '专属支持'],
    dailyQuota: 200,
    monthlyQuota: 5000,
    allowedTools: 'all',
    priority: 2,
  },
  {
    id: 'enterprise',
    name: '企业版',
    description: '团队和机构',
    price: 0, // 联系销售
    features: ['无限使用', '私有部署', '定制开发', '专属客服', 'SLA保障'],
    dailyQuota: -1, // 无限
    monthlyQuota: -1,
    allowedTools: 'all',
    priority: 3,
  },
]

// 默认工具策略
export const DEFAULT_TOOL_POLICY: Omit<ToolAccessPolicy, 'toolId' | 'toolName' | 'category'> = {
  guestAllowed: true,
  guestFreeCount: 3,
  loginRequired: false,
  minPlan: 'free',
  creditCost: 1,
  enabled: true,
}
