<script setup lang="ts">
/**
 * 繁简转换工具
 * SEO 优化版本
 */
import { ref, onMounted } from 'vue'
import * as OpenCC from 'opencc-js'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '繁简转换',
  path: '/input/traditional-simplified',
  category: '输入处理',
  categoryPath: '/input',
  
  description: '免费在线繁简体转换工具。高质量繁简体中文转换，支持台湾正体、香港繁体等多种标准，基于OpenCC开源项目。',
  keywords: ['繁简转换', '繁体转简体', '简体转繁体', 'OpenCC', '台湾正体', '香港繁体', '中文转换'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '高质量繁简体转换，支持台湾正体、香港繁体等多种标准',
  
  features: [
    '繁体 → 简体转换',
    '简体 → 繁体转换',
    '支持台湾正体标准',
    '支持香港繁体标准',
    '基于OpenCC高质量转换',
    '一键交换输入输出',
    '显示字符变化分析',
    '本地处理，无需联网'
  ],
  
  howToUse: [
    '选择转换模式（繁→简、简→繁等）',
    '在左侧输入框粘贴或输入文本',
    '点击「转换」按钮进行转换',
    '在右侧查看转换结果',
    '点击「分析变化」查看具体字符变化'
  ],
  
  introduction: `繁体中文和简体中文之间的转换看似简单，实际上涉及很多细节。不同地区使用的繁体标准也有差异，如台湾正体和香港繁体在某些字的写法上就有所不同。

本工具基于 OpenCC（Open Chinese Convert）开源项目，提供高质量的繁简转换。支持六种转换模式：繁体→简体、简体→繁体、繁体→台湾正体、繁体→香港繁体、简体→台湾正体、简体→香港繁体。

转换完成后，您还可以点击「分析变化」按钮，查看具体哪些字符发生了变化，方便您了解繁简体之间的对应关系。所有转换都在浏览器本地完成，无需联网。`,

  faq: [
    {
      question: '繁体、台湾正体、香港繁体有什么区别？',
      answer: '它们都是繁体字，但在某些字的写法上有差异。如"裡/裏"、"著/着"等，不同地区有不同的习惯用法。'
    },
    {
      question: '转换准确率如何？',
      answer: '基于OpenCC的转换准确率非常高，能正确处理一对多的字符映射（如简体"发"对应繁体"發/髮"）。'
    },
    {
      question: '可以转换整篇文章吗？',
      answer: '可以。工具没有字数限制，可以转换任意长度的文本。'
    },
    {
      question: '转换后格式会变化吗？',
      answer: '不会。工具只转换文字，保留原有的换行、空格等格式。'
    },
    {
      question: '需要联网吗？',
      answer: '首次加载需要下载转换库（约几百KB），之后可以离线使用。'
    },
    {
      question: '「分析变化」功能是什么？',
      answer: '点击后会显示转换前后发生变化的字符对照表，方便您了解具体哪些字被转换了。'
    }
  ],
  
  isOffline: true,
  isFree: true
}

const inputText = ref('')
const outputText = ref('')
const processing = ref(false)

// 转换模式
const conversionMode = ref<string>('t2s')
const conversionModes = [
  { value: 't2s', label: '繁体 → 简体', from: 'tw', to: 'cn' },
  { value: 's2t', label: '简体 → 繁体', from: 'cn', to: 'tw' },
  { value: 't2tw', label: '繁体 → 台湾正体', from: 'cn', to: 'twp' },
  { value: 't2hk', label: '繁体 → 香港繁体', from: 'cn', to: 'hk' },
  { value: 's2tw', label: '简体 → 台湾正体', from: 'cn', to: 'twp' },
  { value: 's2hk', label: '简体 → 香港繁体', from: 'cn', to: 'hk' },
]

// 转换器缓存
const converters = new Map<string, (text: string) => string>()

onMounted(() => {
  // 预加载常用转换器
  getConverter('t2s')
  getConverter('s2t')
})

function getConverter(mode: string): (text: string) => string {
  if (converters.has(mode)) {
    return converters.get(mode)!
  }
  
  const config = conversionModes.find(m => m.value === mode)
  if (!config) {
    throw new Error('Unknown conversion mode')
  }
  
  const converter = OpenCC.Converter({ from: config.from, to: config.to })
  converters.set(mode, converter)
  return converter
}

async function convert() {
  if (!inputText.value.trim()) return
  
  processing.value = true
  
  try {
    const converter = getConverter(conversionMode.value)
    outputText.value = converter(inputText.value)
  } catch (e) {
    console.error('Conversion error:', e)
    outputText.value = '转换失败: ' + (e instanceof Error ? e.message : 'Unknown error')
  } finally {
    processing.value = false
  }
}

function swapTexts() {
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
  
  // 切换转换方向
  if (conversionMode.value === 't2s') {
    conversionMode.value = 's2t'
  } else if (conversionMode.value === 's2t') {
    conversionMode.value = 't2s'
  }
}

function copyOutput() {
  navigator.clipboard.writeText(outputText.value)
}

function clearAll() {
  inputText.value = ''
  outputText.value = ''
}

// 示例文本
const exampleTraditional = '學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？'
const exampleSimplified = '学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？'

function loadExample() {
  if (conversionMode.value.startsWith('t')) {
    inputText.value = exampleTraditional
  } else {
    inputText.value = exampleSimplified
  }
}

// 统计字符变化
const changedChars = ref<Array<{ from: string; to: string }>>([])

function analyzeChanges() {
  if (!inputText.value || !outputText.value) return
  
  const changes: Array<{ from: string; to: string }> = []
  const seen = new Set<string>()
  
  for (let i = 0; i < inputText.value.length; i++) {
    const from = inputText.value[i]
    const to = outputText.value[i]
    if (from !== to && !seen.has(from)) {
      changes.push({ from, to })
      seen.add(from)
    }
  }
  
  changedChars.value = changes
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <!-- 转换模式选择 -->
    <div class="mode-selector">
      <label 
        v-for="mode in conversionModes" 
        :key="mode.value"
        class="mode-option"
        :class="{ active: conversionMode === mode.value }"
      >
        <input 
          type="radio" 
          v-model="conversionMode" 
          :value="mode.value"
          class="hidden"
        />
        {{ mode.label }}
      </label>
    </div>

    <div class="tool-body">
      <!-- 输入区 -->
      <div class="text-section">
        <div class="section-header">
          <h3>输入文本</h3>
          <button class="btn-example" @click="loadExample">加载示例</button>
        </div>
        <textarea
          v-model="inputText"
          class="text-area"
          placeholder="输入要转换的文本..."
          rows="10"
        ></textarea>
        <div class="char-count">{{ inputText.length }} 字</div>
      </div>

      <!-- 中间操作 -->
      <div class="middle-actions">
        <button
          class="btn-convert"
          :disabled="!inputText.trim() || processing"
          @click="convert"
        >
          {{ processing ? '...' : '转换 →' }}
        </button>
        <button
          class="btn-swap"
          :disabled="!outputText"
          @click="swapTexts"
          title="交换输入输出"
        >
          ⇄
        </button>
      </div>

      <!-- 输出区 -->
      <div class="text-section">
        <div class="section-header">
          <h3>转换结果</h3>
          <div class="header-actions">
            <button 
              v-if="outputText"
              class="btn-analyze"
              @click="analyzeChanges"
            >
              分析变化
            </button>
            <button 
              v-if="outputText"
              class="btn-copy"
              @click="copyOutput"
            >
              复制
            </button>
          </div>
        </div>
        <textarea
          v-model="outputText"
          class="text-area output"
          placeholder="转换结果将显示在这里..."
          rows="10"
          readonly
        ></textarea>
      </div>
    </div>

    <!-- 变化分析 -->
    <div v-if="changedChars.length" class="changes-panel">
      <h4>字符变化 ({{ changedChars.length }} 处)</h4>
      <div class="changes-list">
        <span 
          v-for="(change, i) in changedChars" 
          :key="i"
          class="change-item"
        >
          {{ change.from }} → {{ change.to }}
        </span>
      </div>
    </div>

    <!-- 清空按钮 -->
    <div class="footer-actions">
      <div class="actions-left">
        <button class="btn-text" @click="clearAll">清空全部</button>
      </div>
      <ToolFeedback tool-name="繁简转换" />
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.mode-selector {
  @apply flex flex-wrap gap-2 mb-6;
}
.mode-option {
  @apply px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm cursor-pointer
         hover:border-amber-400 transition-colors;
}
.mode-option.active {
  @apply bg-amber-500 text-white border-amber-500;
}
.tool-body {
  @apply flex gap-4 items-start mb-6;
}
.text-section {
  @apply flex-1 bg-white rounded-xl border border-stone-200 p-4;
}
.section-header {
  @apply flex justify-between items-center mb-3;
}
.section-header h3 {
  @apply font-medium text-stone-800;
}
.header-actions {
  @apply flex gap-2;
}
.btn-example {
  @apply px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors;
}
.btn-copy, .btn-analyze {
  @apply px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded transition-colors;
}
.text-area {
  @apply w-full px-3 py-2 border border-stone-200 rounded-lg text-base
         focus:border-amber-400 focus:outline-none resize-none leading-relaxed;
}
.text-area.output {
  @apply bg-stone-50;
}
.char-count {
  @apply text-right text-xs text-stone-400 mt-1;
}
.middle-actions {
  @apply flex flex-col gap-2 py-8;
}
.btn-convert {
  @apply px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 
         disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium;
}
.btn-swap {
  @apply px-4 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200
         disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xl;
}
.changes-panel {
  @apply bg-blue-50 rounded-lg p-4 mb-6;
}
.changes-panel h4 {
  @apply font-medium text-blue-800 mb-2;
}
.changes-list {
  @apply flex flex-wrap gap-2;
}
.change-item {
  @apply px-2 py-1 bg-white rounded text-sm text-blue-700 border border-blue-200;
}
.footer-actions {
  @apply flex items-center justify-between;
}
.actions-left {
  @apply flex gap-3;
}
.btn-text {
  @apply px-4 py-2 text-stone-500 hover:text-stone-700 transition-colors;
}
</style>
