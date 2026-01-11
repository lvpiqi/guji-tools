<script setup lang="ts">
/**
 * 繁简转换工具
 * 使用 OpenCC 进行高质量繁简转换
 */
import { ref, onMounted } from 'vue'
import * as OpenCC from 'opencc-js'
import RelatedTools from '@/components/common/RelatedTools.vue'

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
  <div class="tool-page">
    <header class="tool-header">
      <h1 class="tool-title">繁简转换</h1>
      <p class="tool-desc">高质量繁简体转换，支持台湾正体、香港繁体等多种标准</p>
    </header>

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
      <button class="btn-text" @click="clearAll">清空全部</button>
    </div>

    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page {
  @apply max-w-5xl mx-auto;
}
.tool-header {
  @apply mb-6;
}
.tool-title {
  @apply text-2xl font-bold text-stone-800;
}
.tool-desc {
  @apply text-stone-600 mt-1;
}
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
  @apply w-full px-3 py-2 border border-stone-200 rounded-lg text-base font-guji
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
  @apply text-center;
}
.btn-text {
  @apply px-4 py-2 text-stone-500 hover:text-stone-700 transition-colors;
}
</style>
