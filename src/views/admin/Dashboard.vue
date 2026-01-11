<script setup lang="ts">
/**
 * 管理后台 - 概览页
 */
import { ref, onMounted, computed } from 'vue'
import { getAllCachedCharacters, exportAllData } from '@core/services/aiContent'

const stats = ref({
  totalChars: 0,
  withEvolution: 0,
  withRhyme: 0,
  withVariants: 0,
  withDefinition: 0,
  aiGenerated: 0,
  localData: 0,
})

const recentChars = ref<string[]>([])
const apiKeyConfigured = ref(false)

onMounted(() => {
  loadStats()
})

function loadStats() {
  const chars = getAllCachedCharacters()
  const allData = exportAllData()
  
  stats.value.totalChars = chars.length
  stats.value.withEvolution = Object.values(allData).filter(d => d.evolution).length
  stats.value.withRhyme = Object.values(allData).filter(d => d.rhyme).length
  stats.value.withVariants = Object.values(allData).filter(d => d.variants?.length).length
  stats.value.withDefinition = Object.values(allData).filter(d => d.definition).length
  stats.value.aiGenerated = Object.values(allData).filter(d => d.source === 'ai').length
  stats.value.localData = Object.values(allData).filter(d => d.source === 'local').length
  
  // 最近查询的字（按时间排序）
  const sorted = Object.entries(allData)
    .sort((a, b) => (b[1].generatedAt || 0) - (a[1].generatedAt || 0))
    .slice(0, 20)
  recentChars.value = sorted.map(([char]) => char)
  
  // 检查 API Key
  apiKeyConfigured.value = !!localStorage.getItem('deepseek_api_key')
}

const storageUsed = computed(() => {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('guji_ai_')) {
      total += localStorage.getItem(key)?.length || 0
    }
  }
  return (total / 1024).toFixed(1)
})
</script>

<template>
  <div class="dashboard">
    <header class="page-header">
      <h1>概览</h1>
      <p>古籍工具管理后台</p>
    </header>

    <!-- 快捷状态 -->
    <div class="status-bar" :class="{ warning: !apiKeyConfigured }">
      <span v-if="apiKeyConfigured">✓ DeepSeek API 已配置</span>
      <span v-else>⚠ 未配置 DeepSeek API Key，AI 功能不可用</span>
      <router-link to="/admin/api" class="config-link">去配置 →</router-link>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card primary">
        <span class="stat-value">{{ stats.totalChars }}</span>
        <span class="stat-label">已收录汉字</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.aiGenerated }}</span>
        <span class="stat-label">AI 生成</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.localData }}</span>
        <span class="stat-label">本地数据</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ storageUsed }} KB</span>
        <span class="stat-label">存储占用</span>
      </div>
    </div>

    <!-- 数据完整度 -->
    <div class="section">
      <h2>数据完整度</h2>
      <div class="completeness-grid">
        <div class="completeness-item">
          <div class="completeness-bar">
            <div class="bar-fill" :style="{ width: stats.totalChars ? (stats.withDefinition / stats.totalChars * 100) + '%' : '0%' }"></div>
          </div>
          <span class="completeness-label">释义 {{ stats.withDefinition }}/{{ stats.totalChars }}</span>
        </div>
        <div class="completeness-item">
          <div class="completeness-bar">
            <div class="bar-fill" :style="{ width: stats.totalChars ? (stats.withEvolution / stats.totalChars * 100) + '%' : '0%' }"></div>
          </div>
          <span class="completeness-label">字形演变 {{ stats.withEvolution }}/{{ stats.totalChars }}</span>
        </div>
        <div class="completeness-item">
          <div class="completeness-bar">
            <div class="bar-fill" :style="{ width: stats.totalChars ? (stats.withRhyme / stats.totalChars * 100) + '%' : '0%' }"></div>
          </div>
          <span class="completeness-label">韵部信息 {{ stats.withRhyme }}/{{ stats.totalChars }}</span>
        </div>
        <div class="completeness-item">
          <div class="completeness-bar">
            <div class="bar-fill" :style="{ width: stats.totalChars ? (stats.withVariants / stats.totalChars * 100) + '%' : '0%' }"></div>
          </div>
          <span class="completeness-label">异体字 {{ stats.withVariants }}/{{ stats.totalChars }}</span>
        </div>
      </div>
    </div>

    <!-- 最近收录 -->
    <div class="section">
      <h2>最近收录的汉字</h2>
      <div v-if="recentChars.length" class="recent-chars">
        <router-link
          v-for="char in recentChars"
          :key="char"
          :to="`/char/${encodeURIComponent(char)}`"
          class="char-item"
        >
          {{ char }}
        </router-link>
      </div>
      <p v-else class="empty-hint">暂无数据，用户查询汉字后会自动收录</p>
    </div>

    <!-- 快捷操作 -->
    <div class="section">
      <h2>快捷操作</h2>
      <div class="quick-actions">
        <router-link to="/admin/tools" class="action-card">
          <span class="action-icon">🔧</span>
          <span class="action-name">工具管理</span>
          <span class="action-desc">配置工具权限</span>
        </router-link>
        <router-link to="/admin/users" class="action-card">
          <span class="action-icon">👥</span>
          <span class="action-name">用户管理</span>
          <span class="action-desc">管理注册用户</span>
        </router-link>
        <router-link to="/admin/seo" class="action-card">
          <span class="action-icon">🔍</span>
          <span class="action-name">SEO 管理</span>
          <span class="action-desc">导出站点地图</span>
        </router-link>
        <router-link to="/admin/content" class="action-card">
          <span class="action-icon">📝</span>
          <span class="action-name">内容管理</span>
          <span class="action-desc">查看编辑数据</span>
        </router-link>
        <router-link to="/admin/export" class="action-card">
          <span class="action-icon">📦</span>
          <span class="action-name">数据导出</span>
          <span class="action-desc">备份全部数据</span>
        </router-link>
        <router-link to="/admin/api" class="action-card">
          <span class="action-icon">🔑</span>
          <span class="action-name">API 配置</span>
          <span class="action-desc">管理 API Key</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { @apply max-w-5xl; }
.page-header { @apply mb-4 md:mb-6; }
.page-header h1 { @apply text-xl md:text-2xl font-bold text-stone-800; }
.page-header p { @apply text-stone-500 mt-1 text-sm md:text-base; }

.status-bar { @apply flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 mb-4 md:mb-6 bg-green-50 text-green-700 rounded-lg text-sm; }
.status-bar.warning { @apply bg-yellow-50 text-yellow-700; }
.config-link { @apply text-amber-600 hover:underline; }

.stats-grid { @apply grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6; }
.stat-card { @apply bg-white rounded-xl p-3 md:p-4 text-center shadow-sm; }
.stat-card.primary { @apply bg-amber-500 text-white; }
.stat-value { @apply block text-2xl md:text-3xl font-bold; }
.stat-label { @apply text-xs md:text-sm opacity-80; }

.section { @apply bg-white rounded-xl p-4 md:p-6 shadow-sm mb-4 md:mb-6; }
.section h2 { @apply font-medium text-stone-800 mb-3 md:mb-4 text-sm md:text-base; }

.completeness-grid { @apply space-y-3; }
.completeness-item { @apply flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4; }
.completeness-bar { @apply flex-1 h-2 bg-stone-200 rounded-full overflow-hidden; }
.bar-fill { @apply h-full bg-amber-500 transition-all; }
.completeness-label { @apply text-xs md:text-sm text-stone-500 sm:w-40; }

.recent-chars { @apply flex flex-wrap gap-2; }
.char-item { @apply w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-lg md:text-xl bg-stone-100 rounded-lg hover:bg-amber-100 hover:text-amber-700; }
.empty-hint { @apply text-stone-400 text-sm; }

.quick-actions { @apply grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4; }
.action-card { @apply flex flex-col items-center p-3 md:p-4 bg-stone-50 rounded-lg hover:bg-amber-50 transition-colors text-center; }
.action-icon { @apply text-xl md:text-2xl mb-1 md:mb-2; }
.action-name { @apply font-medium text-stone-800 text-sm md:text-base; }
.action-desc { @apply text-xs text-stone-500 mt-1 hidden sm:block; }
</style>
