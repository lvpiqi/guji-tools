<script setup lang="ts">
/**
 * 最近使用的工具组件
 * 仅登录用户可见，显示用户最近使用过的工具
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// 所有工具信息
const allTools: Record<string, { name: string; icon: string; desc: string }> = {
  '/input/remove-finger': { name: '去手指阴影', icon: '👆', desc: '去除拍摄时的手指和阴影' },
  '/input/deskew': { name: '自动纠偏', icon: '📐', desc: '校正倾斜的扫描图像' },
  '/input/ocr-vertical': { name: '竖排OCR', icon: '📝', desc: '古籍竖排文字识别' },
  '/input/punctuation': { name: '自动句读', icon: '。', desc: '为古文添加标点符号' },
  '/input/convert': { name: '繁简转换', icon: '繁', desc: '繁体简体双向转换' },
  '/input/batch-rename': { name: '批量重命名', icon: '📁', desc: '批量重命名并打包' },
  '/input/segmentation': { name: '古汉语分词', icon: '✂️', desc: '文言文自动分词' },
  '/input/pinyin': { name: '拼音注音', icon: '🔤', desc: '为古文添加拼音' },
  '/clean/background-unify': { name: '背景统一', icon: '🌅', desc: '统一页面背景色' },
  '/clean/inpaint': { name: '蠹鱼眼修复', icon: '🔧', desc: 'AI智能修复虫蛀墨点' },
  '/clean/super-resolution': { name: 'AI超分', icon: '🔬', desc: '提升图像分辨率' },
  '/clean/extract-seal': { name: '印章提取', icon: '🔴', desc: '从文档中提取印章' },
  '/clean/spine-remove': { name: '中缝阴影', icon: '📖', desc: '消除书籍中缝黑影' },
  '/clean/compress': { name: '视觉压缩', icon: '🗜️', desc: '转换WebP/AVIF格式' },
  '/clean/blank-detect': { name: '空白页检测', icon: '📄', desc: '检测空白和重复页' },
  '/clean/stain-remove': { name: '水渍修复', icon: '💧', desc: '修复水渍和黄斑' },
  '/read/vertical-horizontal': { name: '竖横排转换', icon: '↔️', desc: '竖排转横排显示' },
  '/read/dictionary': { name: '划词释义', icon: '📚', desc: '选中文字即时释义' },
  '/read/tts': { name: '古文朗读', icon: '🔊', desc: '文字转语音朗读' },
  '/read/translate': { name: '自动翻译', icon: '🌐', desc: '文言文翻译' },
  '/search/variant-search': { name: '异体字搜索', icon: '字', desc: '搜索异体字内容' },
  '/search/diff-compare': { name: '版本对比', icon: '⚖️', desc: '对比文本差异' },
  '/export/dual-layer-pdf': { name: '双层PDF', icon: '📄', desc: '图像+可搜索文本' },
  '/export/epub': { name: 'EPUB生成', icon: '📱', desc: '生成电子书格式' },
  '/export/long-image': { name: '长图生成', icon: '📜', desc: '多页合并为长图' },
  '/export/plain-text': { name: '纯文本导出', icon: '📝', desc: '导出TXT/MD格式' },
  '/pro/glyph-evolution': { name: '字形演变', icon: '甲', desc: '汉字演变历程' },
  '/pro/rhyme-check': { name: '押韵检测', icon: '韵', desc: '检测诗词押韵' },
  '/pro/color-palette': { name: '古画色卡', icon: '🎨', desc: '提取传统色彩' },
  '/pro/summary': { name: '自动摘要', icon: '📋', desc: 'AI生成摘要' },
}

// 获取最近使用的工具（从 localStorage）
const RECENT_KEY = 'guji_recent_tools'

function getRecentTools(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

// 最近使用的工具列表（最多显示6个）
const recentTools = computed(() => {
  const paths = getRecentTools()
  return paths
    .filter(path => allTools[path])
    .slice(0, 6)
    .map(path => ({
      path,
      ...allTools[path]
    }))
})

// 是否显示组件
const showRecent = computed(() => {
  return auth.isAuthenticated && recentTools.value.length > 0
})
</script>

<template>
  <section v-if="showRecent" class="recent-tools" aria-label="最近使用">
    <div class="section-header">
      <h2 class="section-title">⏱️ 最近使用</h2>
      <span class="section-hint">继续上次的工作</span>
    </div>
    <div class="recent-grid">
      <router-link
        v-for="tool in recentTools"
        :key="tool.path"
        :to="tool.path"
        class="recent-card"
      >
        <span class="recent-icon">{{ tool.icon }}</span>
        <div class="recent-info">
          <span class="recent-name">{{ tool.name }}</span>
          <span class="recent-desc">{{ tool.desc }}</span>
        </div>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.recent-tools {
  @apply mb-8;
}

.section-header {
  @apply flex items-center justify-between mb-4;
}
.section-title {
  @apply text-lg font-semibold text-stone-800;
}
.section-hint {
  @apply text-sm text-stone-400;
}

.recent-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3;
}

.recent-card {
  @apply flex items-center gap-3 p-3
         bg-white rounded-xl border border-stone-200
         hover:border-amber-400 hover:shadow-md
         transition-all cursor-pointer;
}

.recent-icon {
  @apply text-2xl w-10 h-10 flex items-center justify-center
         bg-amber-50 rounded-lg flex-shrink-0;
}

.recent-info {
  @apply flex-1 min-w-0;
}
.recent-name {
  @apply block text-sm font-medium text-stone-800 truncate;
}
.recent-desc {
  @apply block text-xs text-stone-400 truncate;
}
</style>
