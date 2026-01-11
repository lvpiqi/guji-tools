<script setup lang="ts">
/**
 * 管理后台 - 数据导出
 */
import { ref, computed } from 'vue'
import { getAllCachedCharacters, exportAllData } from '@core/services/aiContent'
import { generateSitemap, downloadSitemap, downloadAllData } from '@core/services/sitemap'

const exporting = ref(false)
const exportResult = ref<string | null>(null)

const stats = computed(() => {
  const chars = getAllCachedCharacters()
  const data = exportAllData()
  
  let totalSize = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('guji_ai_')) {
      totalSize += localStorage.getItem(key)?.length || 0
    }
  }
  
  return {
    totalChars: chars.length,
    totalSize: (totalSize / 1024).toFixed(1),
    aiCount: Object.values(data).filter(d => d.source === 'ai').length,
    localCount: Object.values(data).filter(d => d.source === 'local').length,
  }
})

function handleDownloadSitemap() {
  downloadSitemap()
  exportResult.value = 'sitemap.xml 已下载'
}

function handleDownloadJson() {
  downloadAllData()
  exportResult.value = 'character-data.json 已下载'
}

async function exportAsCSV() {
  exporting.value = true
  
  try {
    const data = exportAllData()
    const rows = [['汉字', '基本义', '古义', '异体字', '韵部', '声调', '来源', '生成时间']]
    
    for (const [char, info] of Object.entries(data)) {
      rows.push([
        char,
        info.definition?.basic || '',
        info.definition?.classical || '',
        info.variants?.join(',') || '',
        info.rhyme?.pingshui || '',
        info.rhyme?.tone || '',
        info.source || '',
        info.generatedAt ? new Date(info.generatedAt).toISOString() : ''
      ])
    }
    
    const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'character-data.csv'
    a.click()
    URL.revokeObjectURL(url)
    
    exportResult.value = 'character-data.csv 已下载'
  } finally {
    exporting.value = false
  }
}

async function exportForSSG() {
  exporting.value = true
  
  try {
    const data = exportAllData()
    const chars = Object.keys(data)
    
    // 生成每个字的独立 JSON 文件打包
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    // 添加索引文件
    zip.file('index.json', JSON.stringify({ chars, total: chars.length, generatedAt: new Date().toISOString() }))
    
    // 添加每个字的数据
    const charFolder = zip.folder('chars')
    for (const [char, info] of Object.entries(data)) {
      charFolder?.file(`${encodeURIComponent(char)}.json`, JSON.stringify(info, null, 2))
    }
    
    // 添加 sitemap
    zip.file('sitemap.xml', generateSitemap())
    
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ssg-data.zip'
    a.click()
    URL.revokeObjectURL(url)
    
    exportResult.value = 'ssg-data.zip 已下载（包含索引、字数据、sitemap）'
  } finally {
    exporting.value = false
  }
}

function clearExportResult() {
  exportResult.value = null
}
</script>

<template>
  <div class="data-export">
    <header class="page-header">
      <h1>数据导出</h1>
      <p>导出汉字数据用于备份或静态站点生成</p>
    </header>

    <!-- 数据概览 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalChars }}</span>
        <span class="stat-label">总汉字数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.aiCount }}</span>
        <span class="stat-label">AI 生成</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.localCount }}</span>
        <span class="stat-label">本地数据</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalSize }} KB</span>
        <span class="stat-label">数据大小</span>
      </div>
    </div>

    <!-- 导出结果提示 -->
    <div v-if="exportResult" class="export-result" @click="clearExportResult">
      ✓ {{ exportResult }}
    </div>

    <!-- 导出选项 -->
    <div class="export-grid">
      <!-- Sitemap -->
      <div class="export-card">
        <div class="card-icon">🗺️</div>
        <h3>Sitemap.xml</h3>
        <p>生成站点地图，提交给搜索引擎以便收录所有汉字页面</p>
        <button class="btn-export" @click="handleDownloadSitemap">
          下载 Sitemap
        </button>
      </div>

      <!-- JSON -->
      <div class="export-card">
        <div class="card-icon">📄</div>
        <h3>JSON 数据</h3>
        <p>导出所有汉字数据为 JSON 格式，可用于数据备份或迁移</p>
        <button class="btn-export" @click="handleDownloadJson">
          下载 JSON
        </button>
      </div>

      <!-- CSV -->
      <div class="export-card">
        <div class="card-icon">📊</div>
        <h3>CSV 表格</h3>
        <p>导出为 CSV 格式，可在 Excel 中打开查看和编辑</p>
        <button class="btn-export" @click="exportAsCSV" :disabled="exporting">
          {{ exporting ? '导出中...' : '下载 CSV' }}
        </button>
      </div>

      <!-- SSG 包 -->
      <div class="export-card featured">
        <div class="card-icon">📦</div>
        <h3>SSG 数据包</h3>
        <p>包含索引、每个字的独立 JSON、sitemap，用于静态站点生成</p>
        <button class="btn-export primary" @click="exportForSSG" :disabled="exporting">
          {{ exporting ? '打包中...' : '下载 SSG 包' }}
        </button>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="info-section">
      <h3>📖 导出数据用途</h3>
      <div class="use-cases">
        <div class="use-case">
          <h4>SEO 优化</h4>
          <p>下载 sitemap.xml 后提交到 Google Search Console 和百度站长平台，加速页面收录</p>
        </div>
        <div class="use-case">
          <h4>数据备份</h4>
          <p>定期导出 JSON 数据，防止浏览器清除 localStorage 导致数据丢失</p>
        </div>
        <div class="use-case">
          <h4>静态站点生成</h4>
          <p>使用 SSG 数据包配合 Nuxt/Next.js 等框架生成纯静态页面，提升性能和 SEO</p>
        </div>
        <div class="use-case">
          <h4>数据分析</h4>
          <p>导出 CSV 在 Excel 中分析用户查询热度、数据完整度等</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-export { @apply max-w-4xl; }
.page-header { @apply mb-6; }
.page-header h1 { @apply text-2xl font-bold text-stone-800; }
.page-header p { @apply text-stone-500 mt-1; }

.stats-bar { @apply flex gap-6 bg-white rounded-xl p-4 shadow-sm mb-6; }
.stat-item { @apply flex flex-col items-center flex-1; }
.stat-value { @apply text-2xl font-bold text-stone-800; }
.stat-label { @apply text-xs text-stone-500; }

.export-result { @apply bg-green-50 text-green-700 p-3 rounded-lg mb-6 cursor-pointer hover:bg-green-100; }

.export-grid { @apply grid grid-cols-1 md:grid-cols-2 gap-4 mb-6; }
.export-card { @apply bg-white rounded-xl p-6 shadow-sm; }
.export-card.featured { @apply ring-2 ring-amber-200; }
.card-icon { @apply text-3xl mb-3; }
.export-card h3 { @apply font-medium text-stone-800 mb-2; }
.export-card p { @apply text-sm text-stone-500 mb-4; }
.btn-export { @apply w-full py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 disabled:opacity-50; }
.btn-export.primary { @apply bg-amber-500 text-white hover:bg-amber-600; }

.info-section { @apply bg-stone-50 rounded-xl p-6; }
.info-section h3 { @apply font-medium text-stone-800 mb-4; }
.use-cases { @apply grid grid-cols-1 md:grid-cols-2 gap-4; }
.use-case { @apply bg-white rounded-lg p-4; }
.use-case h4 { @apply font-medium text-stone-700 mb-1; }
.use-case p { @apply text-sm text-stone-500; }
</style>
