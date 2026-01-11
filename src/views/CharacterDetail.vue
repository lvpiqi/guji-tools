<script setup lang="ts">
/**
 * \u6C49\u5B57\u8BE6\u60C5\u9875 - SEO\u53CB\u597D\u7684\u72EC\u7ACB\u9875\u9762
 * \u8DEF\u7531: /char/:char
 * \u6BCF\u4E2A\u67E5\u8BE2\u8FC7\u7684\u6C49\u5B57\u90FD\u6709\u72EC\u7ACBURL\uFF0C\u53EF\u88AB\u641C\u7D22\u5F15\u64CE\u6536\u5F55
 */
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCharacterData, type CharacterData } from '@core/services/aiContent'
import { getCharacterFromDB, getPopularCharacters, type CharacterData as DBCharacterData } from '@core/services/contentService'
import { supabase } from '@core/services/supabase'

const route = useRoute()
const router = useRouter()

const char = computed(() => decodeURIComponent(route.params.char as string))
const data = ref<CharacterData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// \u76F8\u5173\u5B57\u63A8\u8350\uFF08\u5185\u94FE\uFF09
const relatedChars = ref<string[]>([])
// \u70ED\u95E8\u6C49\u5B57\uFF08SEO\u5185\u94FE\uFF09
const popularChars = ref<DBCharacterData[]>([])

// SEO: \u52A8\u6001\u8BBE\u7F6E\u9875\u9762\u6807\u9898\u548C\u63CF\u8FF0
function updateSeoMeta() {
  if (!data.value) {
    document.title = `${char.value} - \u53E4\u7C4D\u5DE5\u5177`
    return
  }
  
  document.title = `\u300C${char.value}\u300D\u5B57\u5F62\u6F14\u53D8\u00B7\u91CA\u4E49\u00B7\u97F5\u90E8 - \u53E4\u7C4D\u5DE5\u5177`
  
  const desc = data.value.definition?.basic || data.value.evolution?.description || ''
  const description = `${char.value}\uFF1A${desc.slice(0, 150)}`
  
  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.setAttribute('name', 'description')
    document.head.appendChild(metaDesc)
  }
  metaDesc.setAttribute('content', description)
  
  setMetaProperty('og:title', document.title)
  setMetaProperty('og:description', description)
  setMetaProperty('og:type', 'article')
  setMetaProperty('og:url', `https://www.gujitools.com/char/${encodeURIComponent(char.value)}`)
  
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
  if (!data.value) return
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    'name': char.value,
    'description': data.value.definition?.basic || '',
    'inDefinedTermSet': {
      '@type': 'DefinedTermSet',
      'name': '\u6C49\u5B57\u5B57\u5178',
      'url': 'https://www.gujitools.com/'
    },
    'termCode': char.value.charCodeAt(0).toString(16).toUpperCase(),
    'sameAs': data.value.variants?.map(v => `https://www.gujitools.com/char/${encodeURIComponent(v)}`) || []
  }
  
  let script = document.querySelector('script[type="application/ld+json"][data-page="char"]')
  if (!script) {
    script = document.createElement('script')
    script.setAttribute('type', 'application/ld+json')
    script.setAttribute('data-page', 'char')
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(jsonLd)
}

// \u83B7\u53D6\u7CFB\u7EDF API Key
async function getSystemApiKey(): Promise<string | null> {
  // 1. \u5148\u4ECE localStorage \u83B7\u53D6\uFF08\u7528\u6237\u81EA\u5DF1\u914D\u7F6E\u7684\uFF09
  const localKey = localStorage.getItem('deepseek_api_key')
  if (localKey) return localKey
  
  // 2. \u4ECE\u6570\u636E\u5E93\u83B7\u53D6\u7CFB\u7EDF\u914D\u7F6E\u7684 API Key
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'deepseek_api_key')
      .maybeSingle()
    
    if (!error && data?.value) return data.value
  } catch (e) {
    console.log('Failed to get system API key:', e)
  }
  
  // 3. \u5C1D\u8BD5\u4ECE\u7F13\u5B58\u7684\u7CFB\u7EDF\u8BBE\u7F6E\u83B7\u53D6
  const cachedKey = localStorage.getItem('system_deepseek_api_key')
  if (cachedKey) return cachedKey
  
  return null
}

onMounted(async () => {
  await loadData()
  loadPopularChars()
})

onUnmounted(() => {
  const script = document.querySelector('script[type="application/ld+json"][data-page="char"]')
  if (script) script.remove()
})

watch(() => route.params.char, () => {
  loadData()
})

watch(data, () => {
  updateSeoMeta()
}, { immediate: true })

async function loadData() {
  if (!char.value) return
  
  loading.value = true
  error.value = null
  
  try {
    // 1. \u5148\u4ECE\u6570\u636E\u5E93\u83B7\u53D6
    console.log('Fetching from DB for char:', char.value)
    const dbData = await getCharacterFromDB(char.value)
    if (dbData) {
      console.log('Found in DB:', dbData)
      data.value = {
        char: dbData.char,
        variants: dbData.variants,
        definition: dbData.definition,
        evolution: dbData.evolution,
        rhyme: dbData.rhyme,
        generatedAt: new Date(dbData.created_at || Date.now()).getTime(),
        source: dbData.source
      }
      generateRelatedChars()
      loading.value = false
      return
    }
    
    console.log('Not found in DB, checking localStorage')
    
    // 2. \u68C0\u67E5\u672C\u5730\u7F13\u5B58
    const cached = localStorage.getItem(`guji_ai_${encodeURIComponent(char.value)}`)
    if (cached) {
      console.log('Found in localStorage')
      data.value = JSON.parse(cached)
      generateRelatedChars()
      loading.value = false
      return
    }
    
    console.log('Not found in localStorage, trying to generate')
    
    // 3. 获取 API Key 并自动生成
    const apiKey = await getSystemApiKey()
    if (!apiKey) {
      error.value = '系统未配置 AI 服务，请联系管理员'
      loading.value = false
      return
    }
    
    // 4. 调用AI生成（会自动保存到数据库）
    console.log('Generating with AI')
    data.value = await getCharacterData(char.value, apiKey)
    generateRelatedChars()
    
  } catch (e) {
    console.error('loadData error:', e)
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function loadPopularChars() {
  try {
    popularChars.value = await getPopularCharacters(20)
  } catch {}
}

function generateRelatedChars() {
  const related = new Set<string>()
  
  // 添加异体字
  if (data.value?.variants) {
    data.value.variants.forEach(v => related.add(v))
  }
  
  // 添加同韵部常用字
  const sameRhymeChars: Record<string, string[]> = {
    '\u4E00\u4E1C': ['\u4E1C', '\u540C', '\u4E2D', '\u98CE', '\u7A7A', '\u529F', '\u7EA2', '\u901A'],
    '\u4E8C\u51AC': ['\u51AC', '\u519C', '\u5B97', '\u949F', '\u9F99', '\u677E', '\u5CF0', '\u9022'],
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
</script>

<template>
  <div class="char-page">
    <!-- 面包屑导航 -->
    <nav class="breadcrumb" aria-label="面包屑导航">
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

    <!-- 加载状态 -->
    <div v-if="loading" class="loading" aria-live="polite">
      <span class="spinner"></span>
      正在生成「{{ char }}」的详细信息...
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-panel" role="alert">
      {{ error }}
      <button @click="loadData" class="btn-retry">重试</button>
    </div>

    <!-- 内容区域 -->
    <article v-else-if="data" class="char-content">
      <!-- 异体字 -->
      <section v-if="data.variants?.length" class="section">
        <h2>异体字</h2>
        <div class="variant-list">
          <span 
            v-for="v in data.variants" 
            :key="v" 
            class="variant-char"
            @click="goToChar(v)"
            role="link"
            tabindex="0"
            @keyup.enter="goToChar(v)"
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
          数据生成时间：{{ new Date(data.generatedAt).toLocaleString('zh-CN') }}
          <span v-if="data.source === 'ai'">（AI生成，仅供参考）</span>
        </p>
      </footer>
    </article>

    <!-- 热门汉字（SEO内链） -->
    <section v-if="popularChars.length" class="popular-section">
      <h2>热门汉字</h2>
      <div class="popular-list">
        <router-link 
          v-for="item in popularChars" 
          :key="item.char"
          :to="`/char/${encodeURIComponent(item.char)}`"
          class="popular-char"
          :title="item.definition?.basic"
        >
          {{ item.char }}
        </router-link>
      </div>
    </section>

    <!-- 搜索其他字 -->
    <div class="search-other">
      <label for="search-char" class="sr-only">查询其他汉字</label>
      <input 
        id="search-char"
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
.char-page { @apply max-w-3xl mx-auto py-8 px-4; }

.breadcrumb { @apply flex items-center gap-2 text-sm text-stone-500 mb-6; }
.breadcrumb a { @apply hover:text-amber-600; }
.breadcrumb .current { @apply text-stone-800 font-medium; }

.char-header { @apply text-center mb-8; }
.char-title { @apply text-8xl font-serif text-stone-800 mb-4; }
.char-subtitle { @apply text-lg text-stone-600; }

.api-key-panel { @apply bg-amber-50 border border-amber-200 rounded-lg p-6 text-center; }
.api-input { @apply w-full max-w-md px-4 py-2 border border-stone-300 rounded-lg my-4; }
.hint { @apply text-sm text-stone-500 mt-2; }
.hint a { @apply text-amber-600 hover:underline; }

.loading { @apply flex items-center justify-center gap-3 py-12 text-stone-600; }
.spinner { @apply w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin; }

.error-panel { @apply bg-red-50 text-red-700 p-4 rounded-lg text-center; }
.btn-retry { @apply ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600; }

.char-content { @apply space-y-8; }

.section { @apply bg-white rounded-xl border border-stone-200 p-6; }
.section h2 { @apply text-lg font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100; }

.variant-list { @apply flex flex-wrap gap-3; }
.variant-char {
  @apply w-12 h-12 flex items-center justify-center text-2xl font-serif
         bg-stone-50 rounded-lg cursor-pointer hover:bg-amber-50 hover:text-amber-700
         transition-colors;
}

.definition-card { @apply space-y-4; }
.def-item { @apply flex gap-4; }
.def-label { @apply w-16 shrink-0 text-sm text-stone-500; }
.def-item p { @apply text-stone-700 leading-relaxed; }

.evolution-timeline { @apply space-y-4; }
.evo-stage { @apply flex gap-4 items-start; }
.evo-label { @apply w-16 shrink-0 text-sm font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded; }
.evo-stage p { @apply text-stone-600 text-sm; }
.evo-desc { @apply mt-4 pt-4 border-t border-stone-100 text-stone-700 leading-relaxed; }

.rhyme-card { @apply grid grid-cols-2 gap-4; }
.rhyme-item { @apply flex flex-col; }
.rhyme-label { @apply text-xs text-stone-500 mb-1; }
.rhyme-value { @apply text-lg font-medium text-stone-800; }

.related-list { @apply flex flex-wrap gap-2; }
.related-char {
  @apply px-3 py-1 bg-stone-100 rounded-full text-stone-700
         hover:bg-amber-100 hover:text-amber-700 transition-colors;
}

.data-footer { @apply text-center text-xs text-stone-400 pt-4; }

.popular-section { @apply mt-8 bg-white rounded-xl border border-stone-200 p-6; }
.popular-section h2 { @apply text-lg font-bold text-stone-800 mb-4; }
.popular-list { @apply flex flex-wrap gap-2; }
.popular-char {
  @apply w-10 h-10 flex items-center justify-center bg-stone-100 rounded-lg text-lg
         hover:bg-amber-100 hover:text-amber-700 transition-colors;
}

.search-other { @apply mt-8 text-center; }
.search-input { @apply px-4 py-2 border border-stone-300 rounded-lg text-center text-xl w-32; }

.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
