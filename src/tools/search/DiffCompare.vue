<script setup lang="ts">
/**
 * 版本对比工具
 * SEO 优化版本
 */
import { ref, computed } from 'vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '版本对比',
  path: '/search/diff-compare',
  category: '检索校勘',
  categoryPath: '/search',
  
  description: '免费在线古籍版本对比工具。对比两个版本的文本差异，高亮显示增删改，支持并排和内联两种视图。',
  keywords: ['版本对比', '文本对比', '差异比较', '古籍校勘', '文字校对', '异文对比'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '对比两个版本的文本差异，高亮显示增删改',
  
  features: [
    '逐字对比文本差异',
    '高亮显示新增内容',
    '高亮显示删除内容',
    '高亮显示修改内容',
    '并排视图对比',
    '内联视图对比',
    '统计增删改数量',
    '支持交换两个版本'
  ],
  
  howToUse: [
    '在左侧输入第一个版本的文本',
    '在右侧输入第二个版本的文本',
    '点击「开始对比」进行比较',
    '查看高亮显示的差异',
    '可切换并排/内联视图'
  ],
  
  introduction: `古籍在流传过程中会产生不同版本，版本之间存在文字差异。本工具可以帮助快速对比两个版本的文本，找出差异之处。

工具使用最长公共子序列算法进行逐字对比，可以准确识别新增、删除和修改的内容。差异部分会用不同颜色高亮显示。

并排视图适合查看两个版本的整体差异，内联视图则更适合查看具体的修改位置。`,

  faq: [
    {
      question: '对比算法准确吗？',
      answer: '使用LCS（最长公共子序列）算法，可以准确识别大部分差异。'
    },
    {
      question: '可以对比多长的文本？',
      answer: '建议单次对比不超过1万字，过长的文本可能导致处理变慢。'
    },
    {
      question: '并排和内联视图有什么区别？',
      answer: '并排视图左右对照显示，内联视图在同一行显示差异。'
    },
    {
      question: '可以导出对比结果吗？',
      answer: '当前版本暂不支持导出，可以截图保存。'
    },
    {
      question: '支持繁简对比吗？',
      answer: '支持。繁简字会被识别为不同的字，显示为修改。'
    }
  ],
  
  isOffline: true,
  isFree: true
}

const textA = ref('')
const textB = ref('')
const labelA = ref('版本A')
const labelB = ref('版本B')

interface DiffSegment {
  type: 'equal' | 'insert' | 'delete' | 'replace'
  textA: string
  textB: string
}

const diffResult = ref<DiffSegment[]>([])
const showSideBySide = ref(true)

// 统计信息
const stats = computed(() => {
  let added = 0, deleted = 0, changed = 0
  for (const seg of diffResult.value) {
    if (seg.type === 'insert') added += seg.textB.length
    if (seg.type === 'delete') deleted += seg.textA.length
    if (seg.type === 'replace') changed += Math.max(seg.textA.length, seg.textB.length)
  }
  return { added, deleted, changed }
})

function compare() {
  if (!textA.value && !textB.value) return
  
  const a = textA.value
  const b = textB.value
  
  // 简单的逐字对比算法
  diffResult.value = computeDiff(a, b)
}

function computeDiff(a: string, b: string): DiffSegment[] {
  const result: DiffSegment[] = []
  
  // 使用最长公共子序列算法
  const lcs = longestCommonSubsequence(a, b)
  
  let i = 0, j = 0, k = 0
  
  while (i < a.length || j < b.length) {
    if (k < lcs.length && i < a.length && j < b.length && a[i] === lcs[k] && b[j] === lcs[k]) {
      // 相同部分
      let equalText = ''
      while (k < lcs.length && i < a.length && j < b.length && a[i] === lcs[k] && b[j] === lcs[k]) {
        equalText += a[i]
        i++
        j++
        k++
      }
      if (equalText) {
        result.push({ type: 'equal', textA: equalText, textB: equalText })
      }
    } else {
      // 不同部分
      let deleteText = ''
      let insertText = ''
      
      while (i < a.length && (k >= lcs.length || a[i] !== lcs[k])) {
        deleteText += a[i]
        i++
      }
      
      while (j < b.length && (k >= lcs.length || b[j] !== lcs[k])) {
        insertText += b[j]
        j++
      }
      
      if (deleteText && insertText) {
        result.push({ type: 'replace', textA: deleteText, textB: insertText })
      } else if (deleteText) {
        result.push({ type: 'delete', textA: deleteText, textB: '' })
      } else if (insertText) {
        result.push({ type: 'insert', textA: '', textB: insertText })
      }
    }
  }
  
  return result
}

function longestCommonSubsequence(a: string, b: string): string {
  const m = a.length
  const n = b.length
  
  // DP 表
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  
  // 回溯找出 LCS
  let lcs = ''
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs = a[i - 1] + lcs
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  
  return lcs
}

function swapTexts() {
  const temp = textA.value
  textA.value = textB.value
  textB.value = temp
  
  const tempLabel = labelA.value
  labelA.value = labelB.value
  labelB.value = tempLabel
  
  if (diffResult.value.length) {
    compare()
  }
}

function clearAll() {
  textA.value = ''
  textB.value = ''
  diffResult.value = []
}

// 示例文本
const exampleA = '子曰學而時習之不亦說乎有朋自遠方來不亦樂乎人不知而不愠不亦君子乎'
const exampleB = '子曰学而时习之不亦悦乎有朋自远方来不亦乐乎人不知而不愠不亦君子乎'

function loadExample() {
  textA.value = exampleA
  textB.value = exampleB
  labelA.value = '繁体版'
  labelB.value = '简体版'
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">

    <!-- 输入区 -->
    <div class="input-section">
      <div class="input-col">
        <div class="input-header">
          <input v-model="labelA" class="label-input" />
        </div>
        <textarea
          v-model="textA"
          class="text-input"
          placeholder="粘贴第一个版本的文本..."
          rows="8"
        ></textarea>
      </div>
      
      <div class="input-middle">
        <button class="swap-btn" @click="swapTexts" title="交换">⇄</button>
      </div>
      
      <div class="input-col">
        <div class="input-header">
          <input v-model="labelB" class="label-input" />
        </div>
        <textarea
          v-model="textB"
          class="text-input"
          placeholder="粘贴第二个版本的文本..."
          rows="8"
        ></textarea>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <button class="btn-example" @click="loadExample">加载示例</button>
      <button 
        class="btn-primary"
        :disabled="!textA && !textB"
        @click="compare"
      >
        开始对比
      </button>
      <button class="btn-text" @click="clearAll">清空</button>
      <ToolFeedback tool-name="版本对比" />
    </div>

    <!-- 对比结果 -->
    <div v-if="diffResult.length" class="result-section">
      <div class="result-header">
        <h3>对比结果</h3>
        <div class="result-stats">
          <span class="stat-item added">+{{ stats.added }}</span>
          <span class="stat-item deleted">-{{ stats.deleted }}</span>
          <span class="stat-item changed">~{{ stats.changed }}</span>
        </div>
        <div class="view-toggle">
          <button 
            :class="{ active: showSideBySide }"
            @click="showSideBySide = true"
          >
            并排
          </button>
          <button 
            :class="{ active: !showSideBySide }"
            @click="showSideBySide = false"
          >
            内联
          </button>
        </div>
      </div>

      <!-- 并排视图 -->
      <div v-if="showSideBySide" class="side-by-side">
        <div class="diff-col">
          <div class="diff-label">{{ labelA }}</div>
          <div class="diff-content">
            <template v-for="(seg, i) in diffResult" :key="i">
              <span v-if="seg.type === 'equal'" class="diff-equal">{{ seg.textA }}</span>
              <span v-else-if="seg.type === 'delete'" class="diff-delete">{{ seg.textA }}</span>
              <span v-else-if="seg.type === 'replace'" class="diff-delete">{{ seg.textA }}</span>
            </template>
          </div>
        </div>
        <div class="diff-col">
          <div class="diff-label">{{ labelB }}</div>
          <div class="diff-content">
            <template v-for="(seg, i) in diffResult" :key="i">
              <span v-if="seg.type === 'equal'" class="diff-equal">{{ seg.textB }}</span>
              <span v-else-if="seg.type === 'insert'" class="diff-insert">{{ seg.textB }}</span>
              <span v-else-if="seg.type === 'replace'" class="diff-insert">{{ seg.textB }}</span>
            </template>
          </div>
        </div>
      </div>

      <!-- 内联视图 -->
      <div v-else class="inline-view">
        <div class="diff-content">
          <template v-for="(seg, i) in diffResult" :key="i">
            <span v-if="seg.type === 'equal'" class="diff-equal">{{ seg.textA }}</span>
            <span v-else-if="seg.type === 'delete'" class="diff-delete">{{ seg.textA }}</span>
            <span v-else-if="seg.type === 'insert'" class="diff-insert">{{ seg.textB }}</span>
            <template v-else-if="seg.type === 'replace'">
              <span class="diff-delete">{{ seg.textA }}</span>
              <span class="diff-insert">{{ seg.textB }}</span>
            </template>
          </template>
        </div>
      </div>

      <!-- 图例 -->
      <div class="legend">
        <span class="legend-item"><span class="diff-delete">删除</span></span>
        <span class="legend-item"><span class="diff-insert">新增</span></span>
        <span class="legend-item"><span class="diff-equal">相同</span></span>
      </div>
    </div>

    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body {
  @apply max-w-5xl mx-auto space-y-6;
}
.input-section {
  @apply flex gap-4;
}
.input-col {
  @apply flex-1 bg-white rounded-xl border border-stone-200 p-4;
}
.input-middle {
  @apply flex items-center;
}
.swap-btn {
  @apply w-10 h-10 bg-stone-100 rounded-full text-xl hover:bg-stone-200 transition-colors;
}
.input-header {
  @apply mb-3;
}
.label-input {
  @apply w-full px-3 py-1 text-sm font-medium text-stone-700 bg-stone-50 
         border border-transparent rounded focus:border-amber-400 focus:outline-none;
}
.text-input {
  @apply w-full px-3 py-2 border border-stone-200 rounded-lg font-guji
         focus:border-amber-400 focus:outline-none resize-none;
}
.actions {
  @apply flex gap-4 justify-center mb-6;
}
.btn-example {
  @apply px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors;
}
.btn-primary {
  @apply px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600
         disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}
.btn-text {
  @apply px-4 py-2 text-stone-500 hover:text-stone-700 transition-colors;
}
.result-section {
  @apply bg-white rounded-xl border border-stone-200 p-6;
}
.result-header {
  @apply flex items-center gap-4 mb-4 pb-4 border-b border-stone-100;
}
.result-header h3 {
  @apply font-medium text-stone-800;
}
.result-stats {
  @apply flex gap-2 flex-1;
}
.stat-item {
  @apply px-2 py-0.5 text-sm rounded;
}
.stat-item.added {
  @apply bg-green-100 text-green-700;
}
.stat-item.deleted {
  @apply bg-red-100 text-red-700;
}
.stat-item.changed {
  @apply bg-yellow-100 text-yellow-700;
}
.view-toggle {
  @apply flex gap-1 bg-stone-100 rounded-lg p-1;
}
.view-toggle button {
  @apply px-3 py-1 text-sm rounded-md transition-colors;
}
.view-toggle button.active {
  @apply bg-white shadow-sm;
}
.side-by-side {
  @apply grid grid-cols-2 gap-4;
}
.diff-col {
  @apply space-y-2;
}
.diff-label {
  @apply text-sm font-medium text-stone-500;
}
.diff-content {
  @apply p-4 bg-stone-50 rounded-lg font-guji text-lg leading-loose min-h-[200px];
}
.inline-view .diff-content {
  @apply text-xl;
}
.diff-equal {
  @apply text-stone-800;
}
.diff-delete {
  @apply bg-red-200 text-red-800 px-0.5 rounded;
}
.diff-insert {
  @apply bg-green-200 text-green-800 px-0.5 rounded;
}
.legend {
  @apply flex gap-4 mt-4 pt-4 border-t border-stone-100 text-sm;
}
.legend-item {
  @apply flex items-center gap-1;
}
</style>
