<script setup lang="ts">
/**
 * \u6458\u8981\u8BE6\u60C5\u9875 - SEO\u53CB\u597D\u7684\u72EC\u7ACB\u9875\u9762
 * \u8DEF\u7531: /summary/:id
 * \u652F\u6301\u4ECE\u6570\u636E\u5E93\u548C\u672C\u5730\u5B58\u50A8\u52A0\u8F7D
 */
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSummaryFromDB, getRecentSummaries, type SummaryData } from '@core/services/contentService'

const route = useRoute()
const router = useRouter()

const summaryData = ref<SummaryData | null>(null)
const loading = ref(true)
const relatedSummaries = ref<SummaryData[]>([])

// SEO: \u52A8\u6001\u8BBE\u7F6E\u9875\u9762\u6807\u9898\u548C\u63CF\u8FF0
function updateSeoMeta() {
  if (!summaryData.value) {
    document.title = '\u6458\u8981\u8BE6\u60C5 - \u53E4\u7C4D\u5DE5\u5177'
    return
  }
  
  const title = summaryData.value.title || summaryData.value.original_text.slice(0, 20) + '...'
  document.title = `${title} - \u53E4\u7C4D\u6458\u8981 - \u53E4\u7C4D\u5DE5\u5177`
  
  const description = summaryData.value.summary.slice(0, 150)
  
  // \u8BBE\u7F6E meta description
  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.setAttribute('name', 'description')
    document.head.appendChild(metaDesc)
  }
  metaDesc.setAttribute('content', description)
  
  // \u8BBE\u7F6E Open Graph
  setMetaProperty('og:title', document.title)
  setMetaProperty('og:description', description)
  setMetaProperty('og:type', 'article')
  setMetaProperty('og:url', `https://www.gujitools.com/summary/${summaryData.value.slug}`)
  
  // \u8BBE\u7F6E JSON-LD
  updateJsonLd()
}

function setMetaProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('property', property)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

function updateJsonLd() {
  if (!summaryData.value) return
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': summaryData.value.title || summaryData.value.original_text.slice(0, 50),
    'description': summaryData.value.summary.slice(0, 150),
    'keywords': summaryData.value.keywords?.join(', ') || '',
    'datePublished': summaryData.value.created_at,
    'dateModified': summaryData.value.updated_at || summaryData.value.created_at,
    'publisher': {
      '@type': 'Organization',
      'name': '\u53E4\u7C4D\u5DE5\u5177',
      'url': 'https://www.gujitools.com'
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://www.gujitools.com/summary/${summaryData.value.slug}`
    }
  }
  
  let script = document.querySelector('script[type="application/ld+json"][data-page="summary"]')
  if (!script) {
    script = document.createElement('script')
    script.setAttribute('type', 'application/ld+json')
    script.setAttribute('data-page', 'summary')
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(jsonLd)
}

onMounted(() => {
  loadSummary()
})

onUnmounted(() => {
  // \u6E05\u7406 JSON-LD
  const script = document.querySelector('script[type="application/ld+json"][data-page="summary"]')
  if (script) script.remove()
})

watch(() => route.params.id, () => {
  loadSummary()
})

watch(summaryData, () => {
  updateSeoMeta()
}, { immediate: true })

async function loadSummary() {
  loading.value = true
  const slug = route.params.id as string
  
  try {
    // 1. 先从数据库获取
    const dbData = await getSummaryFromDB(slug)
    if (dbData) {
      summaryData.value = dbData
      await loadRelatedSummaries()
      loading.value = false
      return
    }
    
    // 2. 从 localStorage 加载（兼容旧数据）
    const stored = localStorage.getItem(`guji_summary_${slug}`)
    if (stored) {
      const localData = JSON.parse(stored)
      summaryData.value = {
        id: localData.id,
        slug: localData.id,
        title: localData.originalText?.slice(0, 30),
        original_text: localData.originalText,
        summary: localData.summary,
        translation: localData.translation,
        keywords: localData.keywords,
        themes: localData.themes,
        analysis: localData.analysis,
        is_public: true,
        created_at: localData.createdAt
      }
      await loadRelatedSummaries()
    }
  } catch (e) {
    console.error('Load summary error:', e)
  } finally {
    loading.value = false
  }
}

async function loadRelatedSummaries() {
  try {
    const recent = await getRecentSummaries(6)
    relatedSummaries.value = recent.filter(s => s.slug !== route.params.id).slice(0, 5)
  } catch {
    // 从 localStorage 加载
    const all: SummaryData[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('guji_summary_') && key !== `guji_summary_${route.params.id}`) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          if (data.id) {
            all.push({
              slug: data.id,
              original_text: data.originalText,
              summary: data.summary,
              is_public: true,
              created_at: data.createdAt
            })
          }
        } catch {}
      }
    }
    relatedSummaries.value = all.slice(0, 5)
  }
}

function goToCharDetail(char: string) {
  if (/[\u4e00-\u9fff]/.test(char)) {
    router.push(`/char/${encodeURIComponent(char)}`)
  }
}

function goToSummary(slug: string) {
  router.push(`/summary/${slug}`)
}

function copyText(text: string) {
  navigator.clipboard.writeText(text)
  alert('\u5DF2\u590D\u5236')
}

// 提取唯一汉字用于内链
const uniqueChars = computed(() => {
  if (!summaryData.value) return []
  const text = summaryData.value.original_text + summaryData.value.summary
  return [...new Set(text.replace(/[^\u4e00-\u9fff]/g, ''))].slice(0, 50)
})
</script>

<template>
  <div class="summary-detail-page">
    <!-- 面包屑导航 -->
    <nav class="breadcrumb" aria-label="面包屑导航">
      <router-link to="/">首页</router-link>
      <span>/</span>
      <router-link to="/pro/summary">自动摘要</router-link>
      <span>/</span>
      <span class="current">摘要详情</span>
    </nav>

    <div v-if="loading" class="loading" aria-live="polite">加载中...</div>
    
    <div v-else-if="!summaryData" class="not-found" role="alert">
      <h1>摘要不存在</h1>
      <p>该摘要可能已被删除或链接无效</p>
      <router-link to="/pro/summary" class="back-link">返回摘要工具</router-link>
    </div>
    
    <article v-else>
      <!-- 原文 -->
      <section class="section original-section">
        <h1 class="section-title">📜 原文</h1>
        <p class="original-text">
          <span v-for="(char, i) in summaryData.original_text" :key="i" 
            class="char" @click="goToCharDetail(char)"
            role="link" tabindex="0" @keyup.enter="goToCharDetail(char)">{{ char }}</span>
        </p>
        <button @click="copyText(summaryData.original_text)" class="copy-btn">复制原文</button>
      </section>

      <!-- 摘要 -->
      <section class="section summary-section">
        <h2 class="section-title">📝 摘要</h2>
        <p class="summary-text">
          <span v-for="(char, i) in summaryData.summary" :key="i" 
            class="char" @click="goToCharDetail(char)"
            role="link" tabindex="0" @keyup.enter="goToCharDetail(char)">{{ char }}</span>
        </p>
        <button @click="copyText(summaryData.summary)" class="copy-btn">复制摘要</button>
      </section>

      <!-- 现代汉语翻译 -->
      <section v-if="summaryData.translation" class="section translation-section">
        <h2 class="section-title">📖 现代汉语翻译</h2>
        <p class="translation-text">
          <span v-for="(char, i) in summaryData.translation" :key="i" 
            class="char" @click="goToCharDetail(char)"
            role="link" tabindex="0" @keyup.enter="goToCharDetail(char)">{{ char }}</span>
        </p>
      </section>

      <!-- 深度分析 -->
      <section v-if="summaryData.analysis" class="section analysis-section">
        <h2 class="section-title">🔍 深度分析</h2>
        <p class="analysis-text">
          <span v-for="(char, i) in summaryData.analysis" :key="i" 
            class="char" @click="goToCharDetail(char)"
            role="link" tabindex="0" @keyup.enter="goToCharDetail(char)">{{ char }}</span>
        </p>
      </section>

      <!-- 关键词 -->
      <section v-if="summaryData.keywords?.length" class="section keywords-section">
        <h2 class="section-title">🏷️ 关键词</h2>
        <div class="tags">
          <span v-for="kw in summaryData.keywords" :key="kw" class="tag keyword" 
            @click="goToCharDetail(kw[0])" role="link" tabindex="0">
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
          <router-link v-for="char in uniqueChars" :key="char" 
            :to="`/char/${encodeURIComponent(char)}`" class="char-link">
            {{ char }}
          </router-link>
        </div>
      </section>

      <!-- 相关摘要 -->
      <section v-if="relatedSummaries.length" class="section related-section">
        <h2 class="section-title">📄 相关摘要</h2>
        <div class="related-list">
          <div v-for="item in relatedSummaries" :key="item.slug" 
            class="related-item" @click="goToSummary(item.slug)"
            role="link" tabindex="0" @keyup.enter="goToSummary(item.slug)">
            <p class="related-text">{{ item.original_text.slice(0, 30) }}...</p>
            <span class="related-date">{{ item.created_at }}</span>
          </div>
        </div>
      </section>

      <!-- 元信息 -->
      <footer class="meta-info">
        <span>生成时间: {{ summaryData.created_at }}</span>
        <span v-if="summaryData.view_count">浏览: {{ summaryData.view_count }}</span>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.summary-detail-page { @apply max-w-4xl mx-auto py-6 px-4; }

.breadcrumb { @apply flex items-center gap-2 text-sm text-stone-500 mb-6; }
.breadcrumb a { @apply hover:text-amber-600; }
.breadcrumb .current { @apply text-stone-800; }

.loading { @apply text-center py-12 text-stone-500; }
.not-found { @apply text-center py-12; }
.not-found h1 { @apply text-xl font-bold text-stone-800 mb-2; }
.not-found p { @apply text-stone-500 mb-4; }
.back-link { @apply text-amber-600 hover:underline; }

.section { @apply bg-white rounded-xl p-4 md:p-6 mb-4; }
.section-title { @apply text-lg font-bold text-stone-800 mb-4; }

.original-text, .summary-text, .translation-text, .analysis-text { 
  @apply text-stone-700 leading-relaxed text-lg; 
}
.char { @apply cursor-pointer hover:bg-amber-100 hover:text-amber-700 rounded transition-colors; }

.copy-btn { @apply mt-3 px-4 py-1.5 text-sm border border-stone-300 rounded hover:bg-stone-50; }

.tags { @apply flex flex-wrap gap-2; }
.tag { @apply px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors; }
.tag.keyword { @apply bg-amber-100 text-amber-700 hover:bg-amber-200; }
.tag.theme { @apply bg-indigo-100 text-indigo-700 hover:bg-indigo-200; }

.chars-section .hint { @apply text-sm text-stone-500 mb-3; }
.char-grid { @apply flex flex-wrap gap-2; }
.char-link { 
  @apply w-10 h-10 flex items-center justify-center bg-stone-100 rounded-lg text-lg 
         hover:bg-amber-100 hover:text-amber-700 transition-colors; 
}

.related-list { @apply space-y-2; }
.related-item { 
  @apply p-3 bg-stone-50 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors; 
}
.related-text { @apply text-stone-700 text-sm; }
.related-date { @apply text-xs text-stone-400; }

.meta-info { @apply text-sm text-stone-400 flex gap-4 mt-6; }
</style>
