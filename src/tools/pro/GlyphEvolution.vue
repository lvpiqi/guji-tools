<script setup lang="ts">
/**
 * 字形演变工具
 * SEO 优化版本
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCharacterData, type CharacterData } from '@core/services/aiContent'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'
import { useQuota } from '@core/composables/useQuota'
import { useApiKey, cleanApiKey } from '@core/services/apiKeyService'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '字形演变',
  path: '/pro/glyph-evolution',
  category: '专业工具',
  categoryPath: '/pro',
  
  description: '免费在线汉字字形演变查询工具。查看汉字从甲骨文、金文、篆书、隶书到楷书的演变历程，支持AI动态生成。',
  keywords: ['字形演变', '甲骨文', '金文', '篆书', '隶书', '汉字演变', '文字学'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '查看汉字从甲骨文到楷书的演变历程',
  
  features: [
    '展示甲骨文字形描述',
    '展示金文字形描述',
    '展示篆书字形描述',
    '展示隶书字形描述',
    '展示楷书字形描述',
    '提供演变说明',
    '支持AI动态生成',
    '可跳转详情页面'
  ],
  
  howToUse: [
    '在搜索框输入单个汉字',
    '点击「查询」或按回车',
    '查看各阶段的字形描述',
    '阅读演变说明了解字源',
    '点击「详情页」查看更多信息'
  ],
  
  introduction: `汉字是世界上最古老的文字之一，经历了数千年的演变。本工具可以帮助了解汉字从甲骨文到楷书的演变历程。

甲骨文是商代刻在龟甲兽骨上的文字，是目前发现的最早的成熟汉字。金文是周代铸刻在青铜器上的文字。篆书是秦始皇统一文字后的标准字体。隶书是汉代通行的字体。楷书是魏晋以后的标准字体。

了解字形演变有助于理解汉字的构造原理和文化内涵。`,

  faq: [
    {
      question: '字形描述准确吗？',
      answer: '内置数据基于文字学研究，AI生成的数据仅供参考。'
    },
    {
      question: '为什么没有字形图片？',
      answer: '当前版本提供文字描述，字形图片功能正在开发中。'
    },
    {
      question: '可以查询所有汉字吗？',
      answer: '内置常用字数据，配置API Key后可查询任意汉字。'
    },
    {
      question: '甲骨文和金文有什么区别？',
      answer: '甲骨文是商代文字，金文是周代文字，金文比甲骨文更加规整。'
    }
  ],
  
  isOffline: false,
  isFree: true
}

// 配额检查
const { canPerform, consume } = useQuota('glyph-evolution', '字形演变')

// API Key
const { apiKey, loading: apiKeyLoading } = useApiKey()

const router = useRouter()
const searchChar = ref('')
const result = ref<CharacterData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// 本地示例数据（无API时使用）
const localData: Record<string, Partial<CharacterData>> = {
  '日': {
    char: '日',
    definition: { basic: '太阳，日子', classical: '日，实也。太阳之精不亏。', english: 'sun, day' },
    evolution: {
      oracle: '圆形中间一点，象太阳之形',
      bronze: '圆形变方，中间一横',
      seal: '方形规整，中间一横',
      clerical: '笔画平直，结构方正',
      regular: '今日通行字形',
      description: '日字是典型的象形字，甲骨文画一个圆圈，中间加一点或一横，象太阳之形。'
    }
  },
  '月': {
    char: '月',
    definition: { basic: '月亮，月份', classical: '月，阙也。太阴之精。', english: 'moon, month' },
    evolution: {
      oracle: '弯月之形，象新月',
      bronze: '月形更加规整',
      seal: '线条圆润',
      clerical: '笔画方折',
      regular: '今日通行字形',
      description: '月字象形，甲骨文画一弯新月之形，后逐渐演变为今天的字形。'
    }
  },
  '山': {
    char: '山',
    definition: { basic: '山峰，山脉', classical: '山，宣也。宣气散生万物。', english: 'mountain' },
    evolution: {
      oracle: '三峰并立，象山形',
      bronze: '山峰更加突出',
      seal: '线条流畅',
      clerical: '笔画平直',
      regular: '今日通行字形',
      description: '山字是象形字，甲骨文画三座山峰并立之形，中峰最高。'
    }
  },
  '水': {
    char: '水',
    definition: { basic: '水流，液体', classical: '水，准也。北方之行。', english: 'water' },
    evolution: {
      oracle: '象水流之形，中间主流，两侧支流',
      bronze: '水流形态更明显',
      seal: '线条弯曲如水',
      clerical: '笔画简化',
      regular: '今日通行字形',
      description: '水字象形，甲骨文画水流之形，中间一条主流，两侧有支流或水花。'
    }
  },
  '人': {
    char: '人',
    definition: { basic: '人类，人物', classical: '人，天地之性最贵者也。', english: 'person, human' },
    evolution: {
      oracle: '侧立人形，有头有身',
      bronze: '人形更加简化',
      seal: '两笔交叉',
      clerical: '撇捺分明',
      regular: '今日通行字形',
      description: '人字象形，甲骨文画一个侧立的人形，后简化为撇捺两笔。'
    }
  },
  '木': {
    char: '木',
    definition: { basic: '树木，木材', classical: '木，冒也。冒地而生。', english: 'tree, wood' },
    evolution: {
      oracle: '象树形，上有枝下有根',
      bronze: '树形更加规整',
      seal: '线条对称',
      clerical: '横平竖直',
      regular: '今日通行字形',
      description: '木字象形，甲骨文画一棵树，上有枝叶，下有根须。'
    }
  },
}

async function search() {
  if (!searchChar.value.trim()) return
  
  const check = canPerform()
  if (!check.allowed) {
    alert(check.reason || '使用次数已达上限')
    return
  }
  
  const char = searchChar.value.trim()[0]
  loading.value = true
  error.value = null
  
  await consume(1)
  
  try {
    // 优先使用本地数据
    if (localData[char]) {
      result.value = {
        ...localData[char],
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
      result.value = JSON.parse(cached)
      loading.value = false
      return
    }
    
    // 无API Key时提示
    if (!apiKey.value) {
      error.value = '系统未配置 AI 服务，请联系管理员'
      loading.value = false
      return
    }
    
    // 调用AI生成
    const cleanKey = cleanApiKey(apiKey.value)
    result.value = await getCharacterData(char, cleanKey, ['evolution', 'definition'])
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : '查询失败'
  } finally {
    loading.value = false
  }
}

function searchGlyph(char: string) {
  searchChar.value = char
  search()
}

// 跳转到独立详情页（SEO友好）
function goToDetailPage() {
  if (result.value?.char) {
    router.push(`/char/${encodeURIComponent(result.value.char)}`)
  }
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">

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
          {{ loading ? '查询中...' : '查询' }}
        </button>
      </div>
      
      <div class="quick-search">
        <span>示例：</span>
        <button 
          v-for="char in ['日', '月', '山', '水', '人', '木']"
          :key="char"
          class="quick-btn"
          @click="searchGlyph(char)"
        >
          {{ char }}
        </button>
      </div>
    </div>

    <!-- API Key 加载提示 -->
    <div v-if="apiKeyLoading" class="api-panel">
      <p>正在加载 AI 配置...</p>
    </div>
    <div v-else-if="!apiKey && !localData[searchChar]" class="api-panel">
      <p>⚠️ 系统未配置 AI 服务，仅能查询内置示例字</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-panel">{{ error }}</div>

    <!-- 演变结果 -->
    <div v-if="result" class="result-section">
      <div class="result-header">
        <span class="result-char">{{ result.char }}</span>
        <span class="result-meaning">{{ result.definition?.basic }}</span>
        <button class="btn-link" @click="goToDetailPage">查看完整详情页 →</button>
      </div>

      <!-- 释义 -->
      <div v-if="result.definition?.classical" class="classical-def">
        <span class="label">古义：</span>{{ result.definition.classical }}
      </div>

      <!-- 演变时间轴 -->
      <div v-if="result.evolution" class="evolution-section">
        <h3>字形演变</h3>
        <div class="evolution-timeline">
          <div v-if="result.evolution.oracle" class="evo-stage">
            <span class="evo-label">甲骨文</span>
            <p>{{ result.evolution.oracle }}</p>
          </div>
          <div v-if="result.evolution.bronze" class="evo-stage">
            <span class="evo-label">金文</span>
            <p>{{ result.evolution.bronze }}</p>
          </div>
          <div v-if="result.evolution.seal" class="evo-stage">
            <span class="evo-label">篆书</span>
            <p>{{ result.evolution.seal }}</p>
          </div>
          <div v-if="result.evolution.clerical" class="evo-stage">
            <span class="evo-label">隶书</span>
            <p>{{ result.evolution.clerical }}</p>
          </div>
          <div v-if="result.evolution.regular" class="evo-stage">
            <span class="evo-label">楷书</span>
            <p>{{ result.evolution.regular }}</p>
          </div>
        </div>
        <p v-if="result.evolution.description" class="evo-desc">
          {{ result.evolution.description }}
        </p>
      </div>

      <!-- 数据来源 -->
      <div class="source-info">
        <span v-if="result.source === 'ai'">🤖 AI生成</span>
        <span v-else>📚 本地数据</span>
        <span class="time">{{ new Date(result.generatedAt).toLocaleString() }}</span>
      </div>
    </div>

    <div v-else-if="searchChar && !loading && !apiKeyLoading" class="no-result">
      <p>未找到「{{ searchChar }}」的数据</p>
      <p v-if="!apiKey" class="hint">系统未配置 AI 服务，请联系管理员</p>
    </div>

    <!-- 说明 -->
    <div class="tips">
      <h4>💡 关于字形演变</h4>
      <ul>
        <li><strong>甲骨文</strong>：商代刻在龟甲兽骨上的文字</li>
        <li><strong>金文</strong>：周代铸刻在青铜器上的文字</li>
        <li><strong>篆书</strong>：秦始皇统一文字后的标准字体</li>
        <li><strong>隶书</strong>：汉代通行的字体</li>
        <li><strong>楷书</strong>：魏晋以后的标准字体</li>
      </ul>
      <p class="mt-2">配置 DeepSeek API Key 后，可查询任意汉字，AI 将自动生成演变信息。</p>
    </div>
    <div class="footer-actions">
      <ToolFeedback tool-name="字形演变" />
    </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body { @apply max-w-4xl mx-auto space-y-6; }
.search-section { @apply bg-white rounded-xl border border-stone-200 p-6; }
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
.result-header { @apply flex items-baseline gap-4 mb-4 pb-4 border-b border-stone-100 flex-wrap; }
.result-char { @apply text-5xl text-stone-800; }
.result-meaning { @apply text-lg text-stone-500; }
.btn-link { @apply ml-auto text-sm text-amber-600 hover:underline; }
.classical-def { @apply text-stone-600 mb-4 p-3 bg-stone-50 rounded-lg; }
.classical-def .label { @apply text-stone-500; }
.evolution-section { @apply mt-6; }
.evolution-section h3 { @apply font-medium text-stone-800 mb-4; }
.evolution-timeline { @apply space-y-3; }
.evo-stage { @apply flex gap-4 items-start; }
.evo-label { @apply w-16 shrink-0 text-sm font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded text-center; }
.evo-stage p { @apply text-stone-600 text-sm; }
.evo-desc { @apply mt-4 pt-4 border-t border-stone-100 text-stone-700 leading-relaxed; }
.source-info { @apply mt-4 pt-4 border-t border-stone-100 text-xs text-stone-400 flex gap-4; }
.no-result { @apply text-center py-12 text-stone-500; }
.tips { @apply bg-amber-50 rounded-lg p-4 text-sm text-amber-900; }
.tips h4 { @apply font-medium mb-2; }
.tips ul { @apply space-y-1; }
.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }
</style>
