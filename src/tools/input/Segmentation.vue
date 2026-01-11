<script setup lang="ts">
/**
 * 古汉语分词工具
 * SEO 优化版本
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'
import { useQuota } from '@core/composables/useQuota'

// 配额检查
const { canPerform, consume } = useQuota('segmentation', '古汉语分词')

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '古汉语分词',
  path: '/input/segmentation',
  category: '输入处理',
  categoryPath: '/input',
  
  description: '免费在线古汉语分词工具。文言文自动分词和词性标注，支持AI智能分词，显示词性和释义，点击单字可查看字形详情。',
  keywords: ['古汉语分词', '文言文分词', '词性标注', 'AI分词', '古文分析', '词义解释'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '文言文自动分词 + 词性标注，支持 AI 智能分词',
  
  features: [
    '自动分词并标注词性',
    '显示每个词的古文释义',
    '支持AI智能分词（更准确）',
    '词性颜色区分，一目了然',
    '点击单字可查看字形详情',
    '内置常用古文词汇库',
    '一键复制分词结果',
    '本地缓存AI分词结果'
  ],
  
  howToUse: [
    '在输入框中粘贴或输入古文文本',
    '选择是否启用AI智能分词',
    '点击「开始分词」进行分析',
    '查看分词结果和词性标注',
    '点击单字可跳转查看字形详情'
  ],
  
  introduction: `理解文言文的第一步是正确分词。与现代汉语不同，古汉语的词汇边界往往不明确，同一个字在不同语境下可能是独立的词，也可能是词的一部分。本工具可以自动对文言文进行分词，并标注每个词的词性。

工具支持两种分词模式：本地分词使用内置的常用词汇库，速度快但对生僻词支持有限；AI智能分词通过DeepSeek API进行分析，准确率更高，还能提供每个词的古文释义。

分词结果使用不同颜色标注词性：名词（蓝色）、动词（绿色）、形容词（黄色）、副词（紫色）等，方便您快速理解句子结构。点击任意单字还可以跳转到字形详情页，查看该字的字形演变和详细释义。`,

  faq: [
    {
      question: '支持哪些词性标注？',
      answer: '支持名词、动词、形容词、副词、介词、连词、助词、代词、数词、量词等常见词性。'
    },
    {
      question: 'AI分词和本地分词有什么区别？',
      answer: 'AI分词准确率更高，能处理生僻词和复杂句式，还提供词义解释。本地分词速度快，但只能处理常用词。'
    },
    {
      question: 'AI功能需要付费吗？',
      answer: 'AI功能使用DeepSeek API，需要您自己的API Key。DeepSeek提供免费额度。'
    },
    {
      question: '词性颜色代表什么？',
      answer: '蓝色=名词，绿色=动词，黄色=形容词，紫色=副词，粉色=介词，橙色=连词，灰色=助词/标点。'
    },
    {
      question: '点击单字有什么功能？',
      answer: '点击任意单字可以跳转到字形详情页，查看该字的字形演变、释义等信息。'
    },
    {
      question: '分词结果可以复制吗？',
      answer: '可以。点击「复制分词结果」按钮可以复制用斜杠分隔的分词文本。'
    }
  ],
  
  isOffline: false,
  isFree: true
}

const router = useRouter()
const inputText = ref('')
const segmentedResult = ref<Array<{ word: string; pos: string; meaning?: string }>>([])
const processing = ref(false)
const showMeaning = ref(true)

// API Key
const apiKey = ref(localStorage.getItem('deepseek_api_key') || '')
const useAI = ref(true)

// 词性颜色映射
const posColors: Record<string, string> = {
  n: 'bg-blue-100 text-blue-700',
  v: 'bg-green-100 text-green-700',
  a: 'bg-yellow-100 text-yellow-700',
  d: 'bg-purple-100 text-purple-700',
  p: 'bg-pink-100 text-pink-700',
  c: 'bg-orange-100 text-orange-700',
  u: 'bg-gray-100 text-gray-700',
  r: 'bg-indigo-100 text-indigo-700',
  m: 'bg-red-100 text-red-700',
  q: 'bg-teal-100 text-teal-700',
  x: 'bg-stone-100 text-stone-600',
}

const posNames: Record<string, string> = {
  n: '名词', v: '动词', a: '形容词', d: '副词',
  p: '介词', c: '连词', u: '助词', r: '代词',
  m: '数词', q: '量词', x: '标点',
}

// 本地常用词数据
const commonWords: Record<string, { pos: string; meaning: string }> = {
  '子': { pos: 'n', meaning: '先生，对人的尊称' },
  '曰': { pos: 'v', meaning: '说' },
  '之': { pos: 'u', meaning: '的；代词' },
  '乎': { pos: 'u', meaning: '语气词' },
  '者': { pos: 'u', meaning: '……的人/事' },
  '也': { pos: 'u', meaning: '语气词，表判断' },
  '矣': { pos: 'u', meaning: '语气词，表完成' },
  '焉': { pos: 'u', meaning: '语气词；于此' },
  '哉': { pos: 'u', meaning: '语气词，表感叹' },
  '夫': { pos: 'u', meaning: '发语词；那' },
  '其': { pos: 'r', meaning: '他的；那' },
  '而': { pos: 'c', meaning: '并且；但是' },
  '则': { pos: 'c', meaning: '就；那么' },
  '以': { pos: 'p', meaning: '用；因为' },
  '于': { pos: 'p', meaning: '在；对于' },
  '为': { pos: 'v', meaning: '做；是' },
  '与': { pos: 'c', meaning: '和；给' },
  '不': { pos: 'd', meaning: '不' },
  '无': { pos: 'v', meaning: '没有' },
  '有': { pos: 'v', meaning: '有' },
  '是': { pos: 'r', meaning: '这' },
  '此': { pos: 'r', meaning: '这' },
  '彼': { pos: 'r', meaning: '那' },
  '何': { pos: 'r', meaning: '什么' },
  '谁': { pos: 'r', meaning: '谁' },
  '吾': { pos: 'r', meaning: '我' },
  '我': { pos: 'r', meaning: '我' },
  '汝': { pos: 'r', meaning: '你' },
  '尔': { pos: 'r', meaning: '你' },
  '君': { pos: 'n', meaning: '君主；您' },
  '臣': { pos: 'n', meaning: '臣子' },
  '人': { pos: 'n', meaning: '人' },
  '民': { pos: 'n', meaning: '百姓' },
  '天': { pos: 'n', meaning: '天；上天' },
  '地': { pos: 'n', meaning: '地' },
  '道': { pos: 'n', meaning: '道理；道路' },
  '德': { pos: 'n', meaning: '品德' },
  '仁': { pos: 'n', meaning: '仁爱' },
  '义': { pos: 'n', meaning: '正义' },
  '礼': { pos: 'n', meaning: '礼仪' },
  '智': { pos: 'n', meaning: '智慧' },
  '信': { pos: 'n', meaning: '诚信' },
  '善': { pos: 'a', meaning: '好的' },
  '恶': { pos: 'a', meaning: '坏的' },
  '大': { pos: 'a', meaning: '大' },
  '小': { pos: 'a', meaning: '小' },
  '上': { pos: 'n', meaning: '上面' },
  '下': { pos: 'n', meaning: '下面' },
  '中': { pos: 'n', meaning: '中间' },
  '可': { pos: 'v', meaning: '可以' },
  '能': { pos: 'v', meaning: '能够' },
  '欲': { pos: 'v', meaning: '想要' },
  '知': { pos: 'v', meaning: '知道' },
  '见': { pos: 'v', meaning: '看见' },
  '闻': { pos: 'v', meaning: '听到' },
  '言': { pos: 'v', meaning: '说' },
  '行': { pos: 'v', meaning: '行走；做' },
  '来': { pos: 'v', meaning: '来' },
  '去': { pos: 'v', meaning: '去' },
  '生': { pos: 'v', meaning: '生；活' },
  '死': { pos: 'v', meaning: '死' },
  '一': { pos: 'm', meaning: '一' },
  '二': { pos: 'm', meaning: '二' },
  '三': { pos: 'm', meaning: '三' },
  '十': { pos: 'm', meaning: '十' },
  '百': { pos: 'm', meaning: '百' },
  '千': { pos: 'm', meaning: '千' },
  '万': { pos: 'm', meaning: '万' },
}

// 本地分词
function segmentLocal(text: string): Array<{ word: string; pos: string; meaning?: string }> {
  const punctuation = '\uFF0C\u3002\uFF01\uFF1F\uFF1B\uFF1A\u3001\u201C\u201D\u2018\u2019\uFF08\uFF09\u300A\u300B\u3010\u3011'
  const result: Array<{ word: string; pos: string; meaning?: string }> = []
  
  let i = 0
  while (i < text.length) {
    const char = text[i]
    
    if (punctuation.includes(char)) {
      result.push({ word: char, pos: 'x' })
      i++
      continue
    }
    
    if (i + 1 < text.length) {
      const twoChar = text.slice(i, i + 2)
      if (commonWords[twoChar]) {
        result.push({ word: twoChar, ...commonWords[twoChar] })
        i += 2
        continue
      }
    }
    
    if (commonWords[char]) {
      result.push({ word: char, ...commonWords[char] })
    } else {
      result.push({ word: char, pos: 'n', meaning: '' })
    }
    i++
  }
  
  return result
}

// AI 分词
async function segmentWithAI(text: string): Promise<Array<{ word: string; pos: string; meaning?: string }>> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.value}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是古汉语分词专家。对文言文进行分词和词性标注。
词性代码：n名词 v动词 a形容词 d副词 p介词 c连词 u助词 r代词 m数词 q量词 x标点
返回JSON数组，不要其他文字。`
        },
        {
          role: 'user',
          content: `对以下文言文分词并标注词性和释义：
"${text}"

返回格式：[{"word":"词","pos":"词性代码","meaning":"古文释义"}]`
        }
      ],
      temperature: 0.2,
      max_tokens: 3000
    })
  })

  if (!response.ok) throw new Error('API error')
  
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(jsonStr)
}

async function doSegment() {
  if (!inputText.value.trim()) return
  
  // 配额检查
  const check = canPerform()
  if (!check.allowed) {
    alert(check.reason || '使用次数已达上限')
    return
  }
  
  processing.value = true
  
  // 消耗配额
  await consume(1)
  
  try {
    if (useAI.value && apiKey.value) {
      segmentedResult.value = await segmentWithAI(inputText.value)
      // 缓存结果
      localStorage.setItem(`guji_seg_${inputText.value.slice(0, 20)}`, JSON.stringify(segmentedResult.value))
    } else {
      segmentedResult.value = segmentLocal(inputText.value)
    }
  } catch (e) {
    console.error(e)
    // 降级到本地分词
    segmentedResult.value = segmentLocal(inputText.value)
  } finally {
    processing.value = false
  }
}

function saveApiKey() {
  localStorage.setItem('deepseek_api_key', apiKey.value)
  doSegment()
}

function goToCharDetail(word: string) {
  if (word.length === 1) {
    router.push(`/char/${encodeURIComponent(word)}`)
  }
}

function copyResult() {
  const text = segmentedResult.value.map(w => w.word).join(' / ')
  navigator.clipboard.writeText(text)
  alert('已复制到剪贴板')
}

function clearAll() {
  inputText.value = ''
  segmentedResult.value = []
}

const exampleTexts = [
  '子曰：学而时习之，不亦说乎？',
  '道可道，非常道。名可名，非常名。',
  '天下皆知美之为美，斯恶已。',
]

function useExample(text: string) {
  inputText.value = text
  doSegment()
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <!-- 设置 -->
    <div class="settings-section">
      <label class="checkbox">
        <input type="checkbox" v-model="useAI" />
        🤖 使用 AI 智能分词（更准确）
      </label>
    </div>

    <!-- API Key 输入 -->
    <div v-if="useAI && !apiKey" class="api-panel">
      <p>使用 AI 功能需要配置 DeepSeek API Key：</p>
      <input v-model="apiKey" type="password" placeholder="sk-..." class="api-input" />
      <button @click="saveApiKey" class="btn-primary">保存</button>
      <p class="hint"><a href="https://platform.deepseek.com/" target="_blank">获取 API Key</a></p>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <textarea v-model="inputText" placeholder="请输入古文文本..." rows="4"></textarea>
      
      <div class="examples">
        <span>示例：</span>
        <button v-for="(ex, i) in exampleTexts" :key="i" @click="useExample(ex)">
          {{ ex.slice(0, 10) }}...
        </button>
      </div>
      
      <div class="input-actions">
        <div class="actions-left">
          <button class="btn-primary" @click="doSegment" :disabled="processing || !inputText.trim()">
            {{ processing ? '分词中...' : '开始分词' }}
          </button>
          <button class="btn-secondary" @click="clearAll">清空</button>
        </div>
        <ToolFeedback tool-name="古汉语分词" />
      </div>
    </div>

    <!-- 结果区域 -->
    <div v-if="segmentedResult.length > 0" class="result-section">
      <div class="result-header">
        <h2>分词结果 <span class="hint">点击单字查看详情</span></h2>
        <label class="toggle">
          <input type="checkbox" v-model="showMeaning" />
          显示释义
        </label>
      </div>
      
      <!-- 词性图例 -->
      <div class="legend">
        <span v-for="(name, pos) in posNames" :key="pos" class="legend-item" :class="posColors[pos]">
          {{ name }}
        </span>
      </div>
      
      <!-- 分词结果 -->
      <div class="words-container">
        <div 
          v-for="(item, i) in segmentedResult" 
          :key="i"
          class="word-item"
          :class="[posColors[item.pos] || 'bg-stone-100', item.word.length === 1 ? 'clickable' : '']"
          @click="goToCharDetail(item.word)"
        >
          <span class="word">{{ item.word }}</span>
          <span v-if="showMeaning && item.meaning" class="meaning">{{ item.meaning }}</span>
        </div>
      </div>
      
      <button class="copy-btn" @click="copyResult">复制分词结果</button>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.settings-section {
  @apply bg-white rounded-xl p-4 mb-4;
}
.checkbox {
  @apply flex items-center gap-2 text-sm cursor-pointer;
}

.api-panel {
  @apply bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-center;
}
.api-input {
  @apply w-full max-w-md px-4 py-2 border border-stone-300 rounded-lg my-3;
}
.btn-primary {
  @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50;
}
.btn-secondary {
  @apply px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300;
}
.hint {
  @apply text-sm text-stone-500;
}
.hint a {
  @apply text-amber-600 hover:underline;
}

.input-section {
  @apply bg-white rounded-xl p-4 mb-4;
}
.input-section textarea {
  @apply w-full p-3 border border-stone-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none;
}

.examples {
  @apply flex flex-wrap gap-2 mt-3 text-sm;
}
.examples span {
  @apply text-stone-500;
}
.examples button {
  @apply px-2 py-1 bg-stone-100 rounded hover:bg-stone-200 text-stone-600;
}

.input-actions {
  @apply flex items-center justify-between mt-3;
}
.actions-left {
  @apply flex gap-2;
}

.result-section {
  @apply bg-white rounded-xl p-4;
}
.result-header {
  @apply flex justify-between items-center mb-3;
}
.result-header h2 {
  @apply font-medium text-stone-800;
}
.result-header h2 .hint {
  @apply text-xs text-stone-400 font-normal ml-2;
}
.toggle {
  @apply flex items-center gap-2 text-sm text-stone-600 cursor-pointer;
}

.legend {
  @apply flex flex-wrap gap-2 mb-4 pb-3 border-b border-stone-200;
}
.legend-item {
  @apply px-2 py-0.5 rounded text-xs;
}

.words-container {
  @apply flex flex-wrap gap-2 mb-4;
}
.word-item {
  @apply px-2 py-1 rounded-lg text-center;
}
.word-item.clickable {
  @apply cursor-pointer hover:ring-2 hover:ring-amber-400;
}
.word {
  @apply block text-lg;
}
.meaning {
  @apply block text-xs opacity-70 mt-0.5;
}

.copy-btn {
  @apply w-full py-2 border border-stone-300 rounded-lg hover:bg-stone-50;
}
</style>
