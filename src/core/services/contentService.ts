/**
 * \u5185\u5BB9\u670D\u52A1 - \u7BA1\u7406 AI \u751F\u6210\u7684\u6C49\u5B57\u8BE6\u60C5\u548C\u6458\u8981
 * \u4FDD\u5B58\u5230 Supabase \u6570\u636E\u5E93\uFF0C\u652F\u6301 SEO \u6536\u5F55
 */
import { supabase } from './supabase'

// =============================================
// \u7C7B\u578B\u5B9A\u4E49
// =============================================

export interface CharacterData {
  id?: string
  char: string
  variants?: string[]
  definition?: {
    basic: string
    classical: string
    english?: string
  }
  evolution?: {
    oracle?: string
    bronze?: string
    seal?: string
    clerical?: string
    regular?: string
    description: string
  }
  rhyme?: {
    pingshui: string
    tone: string
    fanqie?: string
    middleChinese?: string
  }
  source: 'ai' | 'local'
  view_count?: number
  created_at?: string
  updated_at?: string
}

export interface SummaryData {
  id?: string
  slug: string
  title?: string
  original_text: string
  summary: string
  translation?: string
  keywords?: string[]
  themes?: string[]
  analysis?: string
  user_id?: string
  is_public: boolean
  view_count?: number
  created_at?: string
  updated_at?: string
}

// \u6570\u636E\u5E93\u8868\u7C7B\u578B
interface CharacterRow {
  id: string
  char: string
  variants: string[] | null
  definition: CharacterData['definition'] | null
  evolution: CharacterData['evolution'] | null
  rhyme: CharacterData['rhyme'] | null
  source: string
  view_count: number
  created_at: string
  updated_at: string
}

interface SummaryRow {
  id: string
  slug: string
  title: string | null
  original_text: string
  summary: string
  translation: string | null
  keywords: string[] | null
  themes: string[] | null
  analysis: string | null
  user_id: string | null
  is_public: boolean
  view_count: number
  created_at: string
  updated_at: string
}

// =============================================
// \u6C49\u5B57\u8BE6\u60C5\u670D\u52A1
// =============================================

/**
 * \u4ECE\u6570\u636E\u5E93\u83B7\u53D6\u6C49\u5B57\u8BE6\u60C5
 */
export async function getCharacterFromDB(char: string): Promise<CharacterData | null> {
  try {
    const { data, error } = await supabase
      .from('character_data')
      .select('*')
      .eq('char', char)
      .single()

    if (error) {
      console.log('DB query error for char:', char, error.message)
      return null
    }
    
    if (!data) {
      console.log('No data found in DB for char:', char)
      return null
    }

    console.log('Found char in DB:', char)
    const row = data as CharacterRow

    // \u589E\u52A0\u6D4F\u89C8\u6B21\u6570
    // @ts-ignore - Supabase types not generated
    supabase
      .from('character_data')
      .update({ view_count: (row.view_count || 0) + 1 })
      .eq('char', char)
      .then(() => {})

    return {
      id: row.id,
      char: row.char,
      variants: row.variants || undefined,
      definition: row.definition || undefined,
      evolution: row.evolution || undefined,
      rhyme: row.rhyme || undefined,
      source: row.source as 'ai' | 'local',
      view_count: row.view_count,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (e) {
    console.error('getCharacterFromDB exception:', e)
    return null
  }
}

/**
 * \u4FDD\u5B58\u6C49\u5B57\u8BE6\u60C5\u5230\u6570\u636E\u5E93
 */
export async function saveCharacterToDB(data: CharacterData): Promise<boolean> {
  try {
    // @ts-ignore - Supabase types not generated
    const { error } = await supabase
      .from('character_data')
      .upsert({
        char: data.char,
        variants: data.variants || [],
        definition: data.definition || null,
        evolution: data.evolution || null,
        rhyme: data.rhyme || null,
        source: data.source,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'char'
      })

    if (error) {
      console.error('Save character error:', error)
      return false
    }

    return true
  } catch (e) {
    console.error('Save character exception:', e)
    return false
  }
}

/**
 * \u83B7\u53D6\u70ED\u95E8\u6C49\u5B57\u5217\u8868\uFF08\u7528\u4E8E\u9996\u9875\u5C55\u793A\u548C SEO\uFF09
 */
export async function getPopularCharacters(limit = 50): Promise<CharacterData[]> {
  const { data, error } = await supabase
    .from('character_data')
    .select('*')
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data as CharacterRow[] || []).map(row => ({
    id: row.id,
    char: row.char,
    variants: row.variants || undefined,
    definition: row.definition || undefined,
    evolution: row.evolution || undefined,
    rhyme: row.rhyme || undefined,
    source: row.source as 'ai' | 'local',
    view_count: row.view_count,
    created_at: row.created_at,
    updated_at: row.updated_at
  }))
}

/**
 * \u83B7\u53D6\u6700\u65B0\u6C49\u5B57\u5217\u8868
 */
export async function getRecentCharacters(limit = 20): Promise<CharacterData[]> {
  const { data, error } = await supabase
    .from('character_data')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data as CharacterRow[] || []).map(row => ({
    id: row.id,
    char: row.char,
    variants: row.variants || undefined,
    definition: row.definition || undefined,
    evolution: row.evolution || undefined,
    rhyme: row.rhyme || undefined,
    source: row.source as 'ai' | 'local',
    view_count: row.view_count,
    created_at: row.created_at,
    updated_at: row.updated_at
  }))
}

/**
 * \u83B7\u53D6\u6240\u6709\u6C49\u5B57\uFF08\u7528\u4E8E\u751F\u6210 sitemap\uFF09
 */
export async function getAllCharacters(): Promise<string[]> {
  const { data, error } = await supabase
    .from('character_data')
    .select('char')

  if (error) return []
  return (data as { char: string }[] || []).map(d => d.char)
}


// =============================================
// 摘要服务
// =============================================

/**
 * 生成 URL 友好的 slug
 */
function generateSlug(text: string): string {
  // 取前20个字符的拼音或直接用时间戳
  const timestamp = Date.now().toString(36)
  const prefix = text.slice(0, 10).replace(/[^\u4e00-\u9fff]/g, '')
  return `${prefix}-${timestamp}`
}

/**
 * \u4ECE\u6570\u636E\u5E93\u83B7\u53D6\u6458\u8981
 */
export async function getSummaryFromDB(slug: string): Promise<SummaryData | null> {
  const { data, error } = await supabase
    .from('summary_data')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  const row = data as SummaryRow

  // \u589E\u52A0\u6D4F\u89C8\u6B21\u6570
  // @ts-ignore - Supabase types not generated
  supabase
    .from('summary_data')
    .update({ view_count: (row.view_count || 0) + 1 })
    .eq('slug', slug)
    .then(() => {})

  return {
    id: row.id,
    slug: row.slug,
    title: row.title || undefined,
    original_text: row.original_text,
    summary: row.summary,
    translation: row.translation || undefined,
    keywords: row.keywords || undefined,
    themes: row.themes || undefined,
    analysis: row.analysis || undefined,
    user_id: row.user_id || undefined,
    is_public: row.is_public,
    view_count: row.view_count,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

/**
 * \u4FDD\u5B58\u6458\u8981\u5230\u6570\u636E\u5E93
 */
export async function saveSummaryToDB(data: Omit<SummaryData, 'slug'> & { slug?: string }): Promise<string | null> {
  const slug = data.slug || generateSlug(data.original_text)
  
  try {
    // @ts-ignore - Supabase types not generated
    const { error } = await supabase
      .from('summary_data')
      .upsert({
        slug,
        title: data.title || data.original_text.slice(0, 30) + '...',
        original_text: data.original_text,
        summary: data.summary,
        translation: data.translation || null,
        keywords: data.keywords || [],
        themes: data.themes || [],
        analysis: data.analysis || null,
        user_id: data.user_id || null,
        is_public: data.is_public ?? true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'slug'
      })

    if (error) {
      console.error('Save summary error:', error)
      return null
    }

    return slug
  } catch (e) {
    console.error('Save summary exception:', e)
    return null
  }
}

/**
 * \u83B7\u53D6\u7528\u6237\u7684\u6458\u8981\u5217\u8868
 */
export async function getUserSummaries(userId: string, limit = 20): Promise<SummaryData[]> {
  const { data, error } = await supabase
    .from('summary_data')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data as SummaryRow[] || []).map(rowToSummary)
}

/**
 * \u83B7\u53D6\u516C\u5F00\u7684\u70ED\u95E8\u6458\u8981
 */
export async function getPopularSummaries(limit = 20): Promise<SummaryData[]> {
  const { data, error } = await supabase
    .from('summary_data')
    .select('*')
    .eq('is_public', true)
    .order('view_count', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data as SummaryRow[] || []).map(rowToSummary)
}

/**
 * \u83B7\u53D6\u6700\u65B0\u516C\u5F00\u6458\u8981
 */
export async function getRecentSummaries(limit = 20): Promise<SummaryData[]> {
  const { data, error } = await supabase
    .from('summary_data')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data as SummaryRow[] || []).map(rowToSummary)
}

/**
 * \u83B7\u53D6\u6240\u6709\u516C\u5F00\u6458\u8981\u7684 slug\uFF08\u7528\u4E8E\u751F\u6210 sitemap\uFF09
 */
export async function getAllSummarySlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('summary_data')
    .select('slug')
    .eq('is_public', true)

  if (error) return []
  return (data as { slug: string }[] || []).map(d => d.slug)
}

// \u8F85\u52A9\u51FD\u6570\uFF1A\u5C06\u6570\u636E\u5E93\u884C\u8F6C\u6362\u4E3A SummaryData
function rowToSummary(row: SummaryRow): SummaryData {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title || undefined,
    original_text: row.original_text,
    summary: row.summary,
    translation: row.translation || undefined,
    keywords: row.keywords || undefined,
    themes: row.themes || undefined,
    analysis: row.analysis || undefined,
    user_id: row.user_id || undefined,
    is_public: row.is_public,
    view_count: row.view_count,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

/**
 * 删除摘要
 */
export async function deleteSummary(slug: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('summary_data')
    .delete()
    .eq('slug', slug)
    .eq('user_id', userId)

  return !error
}

// =============================================
// Sitemap 服务
// =============================================

/**
 * 获取动态 sitemap 条目
 */
export async function getSitemapEntries(): Promise<Array<{
  url: string
  type: string
  priority: number
  changefreq: string
  lastmod: string
}>> {
  const { data, error } = await supabase
    .from('sitemap_entries')
    .select('*')
    .order('lastmod', { ascending: false })

  if (error) return []
  return data || []
}

/**
 * 生成完整的 sitemap XML
 */
export async function generateSitemapXML(baseUrl: string): Promise<string> {
  const entries = await getSitemapEntries()
  
  const urls = entries.map(entry => `
  <url>
    <loc>${baseUrl}${entry.url}</loc>
    <lastmod>${new Date(entry.lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`
}
