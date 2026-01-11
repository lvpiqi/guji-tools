<script setup lang="ts">
/**
 * 拼音注音
 * 为汉字添加拼音/注音标注，支持 AI 生成
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import RelatedTools from '@/components/common/RelatedTools.vue'

const router = useRouter()
const inputText = ref('')
const annotatedResult = ref<Array<{ char: string; pinyin: string; tone?: number }>>([])
const processing = ref(false)

// 注音模式
const mode = ref<'pinyin' | 'zhuyin' | 'cantonese'>('pinyin')
const showToneMarks = ref(true)
const rubyStyle = ref<'top' | 'inline'>('top')

// API Key
const apiKey = ref(localStorage.getItem('deepseek_api_key') || '')
const showApiKeyInput = ref(false)
const useAI = ref(true)

// 本地拼音数据
const localPinyinData: Record<string, { pinyin: string; tone: number; zhuyin: string; cantonese: string }> = {
  '子': { pinyin: 'zi', tone: 3, zhuyin: 'ㄗˇ', cantonese: 'zi2' },
  '曰': { pinyin: 'yue', tone: 1, zhuyin: 'ㄩㄝ', cantonese: 'jyut6' },
  '学': { pinyin: 'xue', tone: 2, zhuyin: 'ㄒㄩㄝˊ', cantonese: 'hok6' },
  '而': { pinyin: 'er', tone: 2, zhuyin: 'ㄦˊ', cantonese: 'ji4' },
  '时': { pinyin: 'shi', tone: 2, zhuyin: 'ㄕˊ', cantonese: 'si4' },
  '习': { pinyin: 'xi', tone: 2, zhuyin: 'ㄒㄧˊ', cantonese: 'zaap6' },
  '之': { pinyin: 'zhi', tone: 1, zhuyin: 'ㄓ', cantonese: 'zi1' },
  '不': { pinyin: 'bu', tone: 4, zhuyin: 'ㄅㄨˋ', cantonese: 'bat1' },
  '亦': { pinyin: 'yi', tone: 4, zhuyin: 'ㄧˋ', cantonese: 'jik6' },
  '说': { pinyin: 'yue', tone: 4, zhuyin: 'ㄩㄝˋ', cantonese: 'syut3' },
  '乎': { pinyin: 'hu', tone: 1, zhuyin: 'ㄏㄨ', cantonese: 'fu4' },
  '道': { pinyin: 'dao', tone: 4, zhuyin: 'ㄉㄠˋ', cantonese: 'dou6' },
  '可': { pinyin: 'ke', tone: 3, zhuyin: 'ㄎㄜˇ', cantonese: 'ho2' },
  '非': { pinyin: 'fei', tone: 1, zhuyin: 'ㄈㄟ', cantonese: 'fei1' },
  '常': { pinyin: 'chang', tone: 2, zhuyin: 'ㄔㄤˊ', cantonese: 'soeng4' },
  '名': { pinyin: 'ming', tone: 2, zhuyin: 'ㄇㄧㄥˊ', cantonese: 'ming4' },
  '天': { pinyin: 'tian', tone: 1, zhuyin: 'ㄊㄧㄢ', cantonese: 'tin1' },
  '下': { pinyin: 'xia', tone: 4, zhuyin: 'ㄒㄧㄚˋ', cantonese: 'haa6' },
  '人': { pinyin: 'ren', tone: 2, zhuyin: 'ㄖㄣˊ', cantonese: 'jan4' },
  '心': { pinyin: 'xin', tone: 1, zhuyin: 'ㄒㄧㄣ', cantonese: 'sam1' },
  '有': { pinyin: 'you', tone: 3, zhuyin: 'ㄧㄡˇ', cantonese: 'jau5' },
  '无': { pinyin: 'wu', tone: 2, zhuyin: 'ㄨˊ', cantonese: 'mou4' },
  '大': { pinyin: 'da', tone: 4, zhuyin: 'ㄉㄚˋ', cantonese: 'daai6' },
  '小': { pinyin: 'xiao', tone: 3, zhuyin: 'ㄒㄧㄠˇ', cantonese: 'siu2' },
  '上': { pinyin: 'shang', tone: 4, zhuyin: 'ㄕㄤˋ', cantonese: 'soeng6' },
  '中': { pinyin: 'zhong', tone: 1, zhuyin: 'ㄓㄨㄥ', cantonese: 'zung1' },
  '国': { pinyin: 'guo', tone: 2, zhuyin: 'ㄍㄨㄛˊ', cantonese: 'gwok3' },
  '文': { pinyin: 'wen', tone: 2, zhuyin: 'ㄨㄣˊ', cantonese: 'man4' },
  '古': { pinyin: 'gu', tone: 3, zhuyin: 'ㄍㄨˇ', cantonese: 'gu2' },
  '今': { pinyin: 'jin', tone: 1, zhuyin: 'ㄐㄧㄣ', cantonese: 'gam1' },
  '书': { pinyin: 'shu', tone: 1, zhuyin: 'ㄕㄨ', cantonese: 'syu1' },
  '言': { pinyin: 'yan', tone: 2, zhuyin: 'ㄧㄢˊ', cantonese: 'jin4' },
  '诗': { pinyin: 'shi', tone: 1, zhuyin: 'ㄕ', cantonese: 'si1' },
  '经': { pinyin: 'jing', tone: 1, zhuyin: 'ㄐㄧㄥ', cantonese: 'ging1' },
}

// 声调符号
const toneMarks: Record<number, string> = { 1: '\u0304', 2: '\u0301', 3: '\u030C', 4: '\u0300' }

function addToneMark(pinyin: string, tone: number): string {
  if (!showToneMarks.value || tone === 0) return pinyin
  const vowels = 'aeiou\u00FC'
  for (let i = pinyin.length - 1; i >= 0; i--) {
    if (vowels.includes(pinyin[i])) {
      return pinyin.slice(0, i + 1) + toneMarks[tone] + pinyin.slice(i + 1)
    }
  }
  return pinyin + tone
}

function getLocalAnnotation(char: string): string {
  const data = localPinyinData[char]
  if (!data) return ''
  switch (mode.value) {
    case 'pinyin': return showToneMarks.value ? addToneMark(data.pinyin, data.tone) : `${data.pinyin}${data.tone}`
    case 'zhuyin': return data.zhuyin
    case 'cantonese': return data.cantonese
    default: return data.pinyin
  }
}

// AI 生成拼音
async function generatePinyinWithAI(text: string): Promise<Record<string, { pinyin: string; tone: number; zhuyin: string; cantonese: string }>> {
  const chars = [...new Set(text.replace(/[\s\uFF0C\u3002\uFF01\uFF1F\uFF1B\uFF1A\u3001\u201C\u201D\u2018\u2019\uFF08\uFF09\u300A\u300B\u3010\u3011\n]/g, ''))]
  const unknownChars = chars.filter(c => !localPinyinData[c])
  
  if (unknownChars.length === 0) return {}
  
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
          content: '你是拼音注音专家。返回JSON格式，不要其他文字。'
        },
        {
          role: 'user',
          content: `为以下汉字提供拼音信息，返回JSON：
${unknownChars.join('')}

格式：{"字":{"pinyin":"拼音不带声调","tone":声调数字1-4,"zhuyin":"注音符号","cantonese":"粤语拼音"}}`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    })
  })

  if (!response.ok) throw new Error('API error')
  
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(jsonStr)
}

async function doAnnotate() {
  if (!inputText.value.trim()) return
  
  processing.value = true
  
  try {
    let pinyinData = { ...localPinyinData }
    
    // 使用 AI 补充未知字
    if (useAI.value && apiKey.value) {
      const aiData = await generatePinyinWithAI(inputText.value)
      pinyinData = { ...pinyinData, ...aiData }
      // 缓存 AI 生成的数据
      Object.entries(aiData).forEach(([char, data]) => {
        localStorage.setItem(`guji_pinyin_${char}`, JSON.stringify(data))
      })
    }
    
    const result: Array<{ char: string; pinyin: string; tone?: number }> = []
    const punctuation = '\uFF0C\u3002\uFF01\uFF1F\uFF1B\uFF1A\u3001\u201C\u201D\u2018\u2019\uFF08\uFF09\u300A\u300B\u3010\u3011\n '
    
    for (const char of inputText.value) {
      if (punctuation.includes(char)) {
        result.push({ char, pinyin: '' })
      } else {
        const data = pinyinData[char]
        if (data) {
          let pinyin = ''
          switch (mode.value) {
            case 'pinyin': pinyin = showToneMarks.value ? addToneMark(data.pinyin, data.tone) : `${data.pinyin}${data.tone}`; break
            case 'zhuyin': pinyin = data.zhuyin; break
            case 'cantonese': pinyin = data.cantonese; break
          }
          result.push({ char, pinyin, tone: data.tone })
        } else {
          result.push({ char, pinyin: '?', tone: 0 })
        }
      }
    }
    
    annotatedResult.value = result
  } catch (e) {
    console.error(e)
    alert('标注失败，请检查 API Key')
  } finally {
    processing.value = false
  }
}

function saveApiKey() {
  localStorage.setItem('deepseek_api_key', apiKey.value)
  showApiKeyInput.value = false
  doAnnotate()
}

function goToCharDetail(char: string) {
  router.push(`/char/${encodeURIComponent(char)}`)
}

function copyAsText() {
  const lines: string[] = []
  let currentLine = ''
  let currentPinyin = ''
  
  for (const item of annotatedResult.value) {
    if (item.char === '\n') {
      if (currentLine) {
        lines.push(currentPinyin.trim())
        lines.push(currentLine)
        lines.push('')
      }
      currentLine = ''
      currentPinyin = ''
    } else {
      currentLine += item.char
      currentPinyin += item.pinyin ? item.pinyin + ' ' : '  '
    }
  }
  
  if (currentLine) {
    lines.push(currentPinyin.trim())
    lines.push(currentLine)
  }
  
  navigator.clipboard.writeText(lines.join('\n'))
  alert('已复制到剪贴板')
}

function clearAll() {
  inputText.value = ''
  annotatedResult.value = []
}

const exampleTexts = [
  '子曰：学而时习之，不亦说乎？',
  '道可道，非常道。名可名，非常名。',
  '天下皆知美之为美，斯恶已。',
]

function useExample(text: string) {
  inputText.value = text
  doAnnotate()
}
</script>

<template>
  <div class="tool-page">
    <header class="tool-header">
      <h1>🔤 拼音注音</h1>
      <p>为古文添加拼音/注音/粤语标注，支持 AI 生成</p>
    </header>

    <!-- 设置区域 -->
    <div class="settings-section">
      <div class="setting-group">
        <label>注音模式</label>
        <div class="radio-group">
          <label><input type="radio" v-model="mode" value="pinyin" /> 拼音</label>
          <label><input type="radio" v-model="mode" value="zhuyin" /> 注音符号</label>
          <label><input type="radio" v-model="mode" value="cantonese" /> 粤语拼音</label>
        </div>
      </div>
      <div class="setting-group">
        <label>显示样式</label>
        <div class="radio-group">
          <label><input type="radio" v-model="rubyStyle" value="top" /> 上方标注</label>
          <label><input type="radio" v-model="rubyStyle" value="inline" /> 行内显示</label>
        </div>
      </div>
      <div class="setting-group" v-if="mode === 'pinyin'">
        <label class="checkbox">
          <input type="checkbox" v-model="showToneMarks" />
          显示声调符号
        </label>
      </div>
      <div class="setting-group">
        <label class="checkbox">
          <input type="checkbox" v-model="useAI" />
          🤖 使用 AI 补充生僻字
        </label>
      </div>
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
      <textarea v-model="inputText" placeholder="请输入需要标注的古文..." rows="4"></textarea>
      
      <div class="examples">
        <span>示例：</span>
        <button v-for="(ex, i) in exampleTexts" :key="i" @click="useExample(ex)">
          {{ ex.slice(0, 10) }}...
        </button>
      </div>
      
      <div class="input-actions">
        <button class="annotate-btn" @click="doAnnotate" :disabled="processing || !inputText.trim()">
          {{ processing ? '标注中...' : '开始标注' }}
        </button>
        <button class="clear-btn" @click="clearAll">清空</button>
      </div>
    </div>

    <!-- 结果区域 -->
    <div v-if="annotatedResult.length > 0" class="result-section">
      <h2>标注结果 <span class="hint">点击汉字查看详情</span></h2>
      
      <!-- Ruby 样式显示 -->
      <div v-if="rubyStyle === 'top'" class="ruby-result">
        <template v-for="(item, i) in annotatedResult" :key="i">
          <br v-if="item.char === '\n'" />
          <ruby v-else-if="item.pinyin" class="ruby-char" @click="goToCharDetail(item.char)">
            {{ item.char }}
            <rp>(</rp><rt>{{ item.pinyin }}</rt><rp>)</rp>
          </ruby>
          <span v-else class="plain-char">{{ item.char }}</span>
        </template>
      </div>
      
      <!-- 行内样式显示 -->
      <div v-else class="inline-result">
        <template v-for="(item, i) in annotatedResult" :key="i">
          <br v-if="item.char === '\n'" />
          <span v-else-if="item.pinyin" class="inline-char" @click="goToCharDetail(item.char)">
            {{ item.char }}<sub>{{ item.pinyin }}</sub>
          </span>
          <span v-else class="plain-char">{{ item.char }}</span>
        </template>
      </div>
      
      <button class="copy-btn" @click="copyAsText">复制结果</button>
    </div>

    <!-- 相关工具 -->
    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page { @apply max-w-4xl mx-auto; }
.tool-header { @apply mb-6; }
.tool-header h1 { @apply text-xl md:text-2xl font-bold text-stone-800; }
.tool-header p { @apply text-stone-500 mt-1; }

.settings-section { @apply bg-white rounded-xl p-4 mb-4 flex flex-wrap gap-6; }
.setting-group label:first-child { @apply block text-sm text-stone-600 mb-2; }
.radio-group { @apply flex flex-wrap gap-4; }
.radio-group label { @apply flex items-center gap-1 text-sm cursor-pointer; }
.checkbox { @apply flex items-center gap-2 text-sm cursor-pointer; }

.api-panel { @apply bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-center; }
.api-input { @apply w-full max-w-md px-4 py-2 border border-stone-300 rounded-lg my-3; }
.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }
.hint { @apply text-sm text-stone-500; }
.hint a { @apply text-amber-600 hover:underline; }

.input-section { @apply bg-white rounded-xl p-4 mb-4; }
.input-section textarea {
  @apply w-full p-3 border border-stone-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none;
}

.examples { @apply flex flex-wrap gap-2 mt-3 text-sm; }
.examples span { @apply text-stone-500; }
.examples button { @apply px-2 py-1 bg-stone-100 rounded hover:bg-stone-200 text-stone-600; }

.input-actions { @apply flex gap-2 mt-3; }
.annotate-btn { @apply flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50; }
.clear-btn { @apply px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50; }

.result-section { @apply bg-white rounded-xl p-4; }
.result-section h2 { @apply font-medium text-stone-800 mb-4; }
.result-section h2 .hint { @apply text-xs text-stone-400 font-normal ml-2; }

.ruby-result { @apply text-2xl leading-loose; }
.ruby-char { @apply inline-block cursor-pointer hover:bg-amber-50 rounded px-0.5; }
.ruby-char rt { @apply text-xs text-amber-600; }
.plain-char { @apply inline; }

.inline-result { @apply text-xl leading-relaxed; }
.inline-char { @apply inline-block mr-1 cursor-pointer hover:bg-amber-50 rounded px-0.5; }
.inline-char sub { @apply text-xs text-amber-600 ml-0.5; }

.copy-btn { @apply w-full mt-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50; }
</style>
