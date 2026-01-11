/**
 * 认证服务
 * 封装 Supabase Auth 操作
 */
import { supabase } from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthResult {
  success: boolean
  user?: User | null
  session?: Session | null
  error?: string
}

export const authService = {
  /**
   * 邮箱密码注册
   */
  async signUp(email: string, password: string, username: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) {
        return { success: false, error: translateAuthError(error) }
      }

      // 创建用户 profile
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          role: 'user',
          plan: 'free',
        })

        // 初始化配额
        await supabase.from('user_quotas').insert({
          user_id: data.user.id,
          daily_limit: 10,
          monthly_limit: 200,
        })
      }

      return { success: true, user: data.user, session: data.session }
    } catch (e: any) {
      return { success: false, error: e.message || '注册失败' }
    }
  },

  /**
   * 邮箱密码登录
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: translateAuthError(error) }
      }

      return { success: true, user: data.user, session: data.session }
    } catch (e: any) {
      return { success: false, error: e.message || '登录失败' }
    }
  },

  /**
   * 登出
   */
  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return { success: false, error: translateAuthError(error) }
      }
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message || '登出失败' }
    }
  },

  /**
   * 获取当前会话
   */
  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  /**
   * 获取当前用户
   */
  async getUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser()
    return data.user
  },

  /**
   * 发送密码重置邮件
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { success: false, error: translateAuthError(error) }
      }

      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message || '发送失败' }
    }
  },

  /**
   * 更新密码
   */
  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { success: false, error: translateAuthError(error) }
      }

      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message || '更新失败' }
    }
  },

  /**
   * 监听认证状态变化
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  },

  /**
   * OAuth 登录（微信、GitHub 等）
   */
  async signInWithOAuth(provider: 'github' | 'google' | 'wechat'): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { success: false, error: translateAuthError(error) }
      }

      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message || '登录失败' }
    }
  },
}

/**
 * 翻译认证错误信息
 */
function translateAuthError(error: AuthError): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': '邮箱或密码错误',
    'Email not confirmed': '邮箱未验证，请查收验证邮件',
    'User already registered': '该邮箱已注册',
    'Password should be at least 6 characters': '密码至少6位',
    'Unable to validate email address: invalid format': '邮箱格式不正确',
    'Email rate limit exceeded': '请求过于频繁，请稍后再试',
    'For security purposes, you can only request this once every 60 seconds': '请60秒后再试',
  }

  return errorMap[error.message] || error.message || '操作失败'
}
