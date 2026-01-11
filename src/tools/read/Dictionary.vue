<script setup lang="ts">
/**
 * 划词释义工具
 * SEO 优化版本
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCharacterData, type CharacterData } from '@core/services/aiContent'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'
import { useQuota } from '@core/composables/useQuota'
import { useApiKey, cleanApiKey } from '@core/services/apiKeyService'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '划词释义',
  path: '/read/dictionary',
  category: '阅读辅助',
  categoryPath: '/read',
  
  description: '免费在线古文划词释义工具。点击或选中汉字即可查看释义、异体字、韵部等信息，支持AI动态生成。',
  keywords: ['划词释义', '古文字典', '汉字释义', '异体字', '韵部查询', '古文阅读'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '点击汉字查看释义、异体字、韵部等信息',
  
  features: [
    '点击单字即时查询',
    '显示基本义和古义',
    '显示英文释义',
    '显示异体字关联',
    '显示平水韵韵部',
    '显示反切注音',
    '支持AI动态生成',
    '可跳转详情页面'
  ],
  
  howToUse: [
    '粘贴或输入古文文本',
    '点击任意汉字查看释义',
    '查看基本义、古义、异体字等',
    '点击「详情页」查看完整信息',
    '配置API Key可查询任意汉字'
  ],
  
  introduction: `阅读古籍时经常遇到生僻字或古今异义词，本工具可以帮助快速查询汉字的释义和相关信息。

工具内置了常用古文字词的释义数据，包括基本义、古义、英文释义、异体字和韵部信息。对于未收录的字，可以配置DeepSeek API Key使用AI动态生成。

点击「详情页」可以跳转到该字的独立页面，查看更完整的信息包括字形演变等。`,

  faq: [
    {
      question: '为什么有些字查不到？',
      answer: '内置词典只收录了常用古文字词。配置API Key后可以查询任意汉字。'
    },
    {
      question: 'API Key如何获取？',
      answer: '访问 platform.deepseek.com 注册账号即可获取API Key。'
    },
    {
      question: '异体字有什么用？',
      answer: '异体字是同一个字的不同写法，了解异体字有助于阅读不同版本的古籍。'
    },
    {
      question: '韵部信息有什么用？',
      answer: '韵部信息对于理解古诗词的押韵和音韵学研究很有帮助。'
    },
    {
      question: 'AI生成的内容准确吗？',
      answer: 'AI生成的内容仅供参考，重要研究请以权威字典为准。'
    }
  ],
  
  isOffline: false,
  isFree: true
}

// 配额检查
const { canPerform, consume } = useQuota('dictionary', '划词释义')

// API Key
const { apiKey, loading: apiKeyLoading, error: apiKeyError } = useApiKey()

const router = useRouter()
const inputText = ref('')
const selectedChar = ref('')
const definition = ref<CharacterData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// 简单的本地词典（示例数据）
const localDict: Record<string, Partial<CharacterData>> = {
  '學': {
    char: '學',
    definition: { basic: '效法，模仿；學習，研習；學問，知識', classical: '學，覺悟也。', english: 'learn, study' },
    variants: ['学', '斈'],
    rhyme: { pingshui: '十藥', tone: '入', fanqie: '胡覺切' }
  },
  '而': {
    char: '而',
    definition: { basic: '連詞，表示並列、轉折、承接等', classical: '而，頰毛也。', english: 'and, but, yet' },
    rhyme: { pingshui: '四支', tone: '平', fanqie: '如之切' }
  },
  '時': {
    char: '時',
    definition: { basic: '時間，時候；時機，機會', classical: '時，四時也。', english: 'time, season' },
    variants: ['时'],
    rhyme: { pingshui: '四支', tone: '平', fanqie: '市之切' }
  },
  '習': {
    char: '習',
    definition: { basic: '反復練習，溫習；習慣，習性', classical: '習，數飛也。', english: 'practice, habit' },
    variants: ['习'],
    rhyme: { pingshui: '十四緝', tone: '入', fanqie: '似入切' }
  },
  '之': {
    char: '之',
    definition: { basic: '代詞，他、她、它；助詞，的', classical: '之，出也。', english: 'of, it, go' },
    rhyme: { pingshui: '四支', tone: '平', fanqie: '止而切' }
  },
  '子': {
    char: '子',
    definition: { basic: '兒子，後代；對人的尊稱', classical: '子，十一月陽氣動，萬物滋。', english: 'son, master' },
    rhyme: { pingshui: '四紙', tone: '上', fanqie: '即里切' }
  },
  '曰': {
    char: '曰',
    definition: { basic: '說，講；叫做，稱為', classical: '曰，詞也。', english: 'say, speak' },
    rhyme: { pingshui: '六月', tone: '入', fanqie: '王伐切' }
  },
  '君': {
    char: '君',
    definition: { basic: '君主，國君；對人的尊稱', classical: '君，尊也。', english: 'lord, ruler' },
    rhyme: { pingshui: '十二文', tone: '平', fanqie: '舉云切' }
  },
  '不': {
    char: '不',
    definition: { basic: '副詞，表示否定', classical: '不，鳥飛上翔不下來也。', english: 'not, no' },
    rhyme: { pingshui: '五物', tone: '入', fanqie: '分勿切' }
  },
  '亦': {
    char: '亦',
    definition: { basic: '副詞，也、又', classical: '亦，人之臂亦也。', english: 'also, too' },
    rhyme: { pingshui: '十一陌', tone: '入', fanqie: '夷益切' }
  },
}

async function lookupChar(char: string) {
  if (!char || char.length !== 1) return
  if (/[，。！？、；：「」『』（）\s]/.test(char)) return
  
  const check = canPerform()
  if (!check.allowed) {
    alert(check.reason || '使用次数已达上限')
    return
  }
  
  selectedChar.value = char
  loading.value = true
  error.value = null
  definition.value = null
  
  await consume(1)
  
  try {
    // 先查本地詞典
    if (localDict[char]) {
      definition.value = {
        ...localDict[char],
        char,
        generatedAt: Date.now(),
        source: 'local'
      } as CharacterData
      return
    }
    
    // 检查缓存
    const cached = localStorage.getItem(`guji_ai_${encodeURIComponent(char)}`)
    if (cached) {
      definition.value = JSON.parse(cached)
      return
    }
    
    // 无API Key时提示
    if (!apiKey.value) {
      error.value = '系统未配置 AI 服务，请联系管理员'
      return
    }
    
    // 调用AI生成
    const cleanKey = cleanApiKey(apiKey.value)
    definition.value = await getCharacterData(selectedChar.value, cleanKey, ['definition', 'variants', 'rhyme'])
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : '查询失败'
  } finally {
    loading.value = false
  }
}

function handleTextSelect() {
  const selection = window.getSelection()
  if (selection && selection.toString().trim()) {
    const text = selection.toString().trim()
    if (text.length === 1) {
      lookupChar(text)
    }
  }
}

function handleCharClick(char: string) {
  lookupChar(char)
}

// 跳转到独立详情页
function goToDetailPage() {
  if (definition.value?.char) {
    router.push(`/char/${encodeURIComponent(definition.value.char)}`)
  }
}

// 將文本拆分為單字數組
const charArray = computed(() => {
  return inputText.value.split('').filter(c => c.trim())
})

// 示例文本
const exampleText = '子曰學而時習之不亦說乎有朋自遠方來不亦樂乎人不知而不慍不亦君子乎'

function loadExample() {
  inputText.value = exampleText
}

function clearAll() {
  inputText.value = ''
  selectedChar.value = ''
  definition.value = null
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">

    <!-- API Key 加载提示 -->
    <div v-if="apiKeyLoading" class="api-panel">
      <p>正在加载 AI 配置...</p>
    </div>
    <div v-else-if="!apiKey" class="api-panel">
      <p>⚠️ 系统未配置 AI 服务，仅能查询内置词典</p>
    </div>

    <div class="tool-body">
      <!-- 左侧：文本输入和显示 -->
      <div class="text-section">
        <div class="section-header">
          <h3>输入文本</h3>
          <button class="btn-example" @click="loadExample">加载示例</button>
        </div>
        
        <textarea
          v-model="inputText"
          class="text-input"
          placeholder="粘贴古文文本..."
          rows="4"
        ></textarea>

        <!-- 可点击的文字显示 -->
        <div 
          v-if="charArray.length"
          class="char-display"
          @mouseup="handleTextSelect"
        >
          <span
            v-for="(char, i) in charArray"
            :key="i"
            class="char-item"
            :class="{ active: char === selectedChar, punctuation: /[，。！？、；：「」『』（）]/.test(char) }"
            @click="handleCharClick(char)"
          >
            {{ char }}
          </span>
        </div>
      </div>

      <!-- 右侧：释义显示 -->
      <div class="dict-section">
        <h3>释义</h3>
        
        <div v-if="loading" class="dict-loading">
          <span class="spinner"></span> 查询中...
        </div>
        
        <div v-else-if="error" class="dict-error">{{ error }}</div>
        
        <div v-else-if="definition" class="dict-entry">
          <div class="dict-header">
            <span class="dict-char" @click="goToDetailPage" title="查看详情页">
              {{ definition.char }}
            </span>
            <button class="btn-link" @click="goToDetailPage">详情页 →</button>
          </div>
          
          <!-- 释义 -->
          <div v-if="definition.definition" class="dict-definitions">
            <div class="def-item">
              <span class="def-label">基本义</span>
              <p>{{ definition.definition.basic }}</p>
            </div>
            <div v-if="definition.definition.classical" class="def-item">
              <span class="def-label">古义</span>
              <p>{{ definition.definition.classical }}</p>
            </div>
            <div v-if="definition.definition.english" class="def-item">
              <span class="def-label">English</span>
              <p>{{ definition.definition.english }}</p>
            </div>
          </div>
          
          <!-- 异体字 -->
          <div v-if="definition.variants?.length" class="dict-variants">
            <span class="var-label">异体字：</span>
            <router-link
              v-for="v in definition.variants"
              :key="v"
              :to="`/char/${encodeURIComponent(v)}`"
              class="var-link"
            >
              {{ v }}
            </router-link>
          </div>
          
          <!-- 韵部 -->
          <div v-if="definition.rhyme" class="dict-rhyme">
            <span class="rhyme-item">{{ definition.rhyme.pingshui }}</span>
            <span class="rhyme-item">{{ definition.rhyme.tone }}声</span>
            <span v-if="definition.rhyme.fanqie" class="rhyme-item">{{ definition.rhyme.fanqie }}</span>
          </div>
          
          <!-- 数据来源 -->
          <div class="source-info">
            <span v-if="definition.source === 'ai'">🤖 AI生成</span>
            <span v-else>📚 本地数据</span>
          </div>
        </div>
        
        <div v-else class="dict-empty">
          <p>点击左侧文字查看释义</p>
          <p class="hint">支持单字查询</p>
        </div>
      </div>
    </div>

    <div class="footer-actions">
      <button class="btn-text" @click="clearAll">清空</button>
      <ToolFeedback tool-name="划词释义" />
    </div>

    <!-- 说明 -->
    <div class="tips">
      <h4>💡 使用说明</h4>
      <ul>
        <li>点击单个汉字即可查看释义</li>
        <li>配置 DeepSeek API Key 后可查询任意汉字</li>
        <li>点击"详情页"可查看完整信息（字形演变等）</li>
        <li>每个查询的汉字都会生成独立页面</li>
      </ul>
    </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body { @apply max-w-4xl mx-auto space-y-6; }

.api-panel { @apply bg-amber-50 border border-amber-200 rounded-lg p-4 text-center; }
.api-input { @apply px-4 py-2 border border-stone-300 rounded-lg mx-2; }
.hint { @apply text-sm text-stone-500 mt-2; }
.hint a { @apply text-amber-600 hover:underline; }

.content-body { @apply grid grid-cols-1 lg:grid-cols-3 gap-6; }
.text-section { @apply lg:col-span-2 bg-white rounded-xl border border-stone-200 p-4; }
.section-header { @apply flex justify-between items-center mb-3; }
.section-header h3 { @apply font-medium text-stone-800; }
.btn-example { @apply px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded; }
.text-input { @apply w-full px-3 py-2 border border-stone-200 rounded-lg mb-4 focus:border-amber-400 focus:outline-none resize-none; }
.char-display { @apply p-4 bg-stone-50 rounded-lg min-h-[200px] leading-loose select-none; }
.char-item { @apply inline-block text-xl cursor-pointer px-0.5 py-1 rounded hover:bg-amber-100 transition-colors; }
.char-item.active { @apply bg-amber-200; }
.char-item.punctuation { @apply cursor-default hover:bg-transparent; }

.dict-section { @apply bg-white rounded-xl border border-stone-200 p-4; }
.dict-section h3 { @apply font-medium text-stone-800 mb-4 pb-2 border-b border-stone-100; }
.dict-loading { @apply flex items-center justify-center gap-2 text-stone-500 py-8; }
.spinner { @apply w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin; }
.dict-error { @apply text-red-600 py-4; }
.dict-empty { @apply text-center text-stone-400 py-8; }
.dict-empty .hint { @apply text-sm mt-2; }

.dict-entry { @apply space-y-4; }
.dict-header { @apply flex justify-between items-center; }
.dict-char { @apply text-4xl text-stone-800 cursor-pointer hover:text-amber-600; }
.btn-link { @apply text-sm text-stone-500 hover:text-amber-600; }

.dict-definitions { @apply space-y-3; }
.def-item { @apply flex gap-3; }
.def-label { @apply w-14 shrink-0 text-xs text-stone-500 pt-1; }
.def-item p { @apply text-stone-700 text-sm leading-relaxed; }

.dict-variants { @apply flex items-center gap-2 flex-wrap; }
.var-label { @apply text-xs text-stone-500; }
.var-link { @apply px-2 py-0.5 bg-stone-100 rounded text-stone-700 hover:bg-amber-100; }

.dict-rhyme { @apply flex gap-2 text-xs; }
.rhyme-item { @apply px-2 py-1 bg-blue-50 text-blue-700 rounded; }

.source-info { @apply text-xs text-stone-400 pt-2 border-t border-stone-100; }

.footer-actions { @apply text-center mb-6; }
.btn-text { @apply px-4 py-2 text-stone-500 hover:text-stone-700; }
.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }

.tips { @apply bg-blue-50 rounded-lg p-4 text-sm text-blue-800; }
.tips h4 { @apply font-medium mb-2; }
.tips ul { @apply list-disc list-inside space-y-1 text-blue-700; }
</style>
