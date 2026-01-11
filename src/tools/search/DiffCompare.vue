<script setup lang="ts">
/**
 * 版本对比工具
 * 对比两个版本的文本差异
 */
import { ref, computed } from 'vue'
import RelatedTools from '@/components/common/RelatedTools.vue'

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
  <div class="tool-page">
    <header class="tool-header">
      <h1 class="tool-title">版本对比</h1>
      <p class="tool-desc">对比两个版本的文本差异，高亮显示增删改</p>
    </header>

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
.input-section {
  @apply flex gap-4 mb-6;
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
