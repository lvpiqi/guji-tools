<script setup lang="ts">
/**
 * 管理后台 - SEO 管理
 */
import { ref, computed, onMounted } from 'vue'
import { getAllCachedCharacters, exportAllData, type CharacterData } from '@core/services/aiContent'
import { downloadSitemap, generateSitemap } from '@core/services/sitemap'
import { supabase } from '@core/services/supabase'

const cachedChars = ref<string[]>([])
const allData = ref<Record<string, CharacterData>>({})
const showSitemap = ref(false)
const sitemapContent = ref('')

// 数据库统计
const dbStats = ref({
  characters: 0,
  summaries: 0,
  publicSummaries: 0,
})

onMounted(() => {
  loadData()
  loadDbStats()
})

function loadData() {
  cachedChars.value = getAllCachedCharacters()
  allData.value = exportAllData()
}

async function loadDbStats() {
  try {
    // 获取汉字数量
    const { count: charCount } = await supabase
      .from('character_data')
      .select('*', { count: 'exact', head: true })
    dbStats.value.characters = charCount || 0
    
    // 获取摘要数量
    const { count: summaryCount } = await supabase
      .from('summary_data')
      .select('*', { count: 'exact', head: true })
    dbStats.value.summaries = summaryCount || 0
    
    // 获取公开摘要数量
    const { count: publicCount } = await supabase
      .from('summary_data')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)
    dbStats.value.publicSummaries = publicCount || 0
  } catch (e) {
    console.log('Failed to load DB stats:', e)
  }
}

function previewSitemap() {
  sitemapContent.value = generateSitemap()
  showSitemap.value = true
}

const stats = computed(() => ({
  totalChars: Math.max(cachedChars.value.length, dbStats.value.characters),
  totalSummaries: dbStats.value.publicSummaries,
  totalPages: Math.max(cachedChars.value.length, dbStats.value.characters) + dbStats.value.publicSummaries + 30, // 工具页面约30个
  withEvolution: Object.values(allData.value).filter(d => d.evolution).length,
  withRhyme: Object.values(allData.value).filter(d => d.rhyme).length,
  withVariants: Object.values(allData.value).filter(d => d.variants?.length).length,
  withDefinition: Object.values(allData.value).filter(d => d.definition).length,
}))

// 内链统计
const internalLinks = computed(() => {
  let total = 0
  for (const data of Object.values(allData.value)) {
    if (data.variants) total += data.variants.length
  }
  return total
})
</script>

<template>
  <div class="seo-manage">
    <header class="page-header">
      <h1>SEO 管理</h1>
      <p>监控站点 SEO 状态，管理站点地图</p>
    </header>

    <!-- SEO 概览 -->
    <div class="stats-grid">
      <div class="stat-card primary">
        <span class="stat-value">{{ stats.totalPages }}</span>
        <span class="stat-label">可收录页面</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.totalChars }}</span>
        <span class="stat-label">汉字详情页</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.totalSummaries }}</span>
        <span class="stat-label">摘要详情页</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ internalLinks }}</span>
        <span class="stat-label">内部链接</span>
      </div>
    </div>

    <!-- 数据库统计 -->
    <div class="section">
      <h2>📊 数据库内容统计</h2>
      <div class="db-stats">
        <div class="db-stat-item">
          <span class="db-stat-value">{{ dbStats.characters }}</span>
          <span class="db-stat-label">汉字数据</span>
        </div>
        <div class="db-stat-item">
          <span class="db-stat-value">{{ dbStats.summaries }}</span>
          <span class="db-stat-label">摘要总数</span>
        </div>
        <div class="db-stat-item">
          <span class="db-stat-value">{{ dbStats.publicSummaries }}</span>
          <span class="db-stat-label">公开摘要</span>
        </div>
      </div>
      <p class="section-hint">每个汉字和公开摘要都会生成独立的 SEO 页面</p>
    </div>

    <!-- Sitemap 管理 -->
    <div class="section">
      <div class="section-header">
        <h2>🗺️ 站点地图</h2>
        <div class="section-actions">
          <button class="btn-secondary" @click="previewSitemap">预览</button>
          <button class="btn-primary" @click="downloadSitemap">下载 sitemap.xml</button>
        </div>
      </div>
      
      <div class="sitemap-info">
        <div class="info-item">
          <span class="info-label">页面数量</span>
          <span class="info-value">{{ stats.totalPages }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">汉字页面</span>
          <span class="info-value">{{ stats.totalChars }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">工具页面</span>
          <span class="info-value">~20</span>
        </div>
      </div>
      
      <div class="submit-guide">
        <h4>提交指南</h4>
        <ol>
          <li>下载 sitemap.xml 文件</li>
          <li>上传到网站根目录</li>
          <li>在 <a href="https://search.google.com/search-console" target="_blank">Google Search Console</a> 提交</li>
          <li>在 <a href="https://ziyuan.baidu.com/" target="_blank">百度站长平台</a> 提交</li>
        </ol>
      </div>
    </div>

    <!-- 内容完整度 -->
    <div class="section">
      <h2>📊 内容完整度</h2>
      <p class="section-desc">内容越完整，SEO 效果越好</p>
      
      <div class="completeness-list">
        <div class="completeness-item">
          <span class="item-label">有释义</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: stats.totalChars ? (stats.withDefinition / stats.totalChars * 100) + '%' : '0%' }"></div>
          </div>
          <span class="item-value">{{ stats.withDefinition }}/{{ stats.totalChars }}</span>
        </div>
        <div class="completeness-item">
          <span class="item-label">有字形演变</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: stats.totalChars ? (stats.withEvolution / stats.totalChars * 100) + '%' : '0%' }"></div>
          </div>
          <span class="item-value">{{ stats.withEvolution }}/{{ stats.totalChars }}</span>
        </div>
        <div class="completeness-item">
          <span class="item-label">有韵部信息</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: stats.totalChars ? (stats.withRhyme / stats.totalChars * 100) + '%' : '0%' }"></div>
          </div>
          <span class="item-value">{{ stats.withRhyme }}/{{ stats.totalChars }}</span>
        </div>
        <div class="completeness-item">
          <span class="item-label">有异体字</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: stats.totalChars ? (stats.withVariants / stats.totalChars * 100) + '%' : '0%' }"></div>
          </div>
          <span class="item-value">{{ stats.withVariants }}/{{ stats.totalChars }}</span>
        </div>
      </div>
    </div>

    <!-- 已收录汉字 -->
    <div class="section">
      <h2>📝 已收录汉字页面</h2>
      <div v-if="cachedChars.length" class="char-grid">
        <router-link
          v-for="char in cachedChars"
          :key="char"
          :to="`/char/${encodeURIComponent(char)}`"
          class="char-item"
          target="_blank"
        >
          {{ char }}
        </router-link>
      </div>
      <p v-else class="empty-hint">
        暂无数据。用户在工具中查询汉字后会自动生成页面。
      </p>
    </div>

    <!-- SEO 策略说明 -->
    <div class="tips-section">
      <h3>💡 SEO 增长策略</h3>
      <div class="tips-grid">
        <div class="tip-card">
          <h4>用户查询即内容</h4>
          <p>每个查询的汉字自动生成独立页面 /char/字，形成长尾关键词矩阵</p>
        </div>
        <div class="tip-card">
          <h4>摘要即内容</h4>
          <p>每个生成的摘要自动创建独立页面 /summary/slug，丰富站点内容</p>
        </div>
        <div class="tip-card">
          <h4>自动内链建设</h4>
          <p>异体字、同韵部字之间自动互链，提升页面权重和用户停留时间</p>
        </div>
        <div class="tip-card">
          <h4>结构化数据</h4>
          <p>每个页面包含 JSON-LD 结构化数据，帮助搜索引擎理解内容</p>
        </div>
      </div>
      
      <div class="build-guide">
        <h4>🔧 构建静态页面</h4>
        <p>运行以下命令生成 SEO 优化的静态 HTML 页面：</p>
        <code>npm run build</code>
        <p class="hint">构建时会自动为热门汉字和摘要生成独立 HTML 文件</p>
      </div>
    </div>

    <!-- Sitemap 预览弹窗 -->
    <div v-if="showSitemap" class="modal-overlay" @click.self="showSitemap = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Sitemap 预览</h3>
          <button @click="showSitemap = false">×</button>
        </div>
        <pre class="sitemap-preview">{{ sitemapContent }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seo-manage { @apply max-w-4xl; }
.page-header { @apply mb-6; }
.page-header h1 { @apply text-2xl font-bold text-stone-800; }
.page-header p { @apply text-stone-500 mt-1; }

.stats-grid { @apply grid grid-cols-2 md:grid-cols-4 gap-4 mb-6; }
.stat-card { @apply bg-white rounded-xl p-4 text-center shadow-sm; }
.stat-card.primary { @apply bg-amber-500 text-white; }
.stat-value { @apply block text-3xl font-bold; }
.stat-label { @apply text-sm opacity-80; }

.section { @apply bg-white rounded-xl p-6 shadow-sm mb-6; }
.section-header { @apply flex justify-between items-center mb-4; }
.section h2 { @apply text-lg font-medium text-stone-800; }
.section-desc { @apply text-sm text-stone-500 mb-4; }
.section-actions { @apply flex gap-2; }

.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }
.btn-secondary { @apply px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300; }

.sitemap-info { @apply flex gap-6 mb-4 p-4 bg-stone-50 rounded-lg; }
.info-item { @apply flex flex-col; }
.info-label { @apply text-xs text-stone-400; }
.info-value { @apply text-lg font-medium text-stone-800; }

.submit-guide { @apply p-4 bg-blue-50 rounded-lg; }
.submit-guide h4 { @apply font-medium text-blue-800 mb-2; }
.submit-guide ol { @apply text-sm text-blue-700 space-y-1 list-decimal list-inside; }
.submit-guide a { @apply text-blue-600 underline; }

.completeness-list { @apply space-y-3; }
.completeness-item { @apply flex items-center gap-4; }
.item-label { @apply w-24 text-sm text-stone-600; }
.progress-bar { @apply flex-1 h-2 bg-stone-200 rounded-full overflow-hidden; }
.progress-fill { @apply h-full bg-amber-500 transition-all; }
.item-value { @apply w-16 text-sm text-stone-500 text-right; }

.char-grid { @apply flex flex-wrap gap-2; }
.char-item { @apply w-10 h-10 flex items-center justify-center text-xl bg-stone-100 rounded-lg hover:bg-amber-100 hover:text-amber-700; }
.empty-hint { @apply text-stone-400 text-sm; }

.tips-section { @apply bg-green-50 rounded-xl p-6; }
.tips-section h3 { @apply font-medium text-green-800 mb-4; }
.tips-grid { @apply grid grid-cols-1 md:grid-cols-2 gap-4 mb-4; }
.tip-card { @apply bg-white rounded-lg p-4; }
.tip-card h4 { @apply font-medium text-stone-800 mb-1; }
.tip-card p { @apply text-sm text-stone-500; }

.build-guide { @apply bg-white rounded-lg p-4 mt-4; }
.build-guide h4 { @apply font-medium text-stone-800 mb-2; }
.build-guide p { @apply text-sm text-stone-600 mb-2; }
.build-guide code { @apply block bg-stone-800 text-green-400 px-4 py-2 rounded font-mono text-sm; }
.build-guide .hint { @apply text-xs text-stone-400 mt-2; }

.db-stats { @apply flex gap-6 mb-4; }
.db-stat-item { @apply flex flex-col items-center p-4 bg-stone-50 rounded-lg; }
.db-stat-value { @apply text-2xl font-bold text-stone-800; }
.db-stat-label { @apply text-sm text-stone-500; }
.section-hint { @apply text-sm text-stone-400; }

.modal-overlay { @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50; }
.modal-content { @apply bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden; }
.modal-header { @apply flex justify-between items-center p-4 border-b; }
.modal-header h3 { @apply font-medium; }
.modal-header button { @apply w-8 h-8 text-xl hover:bg-stone-100 rounded; }
.sitemap-preview { @apply p-4 text-xs overflow-auto max-h-[60vh] bg-stone-50; }
</style>
