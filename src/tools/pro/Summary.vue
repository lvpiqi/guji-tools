<script setup lang="ts">
/**
 * \u81EA\u52A8\u6458\u8981\u5DE5\u5177
 * SEO \u4F18\u5316\u7248\u672C - \u4FDD\u5B58\u5230\u6570\u636E\u5E93
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'
import { useQuota } from '@core/composables/useQuota'
import { saveSummaryToDB, getUserSummaries, type SummaryData } from '@core/services/contentService'
import { useAuthStore } from '@/stores/auth'

// \u914D\u989D\u68C0\u67E5
const { canPerform, consume } = useQuota('summary', '\u81EA\u52A8\u6458\u8981')
const authStore = useAuthStore()

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '自动摘要',
  path: '/pro/summary',
  category: '专业工具',
  categoryPath: '/pro',
  
  description: '免费在线古文自动摘要工具。AI全面分析古文，生成摘要、翻译、关键词、主题分析和深度解读。',
  keywords: ['自动摘要', '古文分析', 'AI摘要', '关键词提取', '主题分析', '古文翻译'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: 'AI全面分析古文：摘要、翻译、关键词、深度解读',
  
  features: [
    '生成详细摘要',
    '提取核心关键词',
    '分析文章主题',
    '生成现代汉语翻译',
    '提供深度分析解读',
    '自动生成独立页面',
    '点击汉字查看释义',
    '支持历史记录查看'
  ],
  
  howToUse: [
    '配置DeepSeek API Key',
    '输入要分析的古文文本',
    '选择摘要详细程度',
    '点击「开始分析」',
    '查看摘要、翻译、分析等结果'
  ],
  
  introduction: `阅读古籍时，快速了解文章大意和核心观点非常重要。本工具使用AI对古文进行全面分析，生成摘要、翻译、关键词、主题分析和深度解读。

摘要可以选择不同的详细程度：适中（100-150字）、详细（200-300字）、全面（500字以上）。深度分析会从写作背景、作者意图、历史影响、文学价值等角度进行解读。

每次分析都会自动生成独立页面，方便分享和后续查阅。`,

  faq: [
    {
      question: '分析准确吗？',
      answer: 'AI分析仅供参考，重要研究请以专业文献为准。'
    },
    {
      question: '可以分析多长的文本？',
      answer: '建议单次分析不超过2000字，过长的文本可能影响分析质量。'
    },
    {
      question: '独立页面有什么用？',
      answer: '独立页面方便分享和后续查阅，也有利于搜索引擎收录。'
    },
    {
      question: '历史记录保存在哪里？',
      answer: '保存在浏览器本地存储中，清除浏览器数据会丢失。'
    },
    {
      question: 'API Key如何获取？',
      answer: '访问 platform.deepseek.com 注册账号即可获取API Key。'
    }
  ],
  
  isOffline: false,
  isFree: true
}

const router = useRouter()
const inputText = ref('')
const summary = ref('')
const keywords = ref<string[]>([])
const themes = ref<string[]>([])
const translation = ref('')
const analysis = ref('')
const processing = ref(false)
const summaryLength = ref<'medium' | 'long' | 'full'>('long')
const includeTranslation = ref(true)
const includeAnalysis = ref(true)
const apiKey = ref(localStorage.getItem('deepseek_api_key') || '')
const savedSummaryId = ref('')
const historyList = ref<Array<{id: string, text: string, date: string}>>([])
const dbHistoryList = ref<SummaryData[]>([])

const lengthMap: Record<string, string> = { 
  medium: '100-150\u5B57', 
  long: '200-300\u5B57', 
  full: '500\u5B57\u4EE5\u4E0A\uFF0C\u5168\u9762\u8BE6\u7EC6' 
}

// \u52A0\u8F7D\u5386\u53F2\u8BB0\u5F55
async function loadHistory() {
  // \u4ECE\u6570\u636E\u5E93\u52A0\u8F7D
  if (authStore.user?.id) {
    try {
      dbHistoryList.value = await getUserSummaries(authStore.user.id, 10)
    } catch {}
  }
  
  // \u4ECE localStorage \u52A0\u8F7D\uFF08\u517C\u5BB9\u65E7\u6570\u636E\uFF09
  const list: Array<{id: string, text: string, date: string}> = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('guji_summary_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        if (data.id) list.push({ id: data.id, text: data.originalText?.slice(0, 20) + '...', date: data.createdAt })
      } catch {}
    }
  }
  historyList.value = list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
}
loadHistory()

async function doSummarize() {
  if (!inputText.value.trim() || !apiKey.value) return
  
  // 配额检查
  const check = canPerform()
  if (!check.allowed) {
    alert(check.reason || '使用次数已达上限')
    return
  }
  
  // 检查是否已有相同原文的摘要，直接复用
  const existingId = findExistingSummary(inputText.value)
  if (existingId) {
    const existing = JSON.parse(localStorage.getItem(`guji_summary_${existingId}`) || '{}')
    summary.value = existing.summary || ''
    keywords.value = existing.keywords || []
    themes.value = existing.themes || []
    translation.value = existing.translation || ''
    analysis.value = existing.analysis || ''
    savedSummaryId.value = existingId
    alert('\u5DF2\u627E\u5230\u76F8\u540C\u5185\u5BB9\u7684\u6458\u8981\uFF0C\u76F4\u63A5\u8C03\u7528')
    return
  }
  
  processing.value = true
  summary.value = ''
  keywords.value = []
  themes.value = []
  translation.value = ''
  analysis.value = ''
  savedSummaryId.value = ''
  
  try {
    const prompt = `\u8BF7\u5168\u9762\u5206\u6790\u4EE5\u4E0B\u53E4\u6587\uFF0C\u8FD4\u56DEJSON\u683C\u5F0F\uFF1A

"${inputText.value}"

\u8981\u6C42\uFF1A
1. summary: \u6458\u8981\uFF08${lengthMap[summaryLength.value]}\uFF09\uFF0C\u5168\u9762\u6982\u62EC\u4E3B\u65E8\u3001\u8BBA\u70B9\u3001\u80CC\u666F
2. keywords: \u63D0\u53D6\u6838\u5FC3\u5173\u952E\u8BCD\uFF085-10\u4E2A\uFF09
3. themes: \u4E3B\u9898\u5206\u6790\uFF08\u54F2\u5B66\u3001\u5386\u53F2\u3001\u6587\u5B66\u7B49\u89D2\u5EA6\uFF09
${includeTranslation.value ? '4. translation: \u73B0\u4EE3\u6C49\u8BED\u7FFB\u8BD1\uFF08\u901A\u987A\u6613\u61C2\uFF09' : ''}
${includeAnalysis.value ? '5. analysis: \u6DF1\u5EA6\u5206\u6790\uFF08\u5305\u62EC\u5199\u4F5C\u80CC\u666F\u3001\u4F5C\u8005\u610F\u56FE\u3001\u5386\u53F2\u5F71\u54CD\u3001\u6587\u5B66\u4EF7\u503C\u7B49\uFF09' : ''}

\u8FD4\u56DE\u683C\u5F0F\uFF1A
{
  "summary": "\u8BE6\u7EC6\u6458\u8981...",
  "keywords": ["\u5173\u952E\u8BCD1", "\u5173\u952E\u8BCD2", ...],
  "themes": ["\u4E3B\u98981: \u8BF4\u660E", "\u4E3B\u98982: \u8BF4\u660E", ...],
  "translation": "\u73B0\u4EE3\u6C49\u8BED\u7FFB\u8BD1...",
  "analysis": "\u6DF1\u5EA6\u5206\u6790..."
}

\u53EA\u8F93\u51FAJSON\uFF0C\u4E0D\u8981\u5176\u4ED6\u5185\u5BB9\u3002`

    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey.value}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '\u4F60\u662F\u53E4\u6587\u5206\u6790\u4E13\u5BB6\u3002\u8FD4\u56DEJSON\u683C\u5F0F\uFF0C\u5185\u5BB9\u8981\u5168\u9762\u8BE6\u7EC6\u3002' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    })
    const data = await resp.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    const result = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())
    
    summary.value = result.summary || ''
    keywords.value = result.keywords || []
    themes.value = result.themes || []
    translation.value = result.translation || ''
    analysis.value = result.analysis || ''
    
    // 保存到 localStorage 并生成独立页面
    saveSummary()
  } catch (e) { 
    console.error(e)
    alert('\u5206\u6790\u5931\u8D25') 
  }
  finally { processing.value = false }
}

// \u751F\u6210 SEO \u53CB\u597D\u7684 slug\uFF1A\u7EAF\u4E2D\u6587\uFF0C\u53D6\u539F\u6587\u524D10\u4E2A\u6C49\u5B57
function generateSlug(text: string): string {
  const chars = text.replace(/[^\u4e00-\u9fff]/g, '').slice(0, 10)
  return chars || String(Date.now())
}

// \u68C0\u67E5\u662F\u5426\u5DF2\u6709\u76F8\u540C\u539F\u6587\u7684\u6458\u8981
function findExistingSummary(text: string): string | null {
  const normalizedText = text.replace(/\s+/g, '')
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('guji_summary_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        if (data.originalText?.replace(/\s+/g, '') === normalizedText) {
          return data.id
        }
      } catch {}
    }
  }
  return null
}

async function saveSummary() {
  const slug = generateSlug(inputText.value)
  // \u68C0\u67E5 slug \u662F\u5426\u5DF2\u5B58\u5728\uFF0C\u5B58\u5728\u5219\u52A0\u6570\u5B57
  let finalSlug = slug
  let counter = 1
  while (localStorage.getItem(`guji_summary_${finalSlug}`)) {
    finalSlug = `${slug}${counter}`
    counter++
  }
  
  const data = {
    id: finalSlug,
    originalText: inputText.value,
    summary: summary.value,
    keywords: keywords.value,
    themes: themes.value,
    translation: translation.value,
    analysis: analysis.value,
    createdAt: new Date().toLocaleString('zh-CN')
  }
  
  // \u4FDD\u5B58\u5230 localStorage
  localStorage.setItem(`guji_summary_${finalSlug}`, JSON.stringify(data))
  
  // \u4FDD\u5B58\u5230\u6570\u636E\u5E93\uFF08\u5F02\u6B65\uFF09
  saveSummaryToDB({
    slug: finalSlug,
    title: inputText.value.slice(0, 30),
    original_text: inputText.value,
    summary: summary.value,
    translation: translation.value,
    keywords: keywords.value,
    themes: themes.value,
    analysis: analysis.value,
    user_id: authStore.user?.id,
    is_public: true
  }).then(dbSlug => {
    if (dbSlug) {
      console.log('Summary saved to DB:', dbSlug)
    }
  }).catch(e => {
    console.warn('Failed to save to DB:', e)
  })
  
  savedSummaryId.value = finalSlug
  loadHistory()
}

function saveApiKey() { localStorage.setItem('deepseek_api_key', apiKey.value); doSummarize() }
function goToChar(c: string) { if (/[\u4e00-\u9fff]/.test(c)) router.push(`/char/${encodeURIComponent(c)}`) }
function goToSummaryPage() { if (savedSummaryId.value) router.push(`/summary/${savedSummaryId.value}`) }
function goToHistory(id: string) { router.push(`/summary/${id}`) }

function copyAll() {
  let t = `\u539F\u6587\uFF1A${inputText.value}\n\n\u6458\u8981\uFF1A${summary.value}\n`
  if (keywords.value.length) t += `\n\u5173\u952E\u8BCD\uFF1A${keywords.value.join('\u3001')}`
  if (themes.value.length) t += `\n\u4E3B\u9898\uFF1A${themes.value.join('\u3001')}`
  if (translation.value) t += `\n\n\u7FFB\u8BD1\uFF1A${translation.value}`
  if (analysis.value) t += `\n\n\u5206\u6790\uFF1A${analysis.value}`
  navigator.clipboard.writeText(t)
  alert('\u5DF2\u590D\u5236')
}

function clear() { 
  inputText.value = ''; summary.value = ''; keywords.value = []; themes.value = []
  translation.value = ''; analysis.value = ''; savedSummaryId.value = ''
}

const examples = [
  '\u5B50\u66F0\uFF1A\u5B66\u800C\u65F6\u4E60\u4E4B\uFF0C\u4E0D\u4EA6\u8BF4\u4E4E\uFF1F\u6709\u670B\u81EA\u8FDC\u65B9\u6765\uFF0C\u4E0D\u4EA6\u4E50\u4E4E\uFF1F\u4EBA\u4E0D\u77E5\u800C\u4E0D\u6120\uFF0C\u4E0D\u4EA6\u541B\u5B50\u4E4E\uFF1F',
  '\u9053\u53EF\u9053\uFF0C\u975E\u5E38\u9053\u3002\u540D\u53EF\u540D\uFF0C\u975E\u5E38\u540D\u3002\u65E0\u540D\u5929\u5730\u4E4B\u59CB\uFF0C\u6709\u540D\u4E07\u7269\u4E4B\u6BCD\u3002'
]
function useEx(t: string) { inputText.value = t; doSummarize() }

// 提取唯一汉字用于内链
const uniqueChars = computed(() => {
  const text = inputText.value + summary.value + translation.value
  return [...new Set(text.replace(/[^\u4e00-\u9fff]/g, ''))].slice(0, 30)
})
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">

    <!-- 设置 -->
    <div class="settings-section">
      <div class="setting-group">
        <label>摘要详细程度</label>
        <div class="radio-group">
          <label><input type="radio" v-model="summaryLength" value="medium" /> 适中</label>
          <label><input type="radio" v-model="summaryLength" value="long" /> 详细</label>
          <label><input type="radio" v-model="summaryLength" value="full" /> 全面</label>
        </div>
      </div>
      <div class="setting-group">
        <label class="checkbox"><input type="checkbox" v-model="includeTranslation" /> 生成现代汉语翻译</label>
        <label class="checkbox"><input type="checkbox" v-model="includeAnalysis" /> 生成深度分析</label>
      </div>
    </div>

    <!-- API Key -->
    <div v-if="!apiKey" class="api-panel">
      <p>需要配置 DeepSeek API Key：</p>
      <input v-model="apiKey" type="password" placeholder="sk-..." class="api-input" />
      <button @click="saveApiKey" class="btn-primary">保存</button>
    </div>

    <!-- \u5386\u53F2\u8BB0\u5F55 -->
    <div v-if="dbHistoryList.length || historyList.length" class="history-section">
      <h3>\uD83D\uDCDC \u5386\u53F2\u6458\u8981</h3>
      <div class="history-list">
        <!-- \u6570\u636E\u5E93\u8BB0\u5F55 -->
        <div v-for="item in dbHistoryList" :key="'db-'+item.slug" class="history-item" @click="goToHistory(item.slug)">
          <span>{{ item.original_text.slice(0, 20) }}...</span>
          <span class="date">{{ item.created_at }}</span>
        </div>
        <!-- \u672C\u5730\u8BB0\u5F55 -->
        <div v-for="item in historyList" :key="'local-'+item.id" class="history-item" @click="goToHistory(item.id)">
          <span>{{ item.text }}</span>
          <span class="date">{{ item.date }}</span>
        </div>
      </div>
    </div>

    <!-- 输入 -->
    <div class="input-section">
      <textarea v-model="inputText" placeholder="请输入古文文本..." rows="6"></textarea>
      <div class="examples">
        <span>示例：</span>
        <button v-for="(ex, i) in examples" :key="i" @click="useEx(ex)">{{ ex.slice(0, 12) }}...</button>
      </div>
      <div class="input-actions">
        <button @click="doSummarize" :disabled="processing || !inputText.trim() || !apiKey" class="summarize-btn">
          {{ processing ? '分析中...' : '开始分析' }}
        </button>
        <button @click="clear" class="clear-btn">清空</button>
      </div>
    </div>

    <!-- 结果 -->
    <div v-if="summary" class="result-section">
      <!-- 独立页面链接 -->
      <div v-if="savedSummaryId" class="page-link-bar">
        <span>✅ 已生成独立页面</span>
        <button @click="goToSummaryPage" class="view-page-btn">查看详情页 →</button>
        <span class="link-hint">链接: /summary/{{ savedSummaryId }}</span>
      </div>

      <!-- 摘要 -->
      <div class="result-block">
        <h3>📝 摘要</h3>
        <p class="text-content">
          <span v-for="(c, i) in summary" :key="'s'+i" @click="goToChar(c)" class="char">{{ c }}</span>
        </p>
      </div>

      <!-- 翻译 -->
      <div v-if="translation" class="result-block">
        <h3>📖 现代汉语翻译</h3>
        <p class="text-content">
          <span v-for="(c, i) in translation" :key="'t'+i" @click="goToChar(c)" class="char">{{ c }}</span>
        </p>
      </div>

      <!-- 深度分析 -->
      <div v-if="analysis" class="result-block">
        <h3>🔍 深度分析</h3>
        <p class="text-content analysis">
          <span v-for="(c, i) in analysis" :key="'a'+i" @click="goToChar(c)" class="char">{{ c }}</span>
        </p>
      </div>

      <!-- 关键词 -->
      <div v-if="keywords.length" class="result-block">
        <h3>🏷️ 关键词</h3>
        <div class="tags">
          <span v-for="kw in keywords" :key="kw" class="tag keyword" @click="goToChar(kw[0])">{{ kw }}</span>
        </div>
      </div>

      <!-- 主题 -->
      <div v-if="themes.length" class="result-block">
        <h3>📚 主题分析</h3>
        <div class="themes-list">
          <div v-for="th in themes" :key="th" class="theme-item">{{ th }}</div>
        </div>
      </div>

      <!-- 字词内链 -->
      <div class="result-block">
        <h3>🔤 字词详解 <span class="hint">点击查看详情</span></h3>
        <div class="char-grid">
          <router-link v-for="c in uniqueChars" :key="c" :to="`/char/${encodeURIComponent(c)}`" class="char-link">{{ c }}</router-link>
        </div>
      </div>

      <button @click="copyAll" class="copy-btn">复制全部内容</button>
    </div>

    <div class="footer-actions">
      <ToolFeedback tool-name="自动摘要" />
    </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body { @apply max-w-4xl mx-auto space-y-4; }

.settings-section { @apply bg-white rounded-xl p-4 flex flex-wrap gap-6; }
.setting-group label:first-child { @apply block text-sm text-stone-600 mb-2; }
.radio-group { @apply flex gap-4; }
.radio-group label { @apply flex items-center gap-1 text-sm cursor-pointer; }
.checkbox { @apply flex items-center gap-2 text-sm cursor-pointer; }

.api-panel { @apply bg-amber-50 border border-amber-200 rounded-lg p-4 text-center; }
.api-input { @apply w-full max-w-md px-4 py-2 border border-stone-300 rounded-lg my-3; }
.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }

.history-section { @apply bg-white rounded-xl p-4; }
.history-section h3 { @apply text-sm font-medium text-stone-600 mb-2; }
.history-list { @apply flex flex-wrap gap-2; }
.history-item { @apply px-3 py-1.5 bg-stone-100 rounded-lg text-sm cursor-pointer hover:bg-amber-100 flex items-center gap-2; }
.history-item .date { @apply text-xs text-stone-400; }

.input-section { @apply bg-white rounded-xl p-4; }
.input-section textarea { @apply w-full p-3 border border-stone-300 rounded-lg resize-none outline-none; }
.examples { @apply flex flex-wrap gap-2 mt-3 text-sm; }
.examples span { @apply text-stone-500; }
.examples button { @apply px-2 py-1 bg-stone-100 rounded hover:bg-stone-200; }
.input-actions { @apply flex gap-2 mt-3; }
.summarize-btn { @apply flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50; }
.clear-btn { @apply px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50; }

.result-section { @apply space-y-4; }

.page-link-bar { @apply bg-green-50 border border-green-200 rounded-xl p-4 flex flex-wrap items-center gap-4; }
.page-link-bar span:first-child { @apply text-green-700 font-medium; }
.view-page-btn { @apply px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600; }
.link-hint { @apply text-sm text-green-600; }

.result-block { @apply bg-white rounded-xl p-4; }
.result-block h3 { @apply font-medium text-stone-800 mb-3; }
.result-block h3 .hint { @apply text-xs text-stone-400 font-normal ml-2; }

.text-content { @apply text-stone-700 leading-relaxed; }
.text-content.analysis { @apply text-sm leading-loose; }
.char { @apply cursor-pointer hover:bg-amber-100 hover:text-amber-700 rounded; }

.tags { @apply flex flex-wrap gap-2; }
.tag { @apply px-3 py-1.5 rounded-full text-sm cursor-pointer; }
.tag.keyword { @apply bg-amber-100 text-amber-700 hover:bg-amber-200; }

.themes-list { @apply space-y-2; }
.theme-item { @apply p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm; }

.char-grid { @apply flex flex-wrap gap-2; }
.char-link { @apply w-10 h-10 flex items-center justify-center bg-stone-100 rounded-lg text-lg hover:bg-amber-100 hover:text-amber-700; }

.copy-btn { @apply w-full py-2 border border-stone-300 rounded-lg hover:bg-stone-50; }
.footer-actions { @apply text-center; }
</style>
