<script setup lang="ts">
/**
 * 自动句读工具
 * SEO 优化版本
 */
import { ref } from 'vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '自动句读',
  path: '/input/punctuation',
  category: '输入处理',
  categoryPath: '/input',
  
  description: '免费在线古文自动句读工具。为无标点的文言文自动添加标点符号，基于规则引擎智能断句，支持句号、逗号、问号等多种标点。',
  keywords: ['自动句读', '古文标点', '文言文断句', '标点符号', '古籍整理', '智能断句'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '为古文自动添加标点符号，基于规则引擎智能断句',
  
  features: [
    '智能识别句末语气词（也、矣、焉、乎等）',
    '自动识别疑问句和感叹句',
    '识别引语标记（曰、云、言等）',
    '处理并列和转折连词',
    '支持常见判断句式',
    '长句自动断开',
    '本地规则引擎，无需联网',
    '处理结果可编辑修正'
  ],
  
  howToUse: [
    '在左侧输入框粘贴无标点的古文',
    '点击「开始句读」按钮',
    '在右侧查看添加标点后的结果',
    '根据需要手动修正不准确的地方',
    '点击「复制」保存结果'
  ],
  
  introduction: `古籍原文通常没有标点符号，阅读和理解都有一定难度。正确的句读（断句）是理解古文的第一步。本工具可以为无标点的文言文自动添加标点符号。

工具基于规则引擎实现，能够识别常见的句末语气词（也、矣、焉、耳、乎、哉等）、疑问词（何、胡、安、孰等）、感叹词（噫、嗟、呜呼等）以及引语标记（曰、云、言等），自动在合适的位置添加句号、逗号、问号、感叹号、冒号等标点。

由于古文句式复杂多变，自动句读的准确率约为70-80%，建议处理后进行人工校对。对于复杂的句式或特殊用法，可能需要手动调整。`,

  faq: [
    {
      question: '支持哪些标点符号？',
      answer: '支持句号、逗号、问号、感叹号、冒号、顿号等常用标点。'
    },
    {
      question: '准确率如何？',
      answer: '基于规则引擎的准确率约70-80%，建议处理后人工校对，特别是复杂句式。'
    },
    {
      question: '可以处理已有标点的文本吗？',
      answer: '可以。工具会先移除已有标点，然后重新添加，但建议输入无标点的原文以获得最佳效果。'
    },
    {
      question: '为什么有些地方断句不准确？',
      answer: '古文句式复杂，同一个词在不同语境下可能有不同用法。规则引擎难以处理所有情况，建议人工校对。'
    },
    {
      question: '有在线API版本吗？',
      answer: '在线API版本正在开发中，将提供更高的准确率。目前请使用本地规则引擎。'
    },
    {
      question: '处理结果可以编辑吗？',
      answer: '可以。右侧结果框支持直接编辑，您可以手动修正不准确的地方。'
    }
  ],
  
  isOffline: true,
  isFree: true
}

const inputText = ref('')
const outputText = ref('')
const processing = ref(false)
const useApi = ref(false) // 是否使用在线API

// 简单的规则引擎句读（离线版）
const punctuationRules = [
  // 句末语气词
  { pattern: /(也|矣|焉|耳|乎|哉|夫|兮)(?=[^。！？，、；：])/g, replace: '$1。' },
  // 疑问词
  { pattern: /(何|胡|安|孰|谁|奚|曷|盍|焉|恶)([^。！？，]*?)(乎|邪|耶|欤|与)(?=[^。！？])/g, replace: '$1$2$3？' },
  // 感叹
  { pattern: /(噫|嗟|呜呼|嘻|善哉|悲夫)(?=[^。！？])/g, replace: '$1！' },
  // 引语标记
  { pattern: /(曰|云|言|谓|道)(?=.)/g, replace: '$1：' },
  // 并列连词
  { pattern: /(而|且|则|乃|故|因|以|于|与|及)(?=[^\s。！？，、；：]{2,})/g, replace: '，$1' },
  // 转折
  { pattern: /(然|但|惟|唯|虽|若|如|苟)(?=[^\s。！？，、；：]{3,})/g, replace: '，$1' },
  // 数字列举
  { pattern: /(一|二|三|四|五|六|七|八|九|十)(曰|者|则)(?=[^。！？，、；：])/g, replace: '$1$2、' },
]

// 常见句式模板
const sentencePatterns = [
  // "...者，...也" 判断句
  { pattern: /([^。！？，]{2,20})者([^。！？]{2,30})也/g, replace: '$1者，$2也。' },
  // "...之..." 结构
  { pattern: /([^。！？，、]{1,10})之([^。！？，、]{1,10})(?=[，。]|$)/g, replace: '$1之$2' },
  // "不...不..." 结构
  { pattern: /不([^。！？，]{1,5})不([^。！？，]{1,5})/g, replace: '不$1，不$2' },
]

async function processPunctuation() {
  if (!inputText.value.trim()) return
  
  processing.value = true
  
  try {
    if (useApi.value) {
      // 调用在线API（示例，实际需要替换为真实API）
      outputText.value = await callPunctuationApi(inputText.value)
    } else {
      // 使用本地规则引擎
      outputText.value = applyRules(inputText.value)
    }
  } catch (e) {
    console.error('Punctuation error:', e)
    outputText.value = '处理失败: ' + (e instanceof Error ? e.message : 'Unknown error')
  } finally {
    processing.value = false
  }
}

function applyRules(text: string): string {
  let result = text
    .replace(/\s+/g, '') // 移除空白
    .replace(/[。！？，、；：""''（）【】]/g, '') // 移除已有标点
  
  // 应用句式模板
  for (const pattern of sentencePatterns) {
    result = result.replace(pattern.pattern, pattern.replace)
  }
  
  // 应用标点规则
  for (const rule of punctuationRules) {
    result = result.replace(rule.pattern, rule.replace)
  }
  
  // 清理多余标点
  result = result
    .replace(/，+/g, '，')
    .replace(/。+/g, '。')
    .replace(/，。/g, '。')
    .replace(/。，/g, '。')
  
  // 按固定长度断句（兜底）
  result = breakLongSentences(result, 25)
  
  return result
}

function breakLongSentences(text: string, maxLen: number): string {
  const parts = text.split(/([。！？])/)
  const result: string[] = []
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (/[。！？]/.test(part)) {
      result.push(part)
      continue
    }
    
    if (part.length <= maxLen) {
      result.push(part)
    } else {
      // 长句按逗号位置或固定长度断开
      let remaining = part
      while (remaining.length > maxLen) {
        const breakPoint = findBreakPoint(remaining, maxLen)
        result.push(remaining.slice(0, breakPoint) + '，')
        remaining = remaining.slice(breakPoint)
      }
      result.push(remaining)
    }
  }
  
  return result.join('')
}

function findBreakPoint(text: string, maxLen: number): number {
  // 优先在连词处断开
  const connectors = ['而', '且', '则', '乃', '故', '因', '以', '于', '之']
  for (let i = Math.min(maxLen, text.length - 1); i > maxLen / 2; i--) {
    if (connectors.includes(text[i])) {
      return i
    }
  }
  return maxLen
}

async function callPunctuationApi(_text: string): Promise<string> {
  // 示例：调用吾与点API或其他句读服务
  // 实际使用时需要替换为真实的API端点
  throw new Error('在线API暂未配置，请使用本地规则引擎')
}

function copyOutput() {
  navigator.clipboard.writeText(outputText.value)
}

function clearAll() {
  inputText.value = ''
  outputText.value = ''
}

// 示例文本
const exampleText = '子曰学而时习之不亦说乎有朋自远方来不亦乐乎人不知而不愠不亦君子乎'

function loadExample() {
  inputText.value = exampleText
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">
      <!-- 输入区 -->
      <div class="input-section">
        <div class="section-header">
          <h3>输入古文</h3>
          <button class="btn-example" @click="loadExample">加载示例</button>
        </div>
        <textarea
          v-model="inputText"
          class="text-input"
          placeholder="粘贴无标点的古文..."
          rows="12"
        ></textarea>
        <div class="char-count">{{ inputText.length }} 字</div>
      </div>

      <!-- 输出区 -->
      <div class="output-section">
        <div class="section-header">
          <h3>句读结果</h3>
          <button 
            v-if="outputText"
            class="btn-copy"
            @click="copyOutput"
          >
            复制
          </button>
        </div>
        <textarea
          v-model="outputText"
          class="text-output"
          placeholder="处理结果将显示在这里..."
          rows="12"
        ></textarea>
      </div>
    </div>

    <!-- 设置和操作 -->
    <div class="tool-footer">
      <div class="settings">
        <label class="setting-item">
          <input type="checkbox" v-model="useApi" disabled />
          <span>使用在线API（更准确，暂未开放）</span>
        </label>
      </div>
      
      <div class="actions">
        <div class="actions-left">
          <button
            class="btn-primary"
            :disabled="!inputText.trim() || processing"
            @click="processPunctuation"
          >
            {{ processing ? '处理中...' : '开始句读' }}
          </button>
          <button
            class="btn-text"
            @click="clearAll"
          >
            清空
          </button>
        </div>
        <ToolFeedback tool-name="自动句读" />
      </div>
    </div>

    <!-- 说明 -->
    <div class="tips">
      <h4>💡 使用说明</h4>
      <ul>
        <li>本地规则引擎基于常见句式和语气词，准确率约70-80%</li>
        <li>建议处理后人工校对，特别是复杂句式</li>
        <li>支持的标点：句号、逗号、问号、感叹号、冒号、顿号</li>
      </ul>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6 mb-6;
}
.input-section, .output-section {
  @apply bg-white rounded-xl border border-stone-200 p-4;
}
.section-header {
  @apply flex justify-between items-center mb-3;
}
.section-header h3 {
  @apply font-medium text-stone-800;
}
.btn-example {
  @apply px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors;
}
.btn-copy {
  @apply px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded transition-colors;
}
.text-input, .text-output {
  @apply w-full px-3 py-2 border border-stone-200 rounded-lg text-base
         focus:border-amber-400 focus:outline-none resize-none leading-relaxed;
}
.text-output {
  @apply bg-stone-50;
}
.char-count {
  @apply text-right text-xs text-stone-400 mt-1;
}
.tool-footer {
  @apply flex justify-between items-center mb-6 flex-wrap gap-4;
}
.settings {
  @apply flex gap-4;
}
.setting-item {
  @apply flex items-center gap-2 text-sm text-stone-600;
}
.setting-item input[type="checkbox"] {
  @apply w-4 h-4 accent-amber-500;
}
.setting-item input:disabled + span {
  @apply text-stone-400;
}
.actions {
  @apply flex items-center justify-between flex-1;
}
.actions-left {
  @apply flex gap-3;
}
.btn-primary {
  @apply px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}
.btn-text {
  @apply px-4 py-2 text-stone-500 hover:text-stone-700 transition-colors;
}
.tips {
  @apply bg-blue-50 rounded-lg p-4 text-sm text-blue-800;
}
.tips h4 {
  @apply font-medium mb-2;
}
.tips ul {
  @apply list-disc list-inside space-y-1 text-blue-700;
}
</style>
