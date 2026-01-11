/**
 * Supabase 客户端配置
 * 支持 Mock 模式用于本地开发
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@core/types/database'

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

// Mock Supabase 客户端
const createMockClient = () => {
  const mockData: Record<string, any[]> = {
    feedbacks: [],
    profiles: [],
    tool_policies: [],
  }

  const mockClient = {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: mockData[table] || [], error: null }),
      insert: (data: any) => {
        const newItem = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...data }
        if (!mockData[table]) mockData[table] = []
        mockData[table].push(newItem)
        console.log(`[Mock] Inserted into ${table}:`, newItem)
        return Promise.resolve({ data: newItem, error: null })
      },
      update: (data: any) => ({
        eq: (col: string, val: any) => {
          const item = mockData[table]?.find((i: any) => i[col] === val)
          if (item) Object.assign(item, data)
          return Promise.resolve({ data: item, error: null })
        }
      }),
      delete: () => ({
        eq: (col: string, val: any) => {
          if (mockData[table]) {
            mockData[table] = mockData[table].filter((i: any) => i[col] !== val)
          }
          return Promise.resolve({ data: null, error: null })
        }
      }),
      order: () => ({ data: mockData[table] || [], error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Mock 模式不支持登录' } }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Mock 模式不支持注册' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }

  return mockClient as unknown as SupabaseClient<Database>
}

// 创建客户端
let supabase: SupabaseClient<Database>

if (useMock || !supabaseUrl || !supabaseAnonKey) {
  console.log('🔧 使用 Mock Supabase 客户端（本地开发模式）')
  supabase = createMockClient()
} else {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

export { supabase }
export type { Database }
