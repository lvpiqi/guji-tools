<script setup lang="ts">
/**
 * 工具分类页面
 * 显示该分类下的所有工具
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const categoryId = computed(() => route.path.split('/')[1])

const categoryInfo: Record<string, { name: string; desc: string; icon: string }> = {
  input: { name: '输入场景', desc: '拍摄、扫描、OCR识别、文本处理', icon: '📷' },
  clean: { name: '清理场景', desc: '修复、增强、提取、优化图像', icon: '✨' },
  read: { name: '阅读场景', desc: '版式转换、注释、朗读', icon: '📖' },
  search: { name: '搜索场景', desc: '全文搜索、版本对比、异体字', icon: '🔍' },
  export: { name: '输出场景', desc: 'PDF、EPUB、长图导出', icon: '📤' },
  pro: { name: '专业场景', desc: '文字学、音韵学、AI分析', icon: '🎓' },
}

const toolsData: Record<string, Array<{ name: string; desc: string; path: string; icon: string }>> = {
  input: [
    { name: '去手指阴影', desc: '一键去除拍摄时的手指和阴影', path: '/input/remove-finger', icon: '👆' },
    { name: '自动纠偏', desc: '校正倾斜的扫描图像', path: '/input/deskew', icon: '📐' },
    { name: '竖排OCR', desc: '专为古籍竖排文字优化的识别', path: '/input/ocr-vertical', icon: '📝' },
    { name: '自动句读', desc: '为古文自动添加标点符号', path: '/input/punctuation', icon: '。' },
    { name: '繁简转换', desc: '繁体简体双向转换', path: '/input/convert', icon: '繁' },
    { name: '批量重命名ZIP', desc: '按"卷-页-面"规则批量重命名并打包', path: '/input/batch-rename', icon: '📁' },
    { name: '古汉语分词', desc: '文言文自动分词+词性标注', path: '/input/segmentation', icon: '📝' },
    { name: '拼音注音', desc: '为古文添加拼音/注音/粤语标注', path: '/input/pinyin', icon: '🔤' },
  ],
  clean: [
    { name: '背景统一/匀光', desc: '统一页面背景色，消除光照不均', path: '/clean/background-unify', icon: '🌅' },
    { name: '蠹鱼眼修复', desc: 'AI智能修复虫蛀墨点', path: '/clean/inpaint', icon: '🔧' },
    { name: 'AI超分', desc: '提升图像分辨率和清晰度', path: '/clean/super-resolution', icon: '🔬' },
    { name: '印章提取', desc: '从文档中提取印章图像', path: '/clean/extract-seal', icon: '🔴' },
    { name: '中缝阴影补偿', desc: '消除书籍中缝的黑影', path: '/clean/spine-remove', icon: '📖' },
    { name: '视觉无损压缩', desc: '转换WebP/AVIF格式，大幅减小体积', path: '/clean/compress', icon: '🗜️' },
    { name: '空白/重复页检测', desc: '自动检测空白页和重复页', path: '/clean/blank-detect', icon: '🔍' },
    { name: '水渍/黄斑修复', desc: '自动修复水渍和黄斑', path: '/clean/stain-remove', icon: '💧' },
  ],
  read: [
    { name: '竖横排转换', desc: '竖排文字转横排显示', path: '/read/vertical-horizontal', icon: '↔️' },
    { name: '划词释义', desc: '选中文字即时查看释义', path: '/read/dictionary', icon: '📚' },
    { name: '古文朗读', desc: '文字转语音朗读', path: '/read/tts', icon: '🔊' },
    { name: '自动翻译', desc: '文言→现代汉语→英文', path: '/read/translate', icon: '🌐' },
  ],
  search: [
    { name: '异体字搜索', desc: '搜索包含异体字的内容', path: '/search/variant-search', icon: '字' },
    { name: '版本对比', desc: '对比不同版本的文本差异', path: '/search/diff-compare', icon: '⚖️' },
  ],
  export: [
    { name: '双层PDF', desc: '图像+可搜索文本层', path: '/export/dual-layer-pdf', icon: '📄' },
    { name: 'EPUB生成', desc: '生成电子书格式', path: '/export/epub', icon: '📱' },
    { name: '长图生成', desc: '多页合并为长图', path: '/export/long-image', icon: '📜' },
    { name: '纯文本导出', desc: '导出TXT/MD格式，支持标点处理', path: '/export/plain-text', icon: '📄' },
  ],
  pro: [
    { name: '字形演变', desc: '查看汉字从甲骨文到楷书的演变', path: '/pro/glyph-evolution', icon: '甲' },
    { name: '押韵检测', desc: '检测诗词的押韵情况', path: '/pro/rhyme-check', icon: '韵' },
    { name: '古画色卡', desc: '提取古画的传统色彩', path: '/pro/color-palette', icon: '🎨' },
    { name: '自动摘要', desc: 'AI生成摘要、关键词、主题分析', path: '/pro/summary', icon: '📋' },
  ],
}

const info = computed(() => categoryInfo[categoryId.value] || { name: '工具', desc: '', icon: '🔧' })
const tools = computed(() => toolsData[categoryId.value] || [])
</script>

<template>
  <div class="category-page">
    <header class="category-header">
      <span class="category-icon">{{ info.icon }}</span>
      <div>
        <h1>{{ info.name }}</h1>
        <p>{{ info.desc }}</p>
      </div>
    </header>

    <div class="tools-grid">
      <router-link
        v-for="tool in tools"
        :key="tool.path"
        :to="tool.path"
        class="tool-card"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <div class="tool-info">
          <h3>{{ tool.name }}</h3>
          <p>{{ tool.desc }}</p>
        </div>
        <span class="arrow">→</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.category-page { @apply max-w-4xl mx-auto; }

.category-header {
  @apply flex items-center gap-4 mb-6 pb-4 border-b border-stone-200;
}
.category-icon { @apply text-4xl; }
.category-header h1 { @apply text-xl md:text-2xl font-bold text-stone-800; }
.category-header p { @apply text-sm text-stone-500 mt-1; }

.tools-grid { @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4; }

.tool-card {
  @apply flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all;
}
.tool-icon { @apply text-2xl md:text-3xl; }
.tool-info { @apply flex-1; }
.tool-info h3 { @apply font-medium text-stone-800; }
.tool-info p { @apply text-sm text-stone-500 mt-0.5; }
.arrow { @apply text-stone-400 text-xl; }
</style>
