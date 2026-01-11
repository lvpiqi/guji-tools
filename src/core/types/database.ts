/**
 * Supabase 数据库类型定义
 * 根据实际数据库表结构生成
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // 用户扩展信息表
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          role: 'guest' | 'user' | 'vip' | 'pro' | 'admin'
          plan: 'free' | 'basic' | 'pro' | 'enterprise'
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          role?: 'guest' | 'user' | 'vip' | 'pro' | 'admin'
          plan?: 'free' | 'basic' | 'pro' | 'enterprise'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          role?: 'guest' | 'user' | 'vip' | 'pro' | 'admin'
          plan?: 'free' | 'basic' | 'pro' | 'enterprise'
          phone?: string | null
          updated_at?: string
        }
      }
      // 用户配额表
      user_quotas: {
        Row: {
          id: string
          user_id: string
          daily_limit: number
          daily_used: number
          daily_reset_at: string
          monthly_limit: number
          monthly_used: number
          monthly_reset_at: string
          total_credits: number
          used_credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          daily_limit?: number
          daily_used?: number
          daily_reset_at?: string
          monthly_limit?: number
          monthly_used?: number
          monthly_reset_at?: string
          total_credits?: number
          used_credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          daily_limit?: number
          daily_used?: number
          daily_reset_at?: string
          monthly_limit?: number
          monthly_used?: number
          monthly_reset_at?: string
          total_credits?: number
          used_credits?: number
          updated_at?: string
        }
      }
      // 工具策略表
      tool_policies: {
        Row: {
          id: string
          tool_id: string
          tool_name: string
          category: string
          guest_allowed: boolean
          guest_free_count: number
          login_required: boolean
          min_plan: 'free' | 'basic' | 'pro' | 'enterprise'
          credit_cost: number
          enabled: boolean
          daily_limit: number | null
          rate_limit: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          tool_name: string
          category: string
          guest_allowed?: boolean
          guest_free_count?: number
          login_required?: boolean
          min_plan?: 'free' | 'basic' | 'pro' | 'enterprise'
          credit_cost?: number
          enabled?: boolean
          daily_limit?: number | null
          rate_limit?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tool_name?: string
          category?: string
          guest_allowed?: boolean
          guest_free_count?: number
          login_required?: boolean
          min_plan?: 'free' | 'basic' | 'pro' | 'enterprise'
          credit_cost?: number
          enabled?: boolean
          daily_limit?: number | null
          rate_limit?: number | null
          updated_at?: string
        }
      }
      // 使用记录表
      usage_records: {
        Row: {
          id: string
          user_id: string | null
          guest_id: string | null
          tool_id: string
          tool_name: string
          credit_cost: number
          input_size: number | null
          output_size: number | null
          duration: number | null
          success: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_id?: string | null
          tool_id: string
          tool_name: string
          credit_cost?: number
          input_size?: number | null
          output_size?: number | null
          duration?: number | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: never
      }
      // 订阅表
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'free' | 'basic' | 'pro' | 'enterprise'
          status: 'active' | 'canceled' | 'expired' | 'past_due'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          payment_provider: string | null
          payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan?: 'free' | 'basic' | 'pro' | 'enterprise'
          status?: 'active' | 'canceled' | 'expired' | 'past_due'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          payment_provider?: string | null
          payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          plan?: 'free' | 'basic' | 'pro' | 'enterprise'
          status?: 'active' | 'canceled' | 'expired' | 'past_due'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          payment_provider?: string | null
          payment_id?: string | null
          updated_at?: string
        }
      }
      // 邀请码表
      invite_codes: {
        Row: {
          id: string
          code: string
          creator_id: string | null
          used_by: string | null
          bonus_credits: number
          expires_at: string | null
          created_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          code: string
          creator_id?: string | null
          used_by?: string | null
          bonus_credits?: number
          expires_at?: string | null
          created_at?: string
          used_at?: string | null
        }
        Update: {
          used_by?: string | null
          used_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // 扣减配额
      deduct_quota: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: boolean
      }
      // 重置每日配额
      reset_daily_quotas: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      user_role: 'guest' | 'user' | 'vip' | 'pro' | 'admin'
      plan_type: 'free' | 'basic' | 'pro' | 'enterprise'
      subscription_status: 'active' | 'canceled' | 'expired' | 'past_due'
    }
  }
}
