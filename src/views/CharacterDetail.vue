<script setup lang="ts">
/**
 * 汉字详情页 - SEO友好的独立页面
 * 路由: /char/:char
 * 每个查询过的汉字都有独立URL，可被搜索引擎收录
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCharacterData, type CharacterData } from '@core/services/aiContent'

const route = useRoute()
const router = useRouter()

const char = computed(() => decodeURIComponent(route.params.char as string))
const data = ref<CharacterData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// API Key 管理
const apiKey = ref(localStorage.getItem('deepseek_api_key') || '')
const showApiKeyInput = ref(false)

// 相关字推荐（内链）
const relatedChars = ref<string[]>([])

onMounted(() => {
  loadData()
})

watch(() => route.params.char, () => {
  loadData()
})

async function loadData() {
  if (!char.value) return
  
  loading.value = true
  error.value = null
  
  try {
    // 先尝试从缓存加载
    const cached = localStorage.getItem(`guji_ai_${encodeURIComponent(char.value)}`)
    if (cached) {
      data.value = JSON.parse(cached)
      generateRelatedChars()
      loading.value = false
      return
    }
    
    // 无缓存且无API Key，提示用户
    if (!apiKey.value) {
      showApiKeyInput.value = true
      loading.value = false
      return
    }
    
    // 调用AI生成
    data.value = await getCharacterData(char.value, apiKey.value)
    generateRelatedChars()
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function saveApiKey() {
  localStorage.setItem('deepseek_api_key', apiKey.value)
  showApiKeyInput.value = false
  loadData()
}

function generateRelatedChars() {
  // 从异体字和常用关联字生成内链
  const related = new Set<string>()
  
  // 添加异体字
  if (data.value?.variants) {
    data.value.variants.forEach(v => related.add(v))
  }
  
  // 添加同韵部常用字（示例）
  const sameRhymeChars: Record<string, string[]> = {
    '一东': ['东', '同', '中', '风', '空', '功', '红', '通'],
    '二冬': ['冬', '农', '宗', '钟', '龙', '松', '峰', '逢'],
    // ... 可扩展
  }
  
  if (data.value?.rhyme?.pingshui) {
    const rhymeChars = sameRhymeChars[data.value.rhyme.pingshui] || []
    rhymeChars.forEach(c => {
      if (c !== char.value) related.add(c)
    })
  }
  
  relatedChars.value = Array.from(related).slice(0, 12)
}

function goToChar(c: string) {
  router.push(`/char/${encodeURIComponent(c)}`)
}

// SEO: 动态设置页面标题和描述
watch(data, (newData) => {
  if (newData) {
    document.title = `「${char.value}」字形演变·释义·韵部 - 古籍工具`
    
    // 设置 meta description
    const desc = newData.definition?.basic || newData.evolution?.description || ''
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', `${char.value}：${desc.slice(0, 150)}`)
  }
}, { immediate: true })
</script>

<template>
  <div class="char-page">
    <!-- 面包屑导航 -->
    <nav class="breadcrumb">
      <router-link to="/">首页</router-link>
      <span>/</span>
      <span>汉字详情</span>
      <span>/</span>
      <span class="current">{{ char }}</span>
    </nav>

    <!-- 主标题 -->
    <header class="char-header">
      <h1 class="char-title">{{ char }}</h1>
      <p class="char-subtitle" v-if="data?.definition?.basic">{{ data.definition.basic }}</p>
    </header>

    <!-- API Key 输入 -->
    <div v-if="showApiKeyInput" class="api-key-panel">
      <p>首次查询需要配置 DeepSeek API Key：</p>
      <input 
        v-model="apiKey" 
        type="password" 
        placeholder="sk-..." 
        class="api-input"
      />
      <button @click="saveApiKey" class="btn-primary">保存并查询</button>
      <p class="hint">
        <a href="https://platform.deepseek.com/" target="_blank">获取 API Key →</a>
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading">
      <span class="spinner"></span>
      正在生成「{{ char }}」的详细信息...
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-panel">
      {{ error }}
      <button @click="loadData" class="btn-retry">重试</button>
    </div>

    <!-- 内容区域 -->
    <div v-else-if="data" class="char-content">
      <!-- 异体字 -->
      <section v-if="data.variants?.length" class="section">
        <h2>异体字</h2>
        <div class="variant-list">
          <span 
            v-for="v in data.variants" 
            :key="v" 
            class="variant-char"
            @click="goToChar(v)"
          >
            {{ v }}
          </span>
        </div>
      </section>

      <!-- 释义 -->
      <section v-if="data.definition" class="section">
        <h2>释义</h2>
        <div class="definition-card">
          <div class="def-item">
            <span class="def-label">基本义</span>
            <p>{{ data.definition.basic }}</p>
          </div>
          <div class="def-item" v-if="data.definition.classical">
            <span class="def-label">古义</span>
            <p>{{ data.definition.classical }}</p>
          </div>
          <div class="def-item" v-if="data.definition.english">
            <span class="def-label">English</span>
            <p>{{ data.definition.english }}</p>
          </div>
        </div>
      </section>

      <!-- 字形演变 -->
      <section v-if="data.evolution" class="section">
        <h2>字形演变</h2>
        <div class="evolution-timeline">
          <div v-if="data.evolution.oracle" class="evo-stage">
            <span class="evo-label">甲骨文</span>
            <p>{{ data.evolution.oracle }}</p>
          </div>
          <div v-if="data.evolution.bronze" class="evo-stage">
            <span class="evo-label">金文</span>
            <p>{{ data.evolution.bronze }}</p>
          </div>
          <div v-if="data.evolution.seal" class="evo-stage">
            <span class="evo-label">篆书</span>
            <p>{{ data.evolution.seal }}</p>
          </div>
          <div v-if="data.evolution.clerical" class="evo-stage">
            <span class="evo-label">隶书</span>
            <p>{{ data.evolution.clerical }}</p>
          </div>
          <div v-if="data.evolution.regular" class="evo-stage">
            <span class="evo-label">楷书</span>
            <p>{{ data.evolution.regular }}</p>
          </div>
        </div>
        <p v-if="data.evolution.description" class="evo-desc">
          {{ data.evolution.description }}
        </p>
      </section>

      <!-- 韵部信息 -->
      <section v-if="data.rhyme" class="section">
        <h2>音韵信息</h2>
        <div class="rhyme-card">
          <div class="rhyme-item">
            <span class="rhyme-label">平水韵</span>
            <span class="rhyme-value">{{ data.rhyme.pingshui }}</span>
          </div>
          <div class="rhyme-item">
            <span class="rhyme-label">声调</span>
            <span class="rhyme-value">{{ data.rhyme.tone }}</span>
          </div>
          <div v-if="data.rhyme.fanqie" class="rhyme-item">
            <span class="rhyme-label">反切</span>
            <span class="rhyme-value">{{ data.rhyme.fanqie }}</span>
          </div>
          <div v-if="data.rhyme.middleChinese" class="rhyme-item">
            <span class="rhyme-label">中古音</span>
            <span class="rhyme-value">{{ data.rhyme.middleChinese }}</span>
          </div>
        </div>
      </section>

      <!-- 相关汉字（内链） -->
      <section v-if="relatedChars.length" class="section">
        <h2>相关汉字</h2>
        <div class="related-list">
          <router-link 
            v-for="c in relatedChars" 
            :key="c"
            :to="`/char/${encodeURIComponent(c)}`"
            class="related-char"
          >
            {{ c }}
          </router-link>
        </div>
      </section>

      <!-- 数据来源说明 -->
      <footer class="data-footer">
        <p>
          数据生成时间：{{ new Date(data.generatedAt).toLocaleString() }}
          <span v-if="data.source === 'ai'">（AI生成，仅供参考）</span>
        </p>
      </footer>
    </div>

    <!-- 搜索其他字 -->
    <div class="search-other">
      <input 
        type="text" 
        placeholder="查询其他汉字..." 
        maxlength="1"
        @keyup.enter="(e) => goToChar((e.target as HTMLInputElement).value)"
        class="search-input"
      />
    </div>
  </div>
</template>

<style scoped>
.char-page {
  @apply max-w-3xl mx-auto py-8 px-4;
}

.breadcrumb {
  @apply flex items-center gap-2 text-sm text-stone-500 mb-6;
}
.breadcrumb a {
  @apply hover:text-amber-600;
}
.breadcrumb .current {
  @apply text-stone-800 font-medium;
}

.char-header {
  @apply text-center mb-8;
}
.char-title {
  @apply text-8xl font-serif text-stone-800 mb-4;
}
.char-subtitle {
  @apply text-lg text-stone-600;
}

.api-key-panel {
  @apply bg-amber-50 border border-amber-200 rounded-lg p-6 text-center;
}
.api-input {
  @apply w-full max-w-md px-4 py-2 border border-stone-300 rounded-lg my-4;
}
.hint {
  @apply text-sm text-stone-500 mt-2;
}
.hint a {
  @apply text-amber-600 hover:underline;
}

.loading {
  @apply flex items-center justify-center gap-3 py-12 text-stone-600;
}
.spinner {
  @apply w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin;
}

.error-panel {
  @apply bg-red-50 text-red-700 p-4 rounded-lg text-center;
}
.btn-retry {
  @apply ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600;
}

.char-content {
  @apply space-y-8;
}

.section {
  @apply bg-white rounded-xl border border-stone-200 p-6;
}
.section h2 {
  @apply text-lg font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100;
}

.variant-list {
  @apply flex flex-wrap gap-3;
}
.variant-char {
  @apply w-12 h-12 flex items-center justify-center text-2xl font-serif
         bg-stone-50 rounded-lg cursor-pointer hover:bg-amber-50 hover:text-amber-700
         transition-colors;
}

.definition-card {
  @apply space-y-4;
}
.def-item {
  @apply flex gap-4;
}
.def-label {
  @apply w-16 shrink-0 text-sm text-stone-500;
}
.def-item p {
  @apply text-stone-700 leading-relaxed;
}

.evolution-timeline {
  @apply space-y-4;
}
.evo-stage {
  @apply flex gap-4 items-start;
}
.evo-label {
  @apply w-16 shrink-0 text-sm font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded;
}
.evo-stage p {
  @apply text-stone-600 text-sm;
}
.evo-desc {
  @apply mt-4 pt-4 border-t border-stone-100 text-stone-700 leading-relaxed;
}

.rhyme-card {
  @apply grid grid-cols-2 gap-4;
}
.rhyme-item {
  @apply flex flex-col;
}
.rhyme-label {
  @apply text-xs text-stone-500 mb-1;
}
.rhyme-value {
  @apply text-lg font-medium text-stone-800;
}

.related-list {
  @apply flex flex-wrap gap-2;
}
.related-char {
  @apply px-3 py-1 bg-stone-100 rounded-full text-stone-700
         hover:bg-amber-100 hover:text-amber-700 transition-colors;
}

.data-footer {
  @apply text-center text-xs text-stone-400 pt-4;
}

.search-other {
  @apply mt-8 text-center;
}
.search-input {
  @apply px-4 py-2 border border-stone-300 rounded-lg text-center text-xl w-32;
}

.btn-primary {
  @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600;
}
</style>
