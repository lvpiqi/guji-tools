<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const categories = [
  { id: 'input', name: '输入', icon: '📷', desc: '拍摄·扫描·OCR', path: '/input' },
  { id: 'clean', name: '清理', icon: '✨', desc: '修复·增强·提取', path: '/clean' },
  { id: 'read', name: '阅读', icon: '📖', desc: '版式·注释·朗读', path: '/read' },
  { id: 'search', name: '搜索', icon: '🔍', desc: '全文·对比·元数据', path: '/search' },
  { id: 'export', name: '输出', icon: '📤', desc: 'PDF·EPUB·分享', path: '/export' },
  { id: 'pro', name: '专业', icon: '🎓', desc: '文字学·音韵·AI', path: '/pro' },
]

const tools: Record<string, Array<{ name: string; path: string; icon: string }>> = {
  input: [
    { name: '去手指阴影', path: '/input/remove-finger', icon: '👆' },
    { name: '自动纠偏', path: '/input/deskew', icon: '📐' },
    { name: '竖排OCR', path: '/input/ocr-vertical', icon: '📝' },
    { name: '自动句读', path: '/input/punctuation', icon: '。' },
    { name: '繁简转换', path: '/input/convert', icon: '繁' },
    { name: '批量重命名', path: '/input/batch-rename', icon: '📁' },
    { name: '古汉语分词', path: '/input/segmentation', icon: '✂️' },
    { name: '拼音注音', path: '/input/pinyin', icon: '🔤' },
  ],
  clean: [
    { name: '背景统一', path: '/clean/background-unify', icon: '🌅' },
    { name: '蠹鱼眼修复', path: '/clean/inpaint', icon: '🔧' },
    { name: 'AI超分', path: '/clean/super-resolution', icon: '🔬' },
    { name: '印章提取', path: '/clean/extract-seal', icon: '🔴' },
    { name: '中缝阴影', path: '/clean/spine-remove', icon: '📖' },
    { name: '视觉压缩', path: '/clean/compress', icon: '🗜️' },
    { name: '空白页检测', path: '/clean/blank-detect', icon: '📄' },
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
    { name: '纯文本导出', path: '/export/plain-text', icon: '📝' },
  ],
  pro: [
    { name: '字形演变', path: '/pro/glyph-evolution', icon: '甲' },
    { name: '押韵检测', path: '/pro/rhyme-check', icon: '韵' },
    { name: '古画色卡', path: '/pro/color-palette', icon: '🎨' },
    { name: '自动摘要', path: '/pro/summary', icon: '📋' },
  ],
}

// 展开的分类
const expandedCategory = ref<string>('')

// 根据路由自动展开对应分类
const activeCategory = computed(() => {
  const path = route.path
  return categories.find(c => path.startsWith(c.path))?.id || ''
})

watch(activeCategory, (val) => {
  if (val) expandedCategory.value = val
}, { immediate: true })

function toggleCategory(id: string) {
  expandedCategory.value = expandedCategory.value === id ? '' : id
}
</script>

<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <div v-for="cat in categories" :key="cat.id" class="nav-group">
        <!-- 分类标题 -->
        <button
          class="nav-category"
          :class="{ active: activeCategory === cat.id, expanded: expandedCategory === cat.id }"
          @click="toggleCategory(cat.id)"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <div class="cat-info">
            <span class="cat-name">{{ cat.name }}</span>
          </div>
          <span class="cat-arrow">{{ expandedCategory === cat.id ? '▼' : '▶' }}</span>
        </button>
        
        <!-- 工具列表 -->
        <transition name="slide">
          <div v-if="expandedCategory === cat.id" class="nav-tools">
            <router-link
              v-for="tool in tools[cat.id]"
              :key="tool.path"
              :to="tool.path"
              class="nav-tool"
              :class="{ active: route.path === tool.path }"
            >
              <span class="tool-name">{{ tool.name }}</span>
            </router-link>
          </div>
        </transition>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  @apply w-48 bg-white border-r border-stone-200 overflow-y-auto;
  @apply hidden md:block;
}

.sidebar-nav {
  @apply py-2;
}

.nav-group {
  @apply mb-0.5;
}

/* 分类按钮 - 大而醒目 */
.nav-category {
  @apply w-full flex items-center gap-2 px-3 py-3
         text-left transition-all cursor-pointer
         bg-stone-50 hover:bg-stone-100
         border-b border-stone-200;
}
.nav-category.expanded {
  @apply bg-amber-500 text-white hover:bg-amber-600;
}

.cat-icon {
  @apply text-lg flex-shrink-0;
}

.cat-info {
  @apply flex-1 min-w-0;
}
.cat-name {
  @apply block text-sm font-bold;
}

.cat-arrow {
  @apply text-xs opacity-60 flex-shrink-0;
}

/* 工具列表 - 小而简洁 */
.nav-tools {
  @apply py-1 bg-white;
}

.nav-tool {
  @apply block px-4 py-1.5 pl-8
         text-sm text-stone-600 
         hover:text-amber-600 hover:bg-amber-50
         transition-all border-l-2 border-transparent;
}
.nav-tool.active {
  @apply text-amber-600 bg-amber-50 border-l-2 border-amber-500 font-medium;
}

.tool-name {
  @apply truncate;
}

/* 展开动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.15s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}
.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 400px;
}
</style>
