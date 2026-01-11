<script setup lang="ts">
/**
 * 押韵检测工具
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
  name: '押韵检测',
  path: '/pro/rhyme-check',
  category: '专业工具',
  categoryPath: '/pro',
  
  description: '免费在线古诗词押韵检测工具。基于平水韵检测韵部和押韵情况，支持AI动态查询未收录字的韵部。',
  keywords: ['押韵检测', '平水韵', '韵部查询', '古诗词', '诗词格律', '韵脚分析'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '检测古诗词的韵部和押韵情况',
  
  features: [
    '基于平水韵检测',
    '自动提取韵脚字',
    '显示韵部和声调',
    '检测押韵是否正确',
    '提示平仄混用问题',
    '支持AI查询未知字',
    '可跳转字词详情页',
    '内置经典诗词示例'
  ],
  
  howToUse: [
    '输入古诗词，每行一句',
    '点击「检测押韵」进行分析',
    '查看每句的韵脚和韵部',
    '查看押韵是否正确',
    '点击韵脚字查看详情'
  ],
  
  introduction: `押韵是古诗词的重要特征，本工具可以帮助检测诗词的押韵情况。工具基于平水韵，这是宋代以后诗词创作的主要韵书。

平水韵分为平、上、去、入四声，共106韵。工具会自动提取每句的韵脚字，查询其韵部，并检测是否押韵正确。

对于未收录的字，可以配置DeepSeek API Key使用AI动态查询韵部。`,

  faq: [
    {
      question: '什么是平水韵？',
      answer: '平水韵是宋代刘渊编纂的韵书，是近体诗创作的主要依据。'
    },
    {
      question: '为什么有些字显示「未知」？',
      answer: '内置韵表只收录了常用字，配置API Key后可查询更多。'
    },
    {
      question: '平仄混用是什么意思？',
      answer: '近体诗通常要求韵脚同为平声或仄声，混用可能不符合格律。'
    },
    {
      question: '可以检测词牌吗？',
      answer: '可以检测押韵，但词牌的格律检测功能正在开发中。'
    },
    {
      question: 'AI查询的韵部准确吗？',
      answer: 'AI生成的韵部仅供参考，重要研究请以韵书为准。'
    }
  ],
  
  isOffline: false,
  isFree: true
}

// 配额检查
const { canPerform, consume } = useQuota('rhyme-check', '押韵检测')

// API Key
const { apiKey, loading: apiKeyLoading } = useApiKey()

const router = useRouter()
const inputText = ref('')
const result = ref<RhymeResult | null>(null)
const loading = ref(false)

interface RhymeChar {
  char: string
  rhyme: string
  tone: string
  source: 'local' | 'ai' | 'unknown'
}

interface RhymeResult {
  lines: string[]
  rhymeChars: RhymeChar[]
  rhymeGroup: string
  isValid: boolean
  issues: string[]
}

// 平水韵简表（本地数据）
const rhymeTable: Record<string, { rhyme: string; tone: string }> = {
  // 平声一东
  '东': { rhyme: '一东', tone: '平' }, '同': { rhyme: '一东', tone: '平' },
  '中': { rhyme: '一东', tone: '平' }, '空': { rhyme: '一东', tone: '平' },
  '风': { rhyme: '一东', tone: '平' }, '红': { rhyme: '一东', tone: '平' },
  '公': { rhyme: '一东', tone: '平' }, '功': { rhyme: '一东', tone: '平' },
  '通': { rhyme: '一东', tone: '平' }, '宫': { rhyme: '一东', tone: '平' },
  // 二冬
  '冬': { rhyme: '二冬', tone: '平' }, '农': { rhyme: '二冬', tone: '平' },
  '宗': { rhyme: '二冬', tone: '平' }, '钟': { rhyme: '二冬', tone: '平' },
  '龙': { rhyme: '二冬', tone: '平' }, '松': { rhyme: '二冬', tone: '平' },
  // 四支
  '支': { rhyme: '四支', tone: '平' }, '时': { rhyme: '四支', tone: '平' },
  '知': { rhyme: '四支', tone: '平' }, '诗': { rhyme: '四支', tone: '平' },
  '期': { rhyme: '四支', tone: '平' }, '思': { rhyme: '四支', tone: '平' },
  // 五微
  '微': { rhyme: '五微', tone: '平' }, '飞': { rhyme: '五微', tone: '平' },
  '归': { rhyme: '五微', tone: '平' }, '衣': { rhyme: '五微', tone: '平' },
  // 六鱼
  '鱼': { rhyme: '六鱼', tone: '平' }, '书': { rhyme: '六鱼', tone: '平' },
  '居': { rhyme: '六鱼', tone: '平' }, '初': { rhyme: '六鱼', tone: '平' },
  // 七虞
  '虞': { rhyme: '七虞', tone: '平' }, '无': { rhyme: '七虞', tone: '平' },
  '夫': { rhyme: '七虞', tone: '平' }, '湖': { rhyme: '七虞', tone: '平' },
  // 十灰
  '灰': { rhyme: '十灰', tone: '平' }, '回': { rhyme: '十灰', tone: '平' },
  '开': { rhyme: '十灰', tone: '平' }, '来': { rhyme: '十灰', tone: '平' },
  '台': { rhyme: '十灰', tone: '平' }, '才': { rhyme: '十灰', tone: '平' },
  // 十一真
  '真': { rhyme: '十一真', tone: '平' }, '人': { rhyme: '十一真', tone: '平' },
  '春': { rhyme: '十一真', tone: '平' }, '新': { rhyme: '十一真', tone: '平' },
  '身': { rhyme: '十一真', tone: '平' }, '尘': { rhyme: '十一真', tone: '平' },
  // 十四寒
  '寒': { rhyme: '十四寒', tone: '平' }, '山': { rhyme: '十四寒', tone: '平' },
  '间': { rhyme: '十四寒', tone: '平' }, '关': { rhyme: '十四寒', tone: '平' },
  '还': { rhyme: '十四寒', tone: '平' }, '看': { rhyme: '十四寒', tone: '平' },
  // 一先
  '先': { rhyme: '一先', tone: '平' }, '天': { rhyme: '一先', tone: '平' },
  '年': { rhyme: '一先', tone: '平' }, '前': { rhyme: '一先', tone: '平' },
  '边': { rhyme: '一先', tone: '平' }, '烟': { rhyme: '一先', tone: '平' },
  // 七阳
  '阳': { rhyme: '七阳', tone: '平' }, '光': { rhyme: '七阳', tone: '平' },
  '长': { rhyme: '七阳', tone: '平' }, '乡': { rhyme: '七阳', tone: '平' },
  '霜': { rhyme: '七阳', tone: '平' }, '床': { rhyme: '七阳', tone: '平' },
  '望': { rhyme: '七阳', tone: '平' }, '香': { rhyme: '七阳', tone: '平' },
  // 八庚
  '庚': { rhyme: '八庚', tone: '平' }, '明': { rhyme: '八庚', tone: '平' },
  '声': { rhyme: '八庚', tone: '平' }, '情': { rhyme: '八庚', tone: '平' },
  '生': { rhyme: '八庚', tone: '平' }, '行': { rhyme: '八庚', tone: '平' },
  // 仄声
  '月': { rhyme: '六月', tone: '入' }, '雪': { rhyme: '六月', tone: '入' },
  '夜': { rhyme: '二十二祃', tone: '去' }, '地': { rhyme: '四寘', tone: '去' },
  '晓': { rhyme: '十七筱', tone: '上' }, '鸟': { rhyme: '十七筱', tone: '上' },
  '少': { rhyme: '十七筱', tone: '上' }, '了': { rhyme: '十七筱', tone: '上' },
  '流': { rhyme: '十一尤', tone: '平' }, '楼': { rhyme: '十一尤', tone: '平' },
  '秋': { rhyme: '十一尤', tone: '平' }, '舟': { rhyme: '十一尤', tone: '平' },
}

async function analyze() {
  if (!inputText.value.trim()) return
  
  const check = canPerform()
  if (!check.allowed) {
    alert(check.reason || '使用次数已达上限')
    return
  }
  
  loading.value = true
  
  await consume(1)
  
  // 按行分割
  const lines = inputText.value
    .split(/[\n，。！？、；：]+/)
    .map(l => l.trim())
    .filter(l => l.length > 0)
  
  // 提取韵脚（每行最后一个字）
  const rhymeChars: RhymeChar[] = []
  
  for (const line of lines) {
    if (line.length === 0) continue
    const lastChar = line[line.length - 1]
    
    // 先查本地
    if (rhymeTable[lastChar]) {
      rhymeChars.push({
        char: lastChar,
        rhyme: rhymeTable[lastChar].rhyme,
        tone: rhymeTable[lastChar].tone,
        source: 'local'
      })
    } 
    // 查缓存
    else {
      const cached = localStorage.getItem(`guji_ai_${encodeURIComponent(lastChar)}`)
      if (cached) {
        const data: CharacterData = JSON.parse(cached)
        if (data.rhyme) {
          rhymeChars.push({
            char: lastChar,
            rhyme: data.rhyme.pingshui,
            tone: data.rhyme.tone,
            source: 'ai'
          })
          continue
        }
      }
      
      // 有API Key则调用AI
      if (apiKey.value) {
        try {
          const cleanKey = cleanApiKey(apiKey.value)
          const data = await getCharacterData(lastChar, cleanKey, ['rhyme'])
          if (data.rhyme) {
            rhymeChars.push({
              char: lastChar,
              rhyme: data.rhyme.pingshui,
              tone: data.rhyme.tone,
              source: 'ai'
            })
            continue
          }
        } catch (e) {
          console.error('AI lookup failed:', e)
        }
      }
      
      // 未知
      rhymeChars.push({
        char: lastChar,
        rhyme: '未知',
        tone: '未知',
        source: 'unknown'
      })
    }
  }
  
  // 检查押韵
  const rhymes = rhymeChars.map(r => r.rhyme).filter(r => r !== '未知')
  const uniqueRhymes = [...new Set(rhymes)]
  
  const issues: string[] = []
  
  if (uniqueRhymes.length > 1) {
    issues.push(`存在多个韵部：${uniqueRhymes.join('、')}`)
  }
  
  const tones = rhymeChars.map(r => r.tone)
  const hasPing = tones.some(t => t === '平')
  const hasZe = tones.some(t => t === '去' || t === '上' || t === '入')
  if (hasPing && hasZe) {
    issues.push('韵脚平仄混用')
  }
  
  const unknownCount = rhymeChars.filter(r => r.source === 'unknown').length
  if (unknownCount > 0) {
    issues.push(`${unknownCount}个字韵部未知，${apiKey.value ? '请检查' : '配置API Key可自动查询'}`)
  }
  
  result.value = {
    lines,
    rhymeChars,
    rhymeGroup: uniqueRhymes[0] || '未知',
    isValid: issues.length === 0 && uniqueRhymes.length === 1,
    issues
  }
  
  loading.value = false
}

// 跳转到汉字详情页
function goToCharDetail(char: string) {
  router.push(`/char/${encodeURIComponent(char)}`)
}

// 示例诗
const examples = [
  { title: '静夜思', text: '床前明月光\n疑是地上霜\n举头望明月\n低头思故乡' },
  { title: '春晓', text: '春眠不觉晓\n处处闻啼鸟\n夜来风雨声\n花落知多少' },
  { title: '登鹳雀楼', text: '白日依山尽\n黄河入海流\n欲穷千里目\n更上一层楼' }
]

function loadExample(text: string) {
  inputText.value = text
  analyze()
}

function clearAll() {
  inputText.value = ''
  result.value = null
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">

    <!-- API Key 加载提示 -->
    <div v-if="apiKeyLoading" class="api-hint">
      正在加载 AI 配置...
    </div>
    <div v-else-if="!apiKey" class="api-hint">
      ⚠️ 系统未配置 AI 服务，未收录字的韵部将显示为「未知」
    </div>

    <div class="tool-body">
      <!-- 输入区 -->
      <div class="input-section">
        <div class="section-header">
          <h3>输入诗词</h3>
          <div class="example-btns">
            <button 
              v-for="ex in examples" 
              :key="ex.title"
              class="example-btn"
              @click="loadExample(ex.text)"
            >
              {{ ex.title }}
            </button>
          </div>
        </div>
        <textarea
          v-model="inputText"
          class="text-input"
          placeholder="输入古诗词，每行一句..."
          rows="6"
        ></textarea>
        
        <div class="actions">
          <button 
            class="btn-primary"
            :disabled="!inputText.trim() || loading"
            @click="analyze"
          >
            {{ loading ? '检测中...' : '检测押韵' }}
          </button>
          <button class="btn-text" @click="clearAll">清空</button>
        </div>
      </div>

      <!-- 结果区 -->
      <div v-if="result" class="result-section">
        <div class="result-header">
          <h3>检测结果</h3>
          <span 
            class="result-badge"
            :class="{ valid: result.isValid, invalid: !result.isValid }"
          >
            {{ result.isValid ? '✓ 押韵正确' : '⚠ 存在问题' }}
          </span>
        </div>

        <!-- 韵脚分析 -->
        <div class="rhyme-analysis">
          <div class="rhyme-header">
            <span class="rhyme-group">韵部：{{ result.rhymeGroup }}</span>
          </div>
          
          <div class="lines-list">
            <div 
              v-for="(line, i) in result.lines" 
              :key="i"
              class="line-item"
            >
              <span class="line-num">{{ i + 1 }}</span>
              <span class="line-text">{{ line }}</span>
              <span 
                class="line-rhyme"
                :class="{ 
                  match: result.rhymeChars[i]?.rhyme === result.rhymeGroup,
                  unknown: result.rhymeChars[i]?.source === 'unknown',
                  ai: result.rhymeChars[i]?.source === 'ai'
                }"
                @click="goToCharDetail(result.rhymeChars[i]?.char)"
                title="点击查看详情"
              >
                {{ result.rhymeChars[i]?.char }}
                <small>{{ result.rhymeChars[i]?.rhyme }}</small>
                <span v-if="result.rhymeChars[i]?.source === 'ai'" class="ai-badge">AI</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 问题提示 -->
        <div v-if="result.issues.length" class="issues-list">
          <h4>⚠ 发现问题</h4>
          <ul>
            <li v-for="(issue, i) in result.issues" :key="i">{{ issue }}</li>
          </ul>
        </div>

        <!-- 韵脚内链 -->
        <div class="rhyme-links">
          <span class="link-label">查看韵脚详情：</span>
          <router-link
            v-for="rc in result.rhymeChars"
            :key="rc.char"
            :to="`/char/${encodeURIComponent(rc.char)}`"
            class="rhyme-link"
          >
            {{ rc.char }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- 说明 -->
    <div class="tips">
      <h4>💡 关于平水韵</h4>
      <ul>
        <li>平水韵是宋代以后诗词创作的主要韵书</li>
        <li>分为平、上、去、入四声，共106韵</li>
        <li>点击韵脚字可查看完整的字形演变、释义等信息</li>
        <li>配置 API Key 后可自动查询未收录字的韵部</li>
      </ul>
    </div>
    <div class="footer-actions">
      <ToolFeedback tool-name="押韵检测" />
    </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body { @apply max-w-3xl mx-auto space-y-6; }

.api-hint { @apply bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-center gap-3 flex-wrap; }
.api-hint a { @apply text-blue-600 underline; }
.api-input { @apply px-3 py-1 border border-blue-300 rounded text-sm w-48; }

.content-body { @apply space-y-6; }
.input-section { @apply bg-white rounded-xl border border-stone-200 p-4; }
.section-header { @apply flex justify-between items-center mb-3 flex-wrap gap-2; }
.section-header h3 { @apply font-medium text-stone-800; }
.example-btns { @apply flex gap-2; }
.example-btn { @apply px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded; }
.text-input { @apply w-full px-3 py-2 border border-stone-200 rounded-lg text-lg focus:border-amber-400 focus:outline-none resize-none leading-loose; }
.actions { @apply flex gap-4 mt-4; }
.btn-primary { @apply px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed; }
.btn-text { @apply px-4 py-2 text-stone-500 hover:text-stone-700; }

.result-section { @apply bg-white rounded-xl border border-stone-200 p-4; }
.result-header { @apply flex justify-between items-center mb-4 pb-3 border-b border-stone-100; }
.result-header h3 { @apply font-medium text-stone-800; }
.result-badge { @apply px-3 py-1 rounded-full text-sm; }
.result-badge.valid { @apply bg-green-100 text-green-700; }
.result-badge.invalid { @apply bg-yellow-100 text-yellow-700; }

.rhyme-analysis { @apply space-y-4; }
.rhyme-header { @apply flex items-center gap-4; }
.rhyme-group { @apply text-lg font-medium text-amber-600; }
.lines-list { @apply space-y-2; }
.line-item { @apply flex items-center gap-3 p-2 bg-stone-50 rounded-lg; }
.line-num { @apply w-6 h-6 flex items-center justify-center bg-stone-200 rounded-full text-xs text-stone-600; }
.line-text { @apply flex-1 text-lg; }
.line-rhyme { @apply relative flex flex-col items-center px-3 py-1 bg-amber-100 rounded text-amber-800 cursor-pointer hover:bg-amber-200; }
.line-rhyme.match { @apply bg-green-100 text-green-800 hover:bg-green-200; }
.line-rhyme.unknown { @apply bg-stone-200 text-stone-600; }
.line-rhyme.ai { @apply ring-2 ring-blue-300; }
.line-rhyme small { @apply text-xs opacity-70; }
.ai-badge { @apply absolute -top-1 -right-1 text-[10px] bg-blue-500 text-white px-1 rounded; }

.issues-list { @apply mt-4 p-3 bg-yellow-50 rounded-lg; }
.issues-list h4 { @apply font-medium text-yellow-800 mb-2; }
.issues-list ul { @apply list-disc list-inside text-sm text-yellow-700 space-y-1; }

.rhyme-links { @apply mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 flex-wrap; }
.link-label { @apply text-xs text-stone-400; }
.rhyme-link { @apply px-2 py-1 bg-stone-100 rounded text-stone-700 hover:bg-amber-100 hover:text-amber-700; }

.tips { @apply bg-amber-50 rounded-lg p-4 text-sm text-amber-900 mt-6; }
.tips h4 { @apply font-medium mb-2; }
.tips ul { @apply list-disc list-inside space-y-1 text-amber-800; }
</style>
