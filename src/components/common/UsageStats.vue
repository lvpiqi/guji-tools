<script setup lang="ts">
/**
 * 全站工具使用统计组件
 * 显示总使用次数，后台可控制显示/隐藏
 * SEO 友好：使用语义化标签和结构化数据
 */
import { computed, onMounted } from 'vue'
import { useSiteSettingsStore } from '@/stores/siteSettings'

const siteSettings = useSiteSettingsStore()

// 格式化数字（添加千分位）
function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

// 是否显示组件
const shouldShow = computed(() => siteSettings.showUsageStats)
const totalUsage = computed(() => siteSettings.totalUsageCount)

onMounted(() => {
  siteSettings.init()
})
</script>

<template>
  <section 
    v-if="shouldShow" 
    class="usage-stats"
    aria-label="使用统计"
    itemscope 
    itemtype="https://schema.org/WebSite"
  >
    <div class="stats-content">
      <div class="stats-icon">📊</div>
      <div class="stats-info">
        <span class="stats-label">工具累计使用</span>
        <span class="stats-number" itemprop="interactionCount">
          <span class="number">{{ formatNumber(totalUsage) }}</span>
          <span class="unit">次</span>
        </span>
      </div>
      <div class="stats-badge">
        <span class="pulse"></span>
        实时统计
      </div>
    </div>
  </section>
</template>

<style scoped>
.usage-stats {
  @apply mb-6;
}

.stats-content {
  @apply flex items-center gap-4 px-5 py-4
         bg-gradient-to-r from-amber-50 to-orange-50
         rounded-xl border border-amber-200;
}

.stats-icon {
  @apply text-3xl;
}

.stats-info {
  @apply flex-1;
}

.stats-label {
  @apply block text-sm text-stone-500 mb-0.5;
}

.stats-number {
  @apply flex items-baseline gap-1;
}

.stats-number .number {
  @apply text-2xl font-bold text-amber-600;
}

.stats-number .unit {
  @apply text-sm text-stone-500;
}

.stats-badge {
  @apply flex items-center gap-1.5 px-3 py-1
         bg-white rounded-full text-xs text-stone-500
         border border-stone-200;
}

.pulse {
  @apply w-2 h-2 bg-green-500 rounded-full;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 响应式 */
@media (max-width: 640px) {
  .stats-content {
    @apply flex-wrap;
  }
  .stats-badge {
    @apply w-full justify-center mt-2;
  }
}
</style>
