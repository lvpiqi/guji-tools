<script setup lang="ts">
/**
 * 摘要详情页 - SEO友好的独立页面
 * 路由: /summary/:id
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

interface SummaryData {
  id: string
  originalText: string
  summary: string
  keywords: string[]
  themes: string[]
  translation?: string
  createdAt: string
  source?: string
}

const summaryData = ref<SummaryData | null>(null)
const loading = ref(true)
const relatedSummaries = ref<SummaryData[]>([])

onMounted(() => {
  loadSummary()
})

function loadSummary() {
  const id = route.params.id as string
  // 从 localStorage 加载摘要数据
  const stored = localStorage.getItem(`guji_summary_${id}`)
  if (stored) {
    summaryData.value = JSON.parse(stored)
  }
  // 加载相关摘要
  loadRelatedSummaries()
  loading.value = false
}

function loadRelatedSummaries() {
  const all: SummaryData[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('guji_summary_') && key !== `guji_summary_${route.params.id}`) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        if (data.id) all.push(data)
      } catch {}
    }
  }
  relatedSummaries.value = all.slice(0, 5)
}

function goToCharDetail(char: string) {
  if (/[\u4e00-\u9fff]/.test(char)) {
    router.push(`/char/${encodeURIComponent(char)}`)
  }
}

function goToSummary(id: string) {
  router.push(`/summary/${id}`)
}

function copyText(text: string) {
  navigator.clipboard.writeText(text)
  alert('\u5DF2\u590D\u5236')
}

// SEO: 页面标题
const pageTitle = computed(() => {
  if (!summaryData.value) return '\u6458\u8981\u8BE6\u60C5'
  return `${summaryData.value.originalText.slice(0, 20)}... - \u53E4\u7C4D\u6458\u8981`
})
</script>

<template>
  <div class="summary-detail-page">
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="!summaryData" class="not-found">
      <h1>摘要不存在</h1>
      <p>该摘要可能已被删除或链接无效</p>
      <router-link to="/pro/summary" class="back-link">返回摘要工具</router-link>
    </div>
    
    <template v-else>
      <!-- 原文 -->
      <section class="section original-section">
        <h1 class="section-title">📜 原文</h1>
        <p class="original-text">
          <span v-for="(char, i) in summaryData.originalText" :key="i" 
            class="char" @click="goToCharDetail(char)">{{ char }}</span>
        </p>
        <button @click="copyText(summaryData.originalText)" class="copy-btn">复制原文</button>
      </section>

      <!-- 摘要 -->
      <section class="section summary-section">
        <h2 class="section-title">📝 摘要</h2>
        <p class="summary-text">
          <span v-for="(char, i) in summaryData.summary" :key="i" 
            class="char" @click="goToCharDetail(char)">{{ char }}</span>
        </p>
        <button @click="copyText(summaryData.summary)" class="copy-btn">复制摘要</button>
      </section>

      <!-- 现代汉语翻译 -->
      <section v-if="summaryData.translation" class="section translation-section">
        <h2 class="section-title">📖 现代汉语翻译</h2>
        <p class="translation-text">
          <span v-for="(char, i) in summaryData.translation" :key="i" 
            class="char" @click="goToCharDetail(char)">{{ char }}</span>
        </p>
      </section>

      <!-- 关键词 -->
      <section v-if="summaryData.keywords?.length" class="section keywords-section">
        <h2 class="section-title">🏷️ 关键词</h2>
        <div class="tags">
          <span v-for="kw in summaryData.keywords" :key="kw" class="tag keyword" @click="goToCharDetail(kw[0])">
            {{ kw }}
          </span>
        </div>
      </section>

      <!-- 主题 -->
      <section v-if="summaryData.themes?.length" class="section themes-section">
        <h2 class="section-title">📚 主题分析</h2>
        <div class="tags">
          <span v-for="th in summaryData.themes" :key="th" class="tag theme">{{ th }}</span>
        </div>
      </section>

      <!-- 字词详解内链 -->
      <section class="section chars-section">
        <h2 class="section-title">🔤 字词详解</h2>
        <p class="hint">点击任意汉字查看详细释义、字形演变</p>
        <div class="char-grid">
          <router-link v-for="char in uniqueChars" :key="char" :to="`/char/${encodeURIComponent(char)}`" class="char-link">
            {{ char }}
          </router-link>
        </div>
      </section>

      <!-- 相关摘要 -->
      <section v-if="relatedSummaries.length" class="section related-section">
        <h2 class="section-title">📄 相关摘要</h2>
        <div class="related-list">
          <div v-for="item in relatedSummaries" :key="item.id" class="related-item" @click="goToSummary(item.id)">
            <p class="related-text">{{ item.originalText.slice(0, 30) }}...</p>
            <span class="related-date">{{ item.createdAt }}</span>
          </div>
        </div>
      </section>

      <!-- 元信息 -->
      <footer class="meta-info">
        <span>生成时间: {{ summaryData.createdAt }}</span>
        <span v-if="summaryData.source">来源: {{ summaryData.source }}</span>
      </footer>
    </template>
  </div>
</template>

<script lang="ts">
export default {
  computed: {
    uniqueChars(): string[] {
      if (!this.summaryData) return []
      const text = this.summaryData.originalText + this.summaryData.summary
      const chars = [...new Set(text.replace(/[^\u4e00-\u9fff]/g, ''))]
      return chars.slice(0, 50)
    }
  }
}
</script>

<style scoped>
.summary-detail-page { @apply max-w-4xl mx-auto py-6; }
.loading { @apply text-center py-12 text-stone-500; }
.not-found { @apply text-center py-12; }
.not-found h1 { @apply text-xl font-bold text-stone-800 mb-2; }
.not-found p { @apply text-stone-500 mb-4; }
.back-link { @apply text-amber-600 hover:underline; }

.section { @apply bg-white rounded-xl p-4 md:p-6 mb-4; }
.section-title { @apply text-lg font-bold text-stone-800 mb-4; }

.original-text, .summary-text, .translation-text { @apply text-stone-700 leading-relaxed text-lg; }
.char { @apply cursor-pointer hover:bg-amber-100 hover:text-amber-700 rounded transition-colors; }

.copy-btn { @apply mt-3 px-4 py-1.5 text-sm border border-stone-300 rounded hover:bg-stone-50; }

.tags { @apply flex flex-wrap gap-2; }
.tag { @apply px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors; }
.tag.keyword { @apply bg-amber-100 text-amber-700 hover:bg-amber-200; }
.tag.theme { @apply bg-indigo-100 text-indigo-700 hover:bg-indigo-200; }

.chars-section .hint { @apply text-sm text-stone-500 mb-3; }
.char-grid { @apply flex flex-wrap gap-2; }
.char-link { @apply w-10 h-10 flex items-center justify-center bg-stone-100 rounded-lg text-lg hover:bg-amber-100 hover:text-amber-700 transition-colors; }

.related-list { @apply space-y-2; }
.related-item { @apply p-3 bg-stone-50 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors; }
.related-text { @apply text-stone-700 text-sm; }
.related-date { @apply text-xs text-stone-400; }

.meta-info { @apply text-sm text-stone-400 flex gap-4 mt-6; }
</style>
