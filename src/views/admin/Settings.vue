<script setup lang="ts">
/**
 * 管理后台 - 系统设置
 */
import { ref, onMounted } from 'vue'
import { useSiteSettingsStore } from '@/stores/siteSettings'

const siteSettings = useSiteSettingsStore()

// 站点设置
const siteName = ref('古籍工具')
const siteUrl = ref('https://www.gujitools.com')
const siteDescription = ref('在线古籍数字化工具，支持纠偏、OCR、字形演变、押韵检测等')

// 缓存设置
const cacheEnabled = ref(true)
const cacheExpireDays = ref(30)

// 显示设置
const defaultFontSize = ref(16)
const enableDarkMode = ref(false)

// 危险操作
const confirmClear = ref('')

onMounted(() => {
  siteSettings.init()
  loadSettings()
})

function loadSettings() {
  try {
    const settings = localStorage.getItem('guji_settings')
    if (settings) {
      const parsed = JSON.parse(settings)
      siteName.value = parsed.siteName || siteName.value
      siteUrl.value = parsed.siteUrl || siteUrl.value
      siteDescription.value = parsed.siteDescription || siteDescription.value
      cacheEnabled.value = parsed.cacheEnabled ?? true
      cacheExpireDays.value = parsed.cacheExpireDays || 30
      defaultFontSize.value = parsed.defaultFontSize || 16
      enableDarkMode.value = parsed.enableDarkMode || false
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
}

function saveSettings() {
  const settings = {
    siteName: siteName.value,
    siteUrl: siteUrl.value,
    siteDescription: siteDescription.value,
    showUsageStats: siteSettings.showUsageStats,
    cacheEnabled: cacheEnabled.value,
    cacheExpireDays: cacheExpireDays.value,
    defaultFontSize: defaultFontSize.value,
    enableDarkMode: enableDarkMode.value,
  }
  localStorage.setItem('guji_settings', JSON.stringify(settings))
  
  // 保存统计数据（通过 store 同步）
  siteSettings.setTotalUsageCount(siteSettings.totalUsageCount)
  
  alert('设置已保存')
}

function clearAllData() {
  if (confirmClear.value !== '确认清除') {
    alert('请输入"确认清除"以确认操作')
    return
  }
  
  // 清除所有 guji_ 开头的数据
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('guji_')) {
      keysToRemove.push(key)
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key))
  
  confirmClear.value = ''
  alert(`已清除 ${keysToRemove.length} 条数据`)
}

function clearExpiredCache() {
  const now = Date.now()
  const expireMs = cacheExpireDays.value * 24 * 60 * 60 * 1000
  let cleared = 0
  
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('guji_ai_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        if (data.generatedAt && (now - data.generatedAt) > expireMs) {
          keysToRemove.push(key)
        }
      } catch {}
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
    cleared++
  })
  
  alert(`已清除 ${cleared} 条过期缓存`)
}

function exportSettings() {
  const settings = localStorage.getItem('guji_settings') || '{}'
  const blob = new Blob([settings], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'guji-settings.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importSettings(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const settings = JSON.parse(reader.result as string)
      localStorage.setItem('guji_settings', JSON.stringify(settings))
      loadSettings()
      alert('设置已导入')
    } catch {
      alert('导入失败：文件格式错误')
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="settings-page">
    <header class="page-header">
      <h1>系统设置</h1>
      <p>配置站点信息和系统参数</p>
    </header>

    <!-- 站点设置 -->
    <div class="settings-section">
      <h2>🌐 站点信息</h2>
      <p class="section-desc">用于 SEO 和站点地图生成</p>
      
      <div class="form-group">
        <label>站点名称</label>
        <input v-model="siteName" type="text" />
      </div>
      
      <div class="form-group">
        <label>站点 URL</label>
        <input v-model="siteUrl" type="url" placeholder="https://example.com" />
      </div>
      
      <div class="form-group">
        <label>站点描述</label>
        <textarea v-model="siteDescription" rows="2"></textarea>
      </div>
    </div>

    <!-- 使用统计设置 -->
    <div class="settings-section">
      <h2>📊 使用统计</h2>
      <p class="section-desc">首页显示的工具使用总次数</p>
      
      <div class="form-group checkbox">
        <label>
          <input 
            type="checkbox" 
            :checked="siteSettings.showUsageStats"
            @change="siteSettings.setShowUsageStats(($event.target as HTMLInputElement).checked)"
          />
          在首页显示使用统计
        </label>
        <span class="help-text">关闭后首页将不显示统计数据（实时生效）</span>
      </div>
      
      <div class="form-group">
        <label>当前使用总次数</label>
        <input 
          type="number" 
          min="0"
          :value="siteSettings.totalUsageCount"
          @input="siteSettings.setTotalUsageCount(Number(($event.target as HTMLInputElement).value))"
        />
        <span class="help-text">可手动调整初始值，用户每次使用工具会自动 +1</span>
      </div>
    </div>

    <!-- 缓存设置 -->
    <div class="settings-section">
      <h2>💾 缓存设置</h2>
      
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" v-model="cacheEnabled" />
          启用本地缓存
        </label>
        <span class="help-text">关闭后每次查询都会调用 API</span>
      </div>
      
      <div class="form-group">
        <label>缓存过期天数</label>
        <input v-model.number="cacheExpireDays" type="number" min="1" max="365" />
        <span class="help-text">超过此天数的缓存将被清理</span>
      </div>
      
      <button class="btn-secondary" @click="clearExpiredCache">
        清理过期缓存
      </button>
    </div>

    <!-- 显示设置 -->
    <div class="settings-section">
      <h2>🎨 显示设置</h2>
      
      <div class="form-group">
        <label>默认字号</label>
        <select v-model.number="defaultFontSize">
          <option :value="14">14px（小）</option>
          <option :value="16">16px（中）</option>
          <option :value="18">18px（大）</option>
          <option :value="20">20px（特大）</option>
        </select>
      </div>
      
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" v-model="enableDarkMode" />
          启用深色模式（开发中）
        </label>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-bar">
      <button class="btn-primary" @click="saveSettings">保存设置</button>
      <button class="btn-secondary" @click="exportSettings">导出设置</button>
      <label class="btn-secondary import-btn">
        导入设置
        <input type="file" accept=".json" @change="importSettings" hidden />
      </label>
    </div>

    <!-- 危险操作 -->
    <div class="danger-section">
      <h2>⚠️ 危险操作</h2>
      <p class="danger-warning">以下操作不可恢复，请谨慎执行</p>
      
      <div class="danger-action">
        <div class="danger-info">
          <h4>清除所有数据</h4>
          <p>删除所有缓存的汉字数据、设置和 API Key</p>
        </div>
        <div class="danger-confirm">
          <input 
            v-model="confirmClear" 
            type="text" 
            placeholder="输入 确认清除" 
            class="confirm-input"
          />
          <button 
            class="btn-danger" 
            @click="clearAllData"
            :disabled="confirmClear !== '确认清除'"
          >
            清除全部
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page { @apply max-w-3xl; }
.page-header { @apply mb-6; }
.page-header h1 { @apply text-2xl font-bold text-stone-800; }
.page-header p { @apply text-stone-500 mt-1; }

.settings-section { @apply bg-white rounded-xl p-6 shadow-sm mb-6; }
.settings-section h2 { @apply text-lg font-medium text-stone-800 mb-1; }
.section-desc { @apply text-sm text-stone-500 mb-4; }

.form-group { @apply mb-4; }
.form-group label { @apply block text-sm text-stone-600 mb-1; }
.form-group input[type="text"],
.form-group input[type="url"],
.form-group input[type="number"],
.form-group textarea,
.form-group select { @apply w-full px-3 py-2 border border-stone-200 rounded-lg; }
.form-group.checkbox label { @apply flex items-center gap-2 cursor-pointer; }
.form-group.checkbox input { @apply w-4 h-4; }
.help-text { @apply block text-xs text-stone-400 mt-1; }

.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }
.btn-secondary { @apply px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 cursor-pointer; }
.btn-danger { @apply px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50; }

.save-bar { @apply flex gap-3 mb-6; }
.import-btn { @apply inline-flex items-center; }

.danger-section { @apply bg-red-50 rounded-xl p-6 border border-red-200; }
.danger-section h2 { @apply text-lg font-medium text-red-800 mb-1; }
.danger-warning { @apply text-sm text-red-600 mb-4; }
.danger-action { @apply flex justify-between items-center gap-4 p-4 bg-white rounded-lg; }
.danger-info h4 { @apply font-medium text-stone-800; }
.danger-info p { @apply text-sm text-stone-500; }
.danger-confirm { @apply flex gap-2; }
.confirm-input { @apply px-3 py-2 border border-stone-200 rounded text-sm w-32; }
</style>
