/**
 * 从 Supabase 数据库导出数据用于 SEO 静态页面生成
 * 运行: node scripts/export-db-data.js
 * 
 * 需要设置环境变量:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量')
  process.exit(1)
}

async function fetchFromSupabase(table, select = '*', filters = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`
  
  // 添加过滤条件
  Object.entries(filters).forEach(([key, value]) => {
    url += `&${key}=eq.${value}`
  })
  
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  })
  
  if (!response.ok) {
    throw new Error(`Supabase API error: ${response.status}`)
  }
  
  return response.json()
}

async function exportData() {
  const dataDir = path.join(__dirname, '../data')
  fs.mkdirSync(dataDir, { recursive: true })
  
  console.log('📥 从数据库导出数据...\n')
  
  // 1. 导出汉字数据
  try {
    console.log('导出汉字数据...')
    const characters = await fetchFromSupabase('character_data', '*')
    fs.writeFileSync(
      path.join(dataDir, 'characters.json'),
      JSON.stringify(characters, null, 2)
    )
    console.log(`✓ 导出 ${characters.length} 个汉字`)
  } catch (e) {
    console.log('⚠️ 导出汉字数据失败:', e.message)
  }
  
  // 2. 导出公开摘要数据
  try {
    console.log('导出摘要数据...')
    const summaries = await fetchFromSupabase('summary_data', '*', { is_public: true })
    fs.writeFileSync(
      path.join(dataDir, 'summaries.json'),
      JSON.stringify(summaries, null, 2)
    )
    console.log(`✓ 导出 ${summaries.length} 个摘要`)
  } catch (e) {
    console.log('⚠️ 导出摘要数据失败:', e.message)
  }
  
  console.log('\n✅ 数据导出完成!')
  console.log(`数据保存在: ${dataDir}`)
}

exportData().catch(console.error)
