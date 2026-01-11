<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import RecentTools from '@/components/common/RecentTools.vue'
import UsageStats from '@/components/common/UsageStats.vue'

const router = useRouter()

// SEO - 动态更新 meta（首页 meta 已在 index.html 中设置）
onMounted(() => {
  document.title = '\u53E4\u7C4D\u5DE5\u5177 - \u514D\u8D39\u5728\u7EBF\u53E4\u7C4D\u6570\u5B57\u5316\u5DE5\u5177\u5E73\u53F0'
})

// 所有工具列表
const allTools = [
  { name: '去手指阴影', desc: '一键去除拍摄时的手指和阴影', path: '/input/remove-finger', icon: '👆' },
  { name: '自动纠偏', desc: '校正倾斜的扫描图像', path: '/input/deskew', icon: '📐' },
  { name: '竖排OCR', desc: '专为古籍竖排文字优化的识别', path: '/input/ocr-vertical', icon: '📝' },
  { name: '自动句读', desc: '为古文自动添加标点符号', path: '/input/punctuation', icon: '。' },
  { name: '繁简转换', desc: '繁体简体双向转换', path: '/input/convert', icon: '繁' },
  { name: '批量重命名ZIP', desc: '按规则批量重命名并打包', path: '/input/batch-rename', icon: '📁' },
  { name: '古汉语分词', desc: '文言文自动分词+词性标注', path: '/input/segmentation', icon: '📝' },
  { name: '拼音注音', desc: '为古文添加拼音/注音标注', path: '/input/pinyin', icon: '🔤' },
  { name: '背景统一', desc: '统一页面背景色，消除光照不均', path: '/clean/background-unify', icon: '🌅' },
  { name: '蠹鱼眼修复', desc: 'AI智能修复虫蛀墨点', path: '/clean/inpaint', icon: '🔧' },
  { name: 'AI超分', desc: '提升图像分辨率和清晰度', path: '/clean/super-resolution', icon: '🔬' },
  { name: '印章提取', desc: '从文档中提取印章图像', path: '/clean/extract-seal', icon: '🔴' },
  { name: '中缝阴影补偿', desc: '消除书籍中缝的黑影', path: '/clean/spine-remove', icon: '📖' },
  { name: '视觉无损压缩', desc: '转换WebP/AVIF格式', path: '/clean/compress', icon: '🗜️' },
  { name: '空白页检测', desc: '自动检测空白页和重复页', path: '/clean/blank-detect', icon: '🔍' },
  { name: '水渍修复', desc: '自动修复水渍和黄斑', path: '/clean/stain-remove', icon: '💧' },
  { name: '竖横排转换', desc: '竖排文字转横排显示', path: '/read/vertical-horizontal', icon: '↔️' },
  { name: '划词释义', desc: '选中文字即时查看释义', path: '/read/dictionary', icon: '📚' },
  { name: '古文朗读', desc: '文字转语音朗读', path: '/read/tts', icon: '🔊' },
  { name: '自动翻译', desc: '文言→现代汉语→英文', path: '/read/translate', icon: '🌐' },
  { name: '异体字搜索', desc: '搜索包含异体字的内容', path: '/search/variant-search', icon: '字' },
  { name: '版本对比', desc: '对比不同版本的文本差异', path: '/search/diff-compare', icon: '⚖️' },
  { name: '双层PDF', desc: '图像+可搜索文本层', path: '/export/dual-layer-pdf', icon: '📄' },
  { name: 'EPUB生成', desc: '生成电子书格式', path: '/export/epub', icon: '📱' },
  { name: '长图生成', desc: '多页合并为长图', path: '/export/long-image', icon: '📜' },
  { name: '纯文本导出', desc: '导出TXT/MD格式', path: '/export/plain-text', icon: '📄' },
  { name: '字形演变', desc: '查看汉字从甲骨文到楷书的演变', path: '/pro/glyph-evolution', icon: '甲' },
  { name: '押韵检测', desc: '检测诗词的押韵情况', path: '/pro/rhyme-check', icon: '韵' },
  { name: '古画色卡', desc: '提取古画的传统色彩', path: '/pro/color-palette', icon: '🎨' },
  { name: '自动摘要', desc: 'AI生成摘要、关键词、主题', path: '/pro/summary', icon: '📋' },
]

// 访问统计 key
const VISIT_KEY = 'guji_tool_visits'

// 获取访问统计
function getVisits(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(VISIT_KEY) || '{}')
  } catch { return {} }
}

// 记录访问
function recordVisit(path: string) {
  const visits = getVisits()
  visits[path] = (visits[path] || 0) + 1
  localStorage.setItem(VISIT_KEY, JSON.stringify(visits))
}

// 监听路由变化，记录工具访问
onMounted(() => {
  router.afterEach((to) => {
    if (to.path !== '/' && !to.path.startsWith('/auth') && !to.path.startsWith('/admin')) {
      recordVisit(to.path)
    }
  })
})

// 按访问次数排序的热门工具（取前8个）
const featuredTools = computed(() => {
  const visits = getVisits()
  return [...allTools]
    .sort((a, b) => (visits[b.path] || 0) - (visits[a.path] || 0))
    .slice(0, 8)
})

const categories = [
  { name: '输入', desc: '拍摄、扫描、OCR', count: 8, path: '/input', color: 'bg-blue-100' },
  { name: '清理', desc: '修复、增强、提取', count: 8, path: '/clean', color: 'bg-green-100' },
  { name: '阅读', desc: '版式、注释、朗读', count: 4, path: '/read', color: 'bg-amber-100' },
  { name: '搜索', desc: '全文、对比、元数据', count: 2, path: '/search', color: 'bg-purple-100' },
  { name: '输出', desc: 'PDF、EPUB、分享', count: 4, path: '/export', color: 'bg-pink-100' },
  { name: '专业', desc: '文字学、音韵、AI', count: 4, path: '/pro', color: 'bg-indigo-100' },
]
</script>

<template>
  <main class="home" itemscope itemtype="https://schema.org/WebPage">
    <!-- Hero -->
    <header class="hero">
      <h1 class="hero-title" itemprop="name">古籍数字化工具平台</h1>
      <p class="hero-desc" itemprop="description">
        从纸质到电子，从模糊到清晰，从难读到易懂<br>
        30+ 在线工具，打开即用，无需安装
      </p>
    </header>

    <!-- 使用统计 -->
    <UsageStats />

    <!-- 最近使用 - 仅登录用户可见 -->
    <RecentTools />

    <!-- 热门工具 - 最重要，放最前面 -->
    <section class="section" aria-label="热门工具" itemscope itemtype="https://schema.org/ItemList">
      <h2 class="section-title" itemprop="name">🔥 热门工具</h2>
      <div class="featured-grid">
        <router-link
          v-for="(tool, index) in featuredTools"
          :key="tool.path"
          :to="tool.path"
          class="tool-card"
          itemprop="itemListElement"
          itemscope
          itemtype="https://schema.org/ListItem"
        >
          <meta itemprop="position" :content="String(index + 1)" />
          <span class="tool-icon">{{ tool.icon }}</span>
          <h3 class="tool-name" itemprop="name">{{ tool.name }}</h3>
          <p class="tool-desc" itemprop="description">{{ tool.desc }}</p>
          <span class="tool-badge">点击使用 →</span>
        </router-link>
      </div>
    </section>

    <!-- 分类入口 -->
    <section class="section" aria-label="工具分类">
      <h2 class="section-title">📚 工具分类</h2>
      <nav class="category-grid" aria-label="工具分类导航">
        <router-link
          v-for="cat in categories"
          :key="cat.path"
          :to="cat.path"
          class="category-card"
          :class="cat.color"
        >
          <h3 class="category-name">{{ cat.name }}</h3>
          <p class="category-desc">{{ cat.desc }}</p>
          <span class="category-count">{{ cat.count }} 个工具 →</span>
        </router-link>
      </nav>
    </section>

    <!-- SEO 内容区 - 放底部，视觉低调 -->
    <footer class="seo-footer" aria-label="关于古籍工具">
      <div class="seo-content">
        <h2 class="seo-title">关于古籍工具</h2>
        <p class="seo-text">
          古籍工具是专为古籍数字化设计的在线工具平台。无论您是古籍研究者、图书馆工作者，
          还是传统文化爱好者，都能在这里找到所需的工具。平台提供从图像处理、文字识别、
          到格式转换的完整工具链，助力古籍的保护与传承。
        </p>
        <div class="seo-features">
          <span>🆓 完全免费</span>
          <span>🌐 在线使用</span>
          <span>🔒 隐私安全</span>
          <span>📱 多端适配</span>
        </div>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.home { @apply max-w-5xl mx-auto px-4 pb-8; }

.hero { @apply text-center py-6 md:py-10; }
.hero-title { @apply text-2xl md:text-4xl font-bold text-stone-800 mb-3; }
.hero-desc { @apply text-base md:text-lg text-stone-600 leading-relaxed; }

.section { @apply mb-8 md:mb-10; }
.section-title { @apply text-lg md:text-xl font-semibold text-stone-800 mb-4; }

/* 工具卡片 - 突出可点击 */
.featured-grid { @apply grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4; }
.tool-card {
  @apply p-3 md:p-4 bg-white rounded-xl border-2 border-stone-200
         hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5
         transition-all cursor-pointer relative;
}
.tool-icon { @apply text-2xl md:text-3xl mb-2 block; }
.tool-name { @apply font-semibold text-stone-800 text-sm md:text-base; }
.tool-desc { @apply text-xs md:text-sm text-stone-500 mt-1 mb-6; }
.tool-badge {
  @apply absolute bottom-2 right-2 text-xs text-amber-600 font-medium
         opacity-0 group-hover:opacity-100 transition-opacity;
}
.tool-card:hover .tool-badge { @apply opacity-100; }

/* 分类卡片 */
.category-grid { @apply grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4; }
.category-card { 
  @apply p-3 md:p-4 rounded-xl hover:shadow-md transition-all cursor-pointer
         border-2 border-transparent hover:border-stone-300;
}
.category-name { @apply text-base md:text-lg font-semibold text-stone-800; }
.category-desc { @apply text-xs md:text-sm text-stone-600 mt-1; }
.category-count { @apply text-xs text-stone-500 mt-2 block font-medium; }

/* SEO 底部区域 - 低调 */
.seo-footer {
  @apply mt-12 pt-8 border-t border-stone-200;
}
.seo-content { @apply max-w-3xl mx-auto text-center; }
.seo-title { @apply text-sm font-medium text-stone-400 mb-3; }
.seo-text { @apply text-xs text-stone-400 leading-relaxed mb-4; }
.seo-features { @apply flex flex-wrap justify-center gap-4 text-xs text-stone-400; }
</style>
