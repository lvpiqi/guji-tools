<script setup lang="ts">
/**
 * 管理后台 - SEO 管理
 */
import { ref, computed, onMounted } from 'vue'
import { getAllCachedCharacters, exportAllData, type CharacterData } from '@core/services/aiContent'
import { downloadSitemap, generateSitemap } from '@core/services/sitemap'

const cachedChars = ref<string[]>([])
const allData = ref<Record<string, CharacterData>>({})
const showSitemap = ref(false)
const sitemapContent = ref('')

onMounted(() => {
  loadData()
})

function loadData() {
  cachedChars.value = getAllCachedCharacters()
  allData.value = exportAllData()
}

function previewSitemap() {
  sitemapContent.value = generateSitemap()
  showSitemap.value = true
}

const stats = computed(() => ({
  totalChars: cachedChars.value.length,
  totalPages: cachedChars.value.length + 20, // 工具页面约20个
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
        <span class="stat-value">{{ internalLinks }}</span>
        <span class="stat-label">内部链接</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.withDefinition }}</span>
        <span class="stat-label">有完整内容</span>
      </div>
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
          <h4>自动内链建设</h4>
          <p>异体字、同韵部字之间自动互链，提升页面权重和用户停留时间</p>
        </div>
        <div class="tip-card">
          <h4>结构化数据</h4>
          <p>每个页面包含 JSON-LD 结构化数据，帮助搜索引擎理解内容</p>
        </div>
        <div class="tip-card">
          <h4>动态 Sitemap</h4>
          <p>站点地图随内容自动更新，定期提交保持搜索引擎同步</p>
        </div>
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
.tips-grid { @apply grid grid-cols-1 md:grid-cols-2 gap-4; }
.tip-card { @apply bg-white rounded-lg p-4; }
.tip-card h4 { @apply font-medium text-stone-800 mb-1; }
.tip-card p { @apply text-sm text-stone-500; }

.modal-overlay { @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50; }
.modal-content { @apply bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden; }
.modal-header { @apply flex justify-between items-center p-4 border-b; }
.modal-header h3 { @apply font-medium; }
.modal-header button { @apply w-8 h-8 text-xl hover:bg-stone-100 rounded; }
.sitemap-preview { @apply p-4 text-xs overflow-auto max-h-[60vh] bg-stone-50; }
</style>
