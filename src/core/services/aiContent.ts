/**
 * AI 内容生成服务
 * 使用 DeepSeek API 动态生成字形、释义、韵部等数据
 * 生成的内容会被缓存并创建独立页面供搜索引擎收录
 */

// DeepSeek API 配置
const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions'

// 本地存储键
const CACHE_PREFIX = 'guji_ai_'

export interface CharacterData {
  char: string
  // 异体字
  variants?: string[]
  // 释义
  definition?: {
    basic: string
    classical: string
    english?: string
  }
  // 字形演变
  evolution?: {
    oracle?: string      // 甲骨文描述
    bronze?: string      // 金文
    seal?: string        // 篆书
    clerical?: string    // 隶书
    regular?: string     // 楷书
    description: string  // 演变说明
  }
  // 韵部信息
  rhyme?: {
    pingshui: string     // 平水韵韵部
    tone: string         // 声调
    fanqie?: string      // 反切
    middleChinese?: string // 中古音
  }
  // 元数据
  generatedAt: number
  source: 'ai' | 'local'
}

/**
 * 获取字符数据（优先本地缓存，无则调用AI生成）
 */
export async function getCharacterData(
  char: string, 
  apiKey: string,
  fields: ('variants' | 'definition' | 'evolution' | 'rhyme')[] = ['variants', 'definition', 'evolution', 'rhyme']
): Promise<CharacterData> {
  // 1. 检查本地缓存
  const cached = getFromCache(char)
  if (cached && hasAllFields(cached, fields)) {
    return cached
  }

  // 2. 调用 AI 生成
  const generated = await generateWithAI(char, apiKey, fields)
  
  // 3. 合并并缓存
  const merged = { ...cached, ...generated, char, generatedAt: Date.now(), source: 'ai' as const }
  saveToCache(char, merged)
  
  return merged
}

/**
 * 调用 DeepSeek 生成内容
 */
async function generateWithAI(
  char: string, 
  apiKey: string,
  fields: string[]
): Promise<Partial<CharacterData>> {
  const prompt = buildPrompt(char, fields)
  
  const response = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的古汉语和文字学专家。请根据用户查询的汉字，提供准确的学术信息。
回复必须是有效的JSON格式，不要包含任何其他文字。`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  try {
    // 提取 JSON（处理可能的 markdown 代码块）
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('Failed to parse AI response:', content)
    throw new Error('AI 返回格式错误')
  }
}

/**
 * 构建 AI 提示词
 */
function buildPrompt(char: string, fields: string[]): string {
  const parts: string[] = [`请分析汉字「${char}」，返回JSON格式数据：\n{`]
  
  if (fields.includes('variants')) {
    parts.push(`  "variants": ["异体字1", "异体字2", ...],  // 该字的所有异体字、古字、俗字`)
  }
  
  if (fields.includes('definition')) {
    parts.push(`  "definition": {
    "basic": "基本释义（现代汉语）",
    "classical": "古义（文言文中的常见用法）",
    "english": "English meaning"
  },`)
  }
  
  if (fields.includes('evolution')) {
    parts.push(`  "evolution": {
    "oracle": "甲骨文字形描述（如有）",
    "bronze": "金文字形描述（如有）", 
    "seal": "篆书字形描述",
    "clerical": "隶书字形描述",
    "regular": "楷书字形描述",
    "description": "字形演变的整体说明，解释造字本义和演变过程"
  },`)
  }
  
  if (fields.includes('rhyme')) {
    parts.push(`  "rhyme": {
    "pingshui": "平水韵韵部（如：一东、二冬）",
    "tone": "声调（平/上/去/入）",
    "fanqie": "反切注音",
    "middleChinese": "中古音拟音"
  }`)
  }
  
  parts.push('}')
  
  return parts.join('\n')
}

/**
 * 本地缓存操作
 */
function getFromCache(char: string): CharacterData | null {
  try {
    const key = CACHE_PREFIX + encodeURIComponent(char)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

function saveToCache(char: string, data: CharacterData): void {
  try {
    const key = CACHE_PREFIX + encodeURIComponent(char)
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('Cache save failed:', e)
  }
}

function hasAllFields(data: CharacterData, fields: string[]): boolean {
  return fields.every(f => data[f as keyof CharacterData] !== undefined)
}

/**
 * 获取所有已缓存的字符（用于生成站点地图）
 */
export function getAllCachedCharacters(): string[] {
  const chars: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(CACHE_PREFIX)) {
      chars.push(decodeURIComponent(key.replace(CACHE_PREFIX, '')))
    }
  }
  return chars
}

/**
 * 导出所有缓存数据（用于备份或生成静态页面）
 */
export function exportAllData(): Record<string, CharacterData> {
  const result: Record<string, CharacterData> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(CACHE_PREFIX)) {
      const char = decodeURIComponent(key.replace(CACHE_PREFIX, ''))
      const data = localStorage.getItem(key)
      if (data) {
        result[char] = JSON.parse(data)
      }
    }
  }
  return result
}
