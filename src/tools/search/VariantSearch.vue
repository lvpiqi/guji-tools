<script setup lang="ts">
/**
 * 异体字搜索工具
 * 输入一个字，显示所有异体字变体
 * 支持 AI 动态生成 + SEO 独立页面
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getCharacterData, type CharacterData } from '@core/services/aiContent'
import RelatedTools from '@/components/common/RelatedTools.vue'

const router = useRouter()
const searchChar = ref('')
const searchResult = ref<CharacterData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// API Key
const apiKey = ref(localStorage.getItem('deepseek_api_key') || '')
const showApiKeyInput = ref(false)

// 本地示例数据（无API时使用）
const localVariants: Record<string, Partial<CharacterData>> = {
  '学': {
    char: '学',
    variants: ['學', '斈', '斅'],
    definition: { basic: '学习，效法', classical: '學，覺悟也。', english: 'learn, study' }
  },
  '學': {
    char: '學',
    variants: ['学', '斈', '斅'],
    definition: { basic: '学习，效法', classical: '學，覺悟也。', english: 'learn, study' }
  },
  '国': {
    char: '国',
    variants: ['國', '囯', '囶', '圀'],
    definition: { basic: '国家，邦国', classical: '國，邦也。', english: 'country, nation' }
  },
  '國': {
    char: '國',
    variants: ['国', '囯', '囶', '圀'],
    definition: { basic: '国家，邦国', classical: '國，邦也。', english: 'country, nation' }
  },
  '万': {
    char: '万',
    variants: ['萬', '㸘'],
    definition: { basic: '数目，十千', classical: '萬，蟲也。', english: 'ten thousand' }
  },
  '萬': {
    char: '萬',
    variants: ['万', '㸘'],
    definition: { basic: '数目，十千', classical: '萬，蟲也。', english: 'ten thousand' }
  },
  '书': {
    char: '书',
    variants: ['書', '𦧺'],
    definition: { basic: '书籍，书写', classical: '書，箸也。', english: 'book, write' }
  },
  '書': {
    char: '書',
    variants: ['书', '𦧺'],
    definition: { basic: '书籍，书写', classical: '書，箸也。', english: 'book, write' }
  },
  '龙': {
    char: '龙',
    variants: ['龍', '竜', '龒', '龖'],
    definition: { basic: '传说中的神异动物', classical: '龍，鱗蟲之長。', english: 'dragon' }
  },
  '龍': {
    char: '龍',
    variants: ['龙', '竜', '龒', '龖'],
    definition: { basic: '传说中的神异动物', classical: '龍，鱗蟲之長。', english: 'dragon' }
  },
  '为': {
    char: '为',
    variants: ['為', '爲'],
    definition: { basic: '做，作为', classical: '為，母猴也。', english: 'do, act as' }
  },
  '為': {
    char: '為',
    variants: ['为', '爲'],
    definition: { basic: '做，作为', classical: '為，母猴也。', english: 'do, act as' }
  },
  '云': {
    char: '云',
    variants: ['雲', '云'],
    definition: { basic: '云彩；说', classical: '雲，山川氣也。', english: 'cloud; say' }
  },
  '雲': {
    char: '雲',
    variants: ['云'],
    definition: { basic: '云彩', classical: '雲，山川氣也。', english: 'cloud' }
  },
}

async function search() {
  if (!searchChar.value.trim()) return
  
  const char = searchChar.value.trim()[0]
  loading.value = true
  error.value = null
  
  try {
    // 优先使用本地数据
    if (localVariants[char]) {
      searchResult.value = {
        ...localVariants[char],
        char,
        generatedAt: Date.now(),
        source: 'local'
      } as CharacterData
      loading.value = false
      return
    }
    
    // 检查缓存
    const cached = localStorage.getItem(`guji_ai_${encodeURIComponent(char)}`)
    if (cached) {
      searchResult.value = JSON.parse(cached)
      loading.value = false
      return
    }
    
    // 无API Key时提示
    if (!apiKey.value) {
      showApiKeyInput.value = true
      loading.value = false
      return
    }
    
    // 调用AI生成
    searchResult.value = await getCharacterData(char, apiKey.value, ['variants', 'definition'])
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : '查询失败'
  } finally {
    loading.value = false
  }
}

function saveApiKey() {
  localStorage.setItem('deepseek_api_key', apiKey.value)
  showApiKeyInput.value = false
  search()
}

function searchVariant(char: string) {
  searchChar.value = char
  search()
}

function copyChar(char: string) {
  navigator.clipboard.writeText(char)
}

function copyAll() {
  if (!searchResult.value) return
  const all = [
    searchResult.value.char,
    ...(searchResult.value.variants || [])
  ].join(' ')
  navigator.clipboard.writeText(all)
}

// 跳转到独立详情页（SEO友好）
function goToDetailPage(char: string) {
  router.push(`/char/${encodeURIComponent(char)}`)
}

const hasResult = computed(() => searchResult.value && (searchResult.value.variants?.length || 0) > 0)
</script>

<template>
  <div class="tool-page">
    <header class="tool-header">
      <h1 class="tool-title">异体字搜索</h1>
      <p class="tool-desc">输入汉字查找所有异体字变体，支持 AI 动态生成</p>
    </header>

    <!-- 搜索框 -->
    <div class="search-section">
      <div class="search-box">
        <input
          v-model="searchChar"
          type="text"
          class="search-input"
          placeholder="输入单个汉字..."
          maxlength="1"
          @keyup.enter="search"
        />
        <button 
          class="search-btn"
          :disabled="!searchChar.trim() || loading"
          @click="search"
        >
          {{ loading ? '查询中...' : '搜索' }}
        </button>
      </div>
      
      <div class="quick-search">
        <span>快速搜索：</span>
        <button 
          v-for="char in ['学', '国', '万', '书', '龙', '为', '云']"
          :key="char"
          class="quick-btn"
          @click="searchVariant(char)"
        >
          {{ char }}
        </button>
      </div>
    </div>

    <!-- API Key 输入 -->
    <div v-if="showApiKeyInput" class="api-panel">
      <p>查询新字需要配置 DeepSeek API Key：</p>
      <input v-model="apiKey" type="password" placeholder="sk-..." class="api-input" />
      <button @click="saveApiKey" class="btn-primary">保存并查询</button>
      <p class="hint"><a href="https://platform.deepseek.com/" target="_blank">获取 API Key →</a></p>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-panel">{{ error }}</div>

    <!-- 搜索结果 -->
    <div v-if="searchResult" class="result-section">
      <div class="result-header">
        <div class="result-main">
          <span class="result-char" @click="goToDetailPage(searchResult.char)" title="查看详情页">
            {{ searchResult.char }}
          </span>
          <span v-if="searchResult.definition?.basic" class="result-meaning">
            {{ searchResult.definition.basic }}
          </span>
        </div>
        <div class="result-actions">
          <button v-if="hasResult" class="btn-copy" @click="copyAll">复制全部</button>
          <button class="btn-link" @click="goToDetailPage(searchResult.char)">详情页 →</button>
        </div>
      </div>

      <!-- 古义 -->
      <div v-if="searchResult.definition?.classical" class="classical-def">
        <span class="label">古义：</span>{{ searchResult.definition.classical }}
      </div>

      <div v-if="hasResult" class="variants-section">
        <h4>异体字变体</h4>
        <div class="char-list">
          <span
            v-for="v in searchResult.variants"
            :key="v"
            class="char-item"
            @click="copyChar(v)"
            title="点击复制"
          >
            {{ v }}
          </span>
        </div>
        
        <!-- 异体字内链 -->
        <div class="variant-links">
          <span class="link-label">查看详情：</span>
          <router-link
            v-for="v in searchResult.variants"
            :key="v"
            :to="`/char/${encodeURIComponent(v)}`"
            class="variant-link"
          >
            {{ v }}
          </router-link>
        </div>
      </div>

      <div v-else class="no-result">
        <p>未找到「{{ searchResult.char }}」的异体字</p>
        <p v-if="!apiKey" class="hint">配置 API Key 后可自动生成</p>
      </div>

      <!-- 数据来源 -->
      <div class="source-info">
        <span v-if="searchResult.source === 'ai'">🤖 AI生成</span>
        <span v-else>📚 本地数据</span>
      </div>
    </div>

    <!-- 说明 -->
    <div class="tips">
      <h4>💡 使用说明</h4>
      <ul>
        <li>点击异体字可复制到剪贴板</li>
        <li>点击"详情页"可查看完整信息（字形演变、韵部等）</li>
        <li>配置 DeepSeek API Key 后可查询任意汉字</li>
        <li>每个查询的汉字都会生成独立页面，便于搜索引擎收录</li>
      </ul>
    </div>

    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page { @apply max-w-3xl mx-auto; }
.tool-header { @apply mb-6; }
.tool-title { @apply text-2xl font-bold text-stone-800; }
.tool-desc { @apply text-stone-600 mt-1; }
.search-section { @apply bg-white rounded-xl border border-stone-200 p-6 mb-6; }
.search-box { @apply flex gap-3 mb-4; }
.search-input { @apply flex-1 px-4 py-3 text-2xl text-center border border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none; }
.search-btn { @apply px-8 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed; }
.quick-search { @apply flex items-center gap-2 text-sm text-stone-500; }
.quick-btn { @apply px-3 py-1 bg-stone-100 rounded hover:bg-stone-200 text-lg; }

.api-panel { @apply bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6 text-center; }
.api-input { @apply w-full max-w-md px-4 py-2 border border-stone-300 rounded-lg my-4; }
.hint { @apply text-sm text-stone-500 mt-2; }
.hint a { @apply text-amber-600 hover:underline; }
.error-panel { @apply bg-red-50 text-red-700 p-4 rounded-lg mb-6; }

.result-section { @apply bg-white rounded-xl border border-stone-200 p-6 mb-6; }
.result-header { @apply flex justify-between items-start mb-4 pb-4 border-b border-stone-100 flex-wrap gap-4; }
.result-main { @apply flex items-baseline gap-3; }
.result-char { @apply text-5xl text-stone-800 cursor-pointer hover:text-amber-600; }
.result-meaning { @apply text-lg text-stone-500; }
.result-actions { @apply flex gap-2; }
.btn-copy { @apply px-3 py-1 text-amber-600 hover:bg-amber-50 rounded; }
.btn-link { @apply px-3 py-1 text-stone-500 hover:text-amber-600; }

.classical-def { @apply text-stone-600 mb-4 p-3 bg-stone-50 rounded-lg; }
.classical-def .label { @apply text-stone-500; }

.variants-section { @apply mt-4; }
.variants-section h4 { @apply text-sm font-medium text-stone-500 mb-3; }
.char-list { @apply flex flex-wrap gap-2 mb-4; }
.char-item { @apply w-12 h-12 flex items-center justify-center text-2xl bg-stone-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors; }

.variant-links { @apply flex items-center gap-2 flex-wrap text-sm; }
.link-label { @apply text-stone-400; }
.variant-link { @apply px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100; }

.no-result { @apply text-center py-8 text-stone-500; }
.source-info { @apply mt-4 pt-4 border-t border-stone-100 text-xs text-stone-400; }

.tips { @apply bg-blue-50 rounded-lg p-4 text-sm text-blue-800; }
.tips h4 { @apply font-medium mb-2; }
.tips ul { @apply list-disc list-inside space-y-1 text-blue-700; }

.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }
</style>
