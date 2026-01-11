<script setup lang="ts">
/**
 * 相关工具推荐组件
 * 推荐逻辑：同分类 + 工作流关联 + 热门
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 所有工具数据
const allTools: Record<string, Array<{ name: string; path: string; icon: string }>> = {
  input: [
    { name: '去手指阴影', path: '/input/remove-finger', icon: '👆' },
    { name: '自动纠偏', path: '/input/deskew', icon: '📐' },
    { name: '竖排OCR', path: '/input/ocr-vertical', icon: '📝' },
    { name: '自动句读', path: '/input/punctuation', icon: '。' },
    { name: '繁简转换', path: '/input/convert', icon: '繁' },
    { name: '批量重命名', path: '/input/batch-rename', icon: '📁' },
    { name: '古汉语分词', path: '/input/segmentation', icon: '📝' },
    { name: '拼音注音', path: '/input/pinyin', icon: '🔤' },
  ],
  clean: [
    { name: '背景统一', path: '/clean/background-unify', icon: '🌅' },
    { name: '蠹鱼眼修复', path: '/clean/inpaint', icon: '🔧' },
    { name: 'AI超分', path: '/clean/super-resolution', icon: '🔬' },
    { name: '印章提取', path: '/clean/extract-seal', icon: '🔴' },
    { name: '中缝阴影', path: '/clean/spine-remove', icon: '📖' },
    { name: '视觉压缩', path: '/clean/compress', icon: '🗜️' },
    { name: '空白页检测', path: '/clean/blank-detect', icon: '🔍' },
    { name: '水渍修复', path: '/clean/stain-remove', icon: '💧' },
  ],
  read: [
    { name: '竖横排转换', path: '/read/vertical-horizontal', icon: '↔️' },
    { name: '划词释义', path: '/read/dictionary', icon: '📚' },
    { name: '古文朗读', path: '/read/tts', icon: '🔊' },
    { name: '自动翻译', path: '/read/translate', icon: '🌐' },
  ],
  search: [
    { name: '异体字搜索', path: '/search/variant-search', icon: '字' },
    { name: '版本对比', path: '/search/diff-compare', icon: '⚖️' },
  ],
  export: [
    { name: '双层PDF', path: '/export/dual-layer-pdf', icon: '📄' },
    { name: 'EPUB生成', path: '/export/epub', icon: '📱' },
    { name: '长图生成', path: '/export/long-image', icon: '📜' },
    { name: '纯文本导出', path: '/export/plain-text', icon: '📄' },
  ],
  pro: [
    { name: '字形演变', path: '/pro/glyph-evolution', icon: '甲' },
    { name: '押韵检测', path: '/pro/rhyme-check', icon: '韵' },
    { name: '古画色卡', path: '/pro/color-palette', icon: '🎨' },
    { name: '自动摘要', path: '/pro/summary', icon: '📋' },
  ],
}

// 工作流关联：定义工具之间的上下游关系
const workflow: Record<string, string[]> = {
  '/input/remove-finger': ['/input/deskew', '/clean/background-unify'],
  '/input/deskew': ['/input/ocr-vertical', '/clean/background-unify'],
  '/input/ocr-vertical': ['/input/punctuation', '/input/segmentation', '/read/translate'],
  '/input/punctuation': ['/input/segmentation', '/read/translate', '/pro/summary'],
  '/input/segmentation': ['/input/pinyin', '/read/dictionary', '/pro/summary'],
  '/input/pinyin': ['/read/tts', '/export/dual-layer-pdf'],
  '/clean/background-unify': ['/clean/inpaint', '/clean/super-resolution'],
  '/clean/inpaint': ['/clean/super-resolution', '/export/dual-layer-pdf'],
  '/clean/super-resolution': ['/export/dual-layer-pdf', '/export/long-image'],
  '/read/translate': ['/pro/summary', '/export/plain-text'],
  '/pro/summary': ['/read/translate', '/pro/glyph-evolution'],
  '/pro/glyph-evolution': ['/input/pinyin', '/read/dictionary'],
}

// 获取当前分类
const currentCategory = computed(() => route.path.split('/')[1])

// 获取访问统计
function getVisits(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem('guji_tool_visits') || '{}') }
  catch { return {} }
}

// 推荐工具列表
const relatedTools = computed(() => {
  const currentPath = route.path
  const visits = getVisits()
  const result: Array<{ name: string; path: string; icon: string; reason: string }> = []
  const added = new Set<string>([currentPath])

  // 1. 工作流关联（最多2个）
  const workflowTools = workflow[currentPath] || []
  for (const path of workflowTools.slice(0, 2)) {
    const tool = findTool(path)
    if (tool && !added.has(path)) {
      result.push({ ...tool, reason: '推荐下一步' })
      added.add(path)
    }
  }

  // 2. 同分类工具（最多2个）
  const categoryTools = allTools[currentCategory.value] || []
  for (const tool of categoryTools) {
    if (!added.has(tool.path) && result.length < 4) {
      result.push({ ...tool, reason: '同类工具' })
      added.add(tool.path)
    }
  }

  // 3. 热门工具补充（最多2个）
  const hotTools = Object.entries(visits)
    .sort((a, b) => b[1] - a[1])
    .map(([path]) => path)
  for (const path of hotTools) {
    if (!added.has(path) && result.length < 6) {
      const tool = findTool(path)
      if (tool) {
        result.push({ ...tool, reason: '热门' })
        added.add(path)
      }
    }
  }

  return result.slice(0, 6)
})

function findTool(path: string) {
  for (const tools of Object.values(allTools)) {
    const tool = tools.find(t => t.path === path)
    if (tool) return tool
  }
  return null
}
</script>

<template>
  <section v-if="relatedTools.length" class="related-tools" aria-label="相关工具推荐">
    <h3 class="related-title">🔗 相关工具</h3>
    <div class="related-grid">
      <router-link 
        v-for="tool in relatedTools" 
        :key="tool.path" 
        :to="tool.path" 
        class="related-card"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <div class="tool-info">
          <span class="tool-name">{{ tool.name }}</span>
          <span class="tool-reason">{{ tool.reason }}</span>
        </div>
        <span class="tool-arrow">→</span>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.related-tools { 
  @apply mt-8 pt-6 border-t border-stone-200;
}
.related-title { 
  @apply text-lg font-semibold text-stone-800 mb-4;
}
.related-grid { 
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3;
}
.related-card {
  @apply flex items-center gap-3 p-4 bg-white rounded-xl 
         border-2 border-stone-200
         hover:border-amber-400 hover:shadow-md hover:bg-amber-50
         transition-all cursor-pointer;
}
.tool-icon { 
  @apply text-2xl w-10 h-10 flex items-center justify-center
         bg-stone-100 rounded-lg flex-shrink-0;
}
.tool-info {
  @apply flex-1 min-w-0;
}
.tool-name { 
  @apply block text-base font-medium text-stone-800 truncate;
}
.tool-reason { 
  @apply block text-xs text-amber-600 mt-0.5;
}
.tool-arrow {
  @apply text-stone-300 text-lg flex-shrink-0
         group-hover:text-amber-500 transition-colors;
}
.related-card:hover .tool-arrow {
  @apply text-amber-500;
}
</style>
