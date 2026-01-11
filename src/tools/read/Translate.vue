<script setup lang="ts">
/**
 * 自动翻译工具
 * SEO 优化版本
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'
import { useQuota } from '@core/composables/useQuota'

// 配额检查
const { canPerform, consume } = useQuota('translate', '古文翻译')

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '古文翻译',
  path: '/read/translate',
  category: '阅读辅助',
  categoryPath: '/read',
  
  description: '免费在线古文翻译工具。使用AI将文言文翻译为现代汉语和英文，支持直译和意译两种风格。',
  keywords: ['古文翻译', '文言文翻译', '古文白话', '古籍翻译', 'AI翻译', '中英翻译'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '文言文翻译为现代汉语和英文',
  
  features: [
    '文言文转现代汉语',
    '现代汉语转英文',
    '支持直译风格',
    '支持意译风格',
    '可选翻译目标语言',
    '点击汉字查看释义',
    '一键复制翻译结果',
    '使用DeepSeek AI'
  ],
  
  howToUse: [
    '配置DeepSeek API Key',
    '输入要翻译的文言文',
    '选择翻译目标和风格',
    '点击「开始翻译」',
    '查看翻译结果，可复制使用'
  ],
  
  introduction: `阅读古籍时，将文言文翻译为现代汉语可以帮助理解文意。本工具使用AI进行翻译，支持翻译为现代汉语和英文。

直译风格尽量保持原文结构，逐字逐句翻译；意译风格则更注重表达原文的意思，语言更加流畅自然。

翻译结果中的汉字可以点击查看释义，方便深入理解每个字词的含义。`,

  faq: [
    {
      question: '翻译准确吗？',
      answer: 'AI翻译仅供参考，重要文献请以专业译本为准。'
    },
    {
      question: '直译和意译有什么区别？',
      answer: '直译保持原文结构，意译更注重流畅表达。古文建议先用直译理解，再看意译。'
    },
    {
      question: 'API Key如何获取？',
      answer: '访问 platform.deepseek.com 注册账号即可获取API Key。'
    },
    {
      question: '翻译有字数限制吗？',
      answer: '建议单次翻译不超过500字，过长的文本可能影响翻译质量。'
    },
    {
      question: '可以翻译诗词吗？',
      answer: '可以，但诗词的韵律和意境难以完全传达，翻译仅供理解大意。'
    }
  ],
  
  isOffline: false,
  isFree: true
}

const router = useRouter()
const inputText = ref('')
const modernChinese = ref('')
const english = ref('')
const processing = ref(false)
const targetLang = ref<'modern' | 'english' | 'both'>('both')
const style = ref<'literal' | 'free'>('literal')
const apiKey = ref(localStorage.getItem('deepseek_api_key') || '')

async function doTranslate() {
  if (!inputText.value.trim() || !apiKey.value) return
  
  // 配额检查
  const check = canPerform()
  if (!check.allowed) {
    alert(check.reason || '使用次数已达上限')
    return
  }
  
  processing.value = true
  modernChinese.value = ''
  english.value = ''
  
  // 消耗配额
  await consume(1)
  
  try {
    const styleDesc = style.value === 'literal' ? '\u76F4\u8BD1' : '\u610F\u8BD1'
    if (targetLang.value === 'modern' || targetLang.value === 'both') {
      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey.value}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: `\u53E4\u6587\u7FFB\u8BD1\u4E13\u5BB6\u3002${styleDesc}\u3002\u53EA\u8F93\u51FA\u8BD1\u6587\u3002` },
            { role: 'user', content: `\u7FFB\u8BD1\u4E3A\u73B0\u4EE3\u6C49\u8BED\uFF1A${inputText.value}` }
          ], temperature: 0.3
        })
      })
      modernChinese.value = (await resp.json()).choices?.[0]?.message?.content || ''
    }
    if (targetLang.value === 'english' || targetLang.value === 'both') {
      const src = modernChinese.value || inputText.value
      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey.value}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Translate to English. Output only.' },
            { role: 'user', content: src }
          ], temperature: 0.3
        })
      })
      english.value = (await resp.json()).choices?.[0]?.message?.content || ''
    }
  } catch { alert('\u7FFB\u8BD1\u5931\u8D25') }
  finally { processing.value = false }
}
function saveApiKey() { localStorage.setItem('deepseek_api_key', apiKey.value); doTranslate() }
function goToChar(c: string) { if (/[\u4e00-\u9fff]/.test(c)) router.push(`/char/${encodeURIComponent(c)}`) }
function copy(t: string) { navigator.clipboard.writeText(t); alert('\u5DF2\u590D\u5236') }
function clear() { inputText.value = ''; modernChinese.value = ''; english.value = '' }
const examples = ['\u5B50\u66F0\uFF1A\u5B66\u800C\u65F6\u4E60\u4E4B', '\u9053\u53EF\u9053\uFF0C\u975E\u5E38\u9053']
function useEx(t: string) { inputText.value = t; doTranslate() }
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">
      <div class="settings-section">
        <div class="setting-group">
          <label>翻译目标</label>
          <div class="radio-group">
            <label><input type="radio" v-model="targetLang" value="modern" /> 现代汉语</label>
            <label><input type="radio" v-model="targetLang" value="english" /> 英文</label>
            <label><input type="radio" v-model="targetLang" value="both" /> 两者都要</label>
          </div>
        </div>
        <div class="setting-group">
          <label>翻译风格</label>
          <div class="radio-group">
            <label><input type="radio" v-model="style" value="literal" /> 直译</label>
            <label><input type="radio" v-model="style" value="free" /> 意译</label>
          </div>
        </div>
      </div>
      <div v-if="!apiKey" class="api-panel">
        <p>需要配置 DeepSeek API Key：</p>
        <input v-model="apiKey" type="password" placeholder="sk-..." class="api-input" />
        <button @click="saveApiKey" class="btn-primary">保存</button>
      </div>
      <div class="input-section">
        <textarea v-model="inputText" placeholder="请输入文言文..." rows="4"></textarea>
        <div class="examples">
          <span>示例：</span>
          <button v-for="(ex, i) in examples" :key="i" @click="useEx(ex)">{{ ex }}</button>
        </div>
        <div class="input-actions">
          <button @click="doTranslate" :disabled="processing || !inputText.trim() || !apiKey" class="translate-btn">
            {{ processing ? '翻译中...' : '开始翻译' }}
          </button>
          <button @click="clear" class="clear-btn">清空</button>
          <ToolFeedback tool-name="古文翻译" />
        </div>
      </div>
      <div v-if="modernChinese || english" class="result-section">
        <div v-if="modernChinese" class="result-block">
          <div class="result-header"><h3>📖 现代汉语</h3><button @click="copy(modernChinese)">复制</button></div>
          <p class="result-text clickable"><span v-for="(c, i) in modernChinese" :key="i" @click="goToChar(c)">{{ c }}</span></p>
        </div>
        <div v-if="english" class="result-block">
          <div class="result-header"><h3>🌍 English</h3><button @click="copy(english)">复制</button></div>
          <p class="result-text">{{ english }}</p>
        </div>
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
.api-panel { @apply bg-amber-50 border border-amber-200 rounded-lg p-4 text-center; }
.api-input { @apply w-full max-w-md px-4 py-2 border border-stone-300 rounded-lg my-3; }
.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }
.input-section { @apply bg-white rounded-xl p-4; }
.input-section textarea { @apply w-full p-3 border border-stone-300 rounded-lg resize-none outline-none; }
.examples { @apply flex flex-wrap gap-2 mt-3 text-sm; }
.examples span { @apply text-stone-500; }
.examples button { @apply px-2 py-1 bg-stone-100 rounded hover:bg-stone-200; }
.input-actions { @apply flex gap-2 mt-3; }
.translate-btn { @apply flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50; }
.clear-btn { @apply px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50; }
.result-section { @apply space-y-4; }
.result-block { @apply bg-white rounded-xl p-4; }
.result-header { @apply flex justify-between items-center mb-3; }
.result-header h3 { @apply font-medium text-stone-800; }
.result-header button { @apply text-sm text-amber-600 hover:underline; }
.result-text { @apply text-stone-700 leading-relaxed; }
.result-text.clickable span { @apply cursor-pointer hover:bg-amber-50; }
</style>
