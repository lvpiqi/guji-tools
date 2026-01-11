<script setup lang="ts">
/**
 * 双层PDF导出工具
 * 图像层 + 可搜索文本层
 */
import { ref, computed } from 'vue'
import FileDropzone from '@components/common/FileDropzone.vue'
import ProgressBar from '@components/common/ProgressBar.vue'
import RelatedTools from '@/components/common/RelatedTools.vue'

interface PageItem {
  id: string
  file: File
  previewUrl: string
  text: string // OCR文本或手动输入
  width: number
  height: number
}

const pages = ref<PageItem[]>([])
const selectedId = ref<string | null>(null)
const processing = ref(false)
const progress = ref(0)

// PDF设置
const pdfTitle = ref('古籍扫描')
const pdfAuthor = ref('')
const pageSize = ref<'original' | 'a4' | 'a5'>('original')
const textVisible = ref(false) // 文字是否可见（调试用）

const currentPage = computed(() => pages.value.find(p => p.id === selectedId.value))
const currentIndex = computed(() => pages.value.findIndex(p => p.id === selectedId.value))

async function handleFiles(files: File[]) {
  for (const file of files) {
    const img = await loadImage(file)
    const page: PageItem = {
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      text: '',
      width: img.width,
      height: img.height
    }
    pages.value.push(page)
    if (!selectedId.value) {
      selectedId.value = page.id
    }
  }
}

function movePage(fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= pages.value.length) return
  const item = pages.value.splice(fromIndex, 1)[0]
  pages.value.splice(toIndex, 0, item)
}

function removePage(id: string) {
  const index = pages.value.findIndex(p => p.id === id)
  if (index !== -1) {
    URL.revokeObjectURL(pages.value[index].previewUrl)
    pages.value.splice(index, 1)
    if (selectedId.value === id) {
      selectedId.value = pages.value[0]?.id || null
    }
  }
}

async function generatePdf() {
  if (pages.value.length === 0) return

  processing.value = true
  progress.value = 0

  try {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
    
    const pdfDoc = await PDFDocument.create()
    
    // 设置元数据
    pdfDoc.setTitle(pdfTitle.value)
    if (pdfAuthor.value) {
      pdfDoc.setAuthor(pdfAuthor.value)
    }
    pdfDoc.setCreator('古籍工具')
    pdfDoc.setProducer('guji-tools')

    // 嵌入字体（用于文本层）
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    for (let i = 0; i < pages.value.length; i++) {
      const pageItem = pages.value[i]
      progress.value = Math.round(((i + 0.5) / pages.value.length) * 100)

      // 计算页面尺寸
      let pageWidth = pageItem.width
      let pageHeight = pageItem.height

      if (pageSize.value === 'a4') {
        // A4: 595 x 842 points
        const scale = Math.min(595 / pageItem.width, 842 / pageItem.height)
        pageWidth = pageItem.width * scale
        pageHeight = pageItem.height * scale
      } else if (pageSize.value === 'a5') {
        // A5: 420 x 595 points
        const scale = Math.min(420 / pageItem.width, 595 / pageItem.height)
        pageWidth = pageItem.width * scale
        pageHeight = pageItem.height * scale
      }

      // 创建页面
      const page = pdfDoc.addPage([pageWidth, pageHeight])

      // 嵌入图像
      const imageBytes = await fileToArrayBuffer(pageItem.file)
      let image
      
      if (pageItem.file.type === 'image/png') {
        image = await pdfDoc.embedPng(imageBytes)
      } else {
        image = await pdfDoc.embedJpg(imageBytes)
      }

      // 绘制图像（底层）
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      })

      // 添加文本层（透明或半透明）
      if (pageItem.text.trim()) {
        const lines = pageItem.text.split('\n')
        const fontSize = 12
        const lineHeight = fontSize * 1.5
        let y = pageHeight - 50

        for (const line of lines) {
          if (y < 50) break
          
          page.drawText(line, {
            x: 50,
            y,
            size: fontSize,
            font,
            color: textVisible.value ? rgb(1, 0, 0) : rgb(1, 1, 1), // 白色=不可见
            opacity: textVisible.value ? 0.5 : 0.01, // 几乎透明但可搜索
          })
          y -= lineHeight
        }
      }

      progress.value = Math.round(((i + 1) / pages.value.length) * 100)
    }

    // 导出PDF
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${pdfTitle.value || 'output'}.pdf`
    a.click()
    
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('PDF generation error:', e)
    alert('PDF生成失败: ' + (e instanceof Error ? e.message : 'Unknown error'))
  } finally {
    processing.value = false
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function clearAll() {
  pages.value.forEach(p => URL.revokeObjectURL(p.previewUrl))
  pages.value = []
  selectedId.value = null
}
</script>

<template>
  <div class="tool-page">
    <header class="tool-header">
      <h1 class="tool-title">双层PDF导出</h1>
      <p class="tool-desc">图像作为背景 + 透明文字层，生成可搜索的PDF文档</p>
    </header>

    <div class="tool-body">
      <!-- 左侧：页面管理 -->
      <div class="tool-left">
        <FileDropzone
          accept="image/jpeg,image/png"
          :max-size="20"
          @files="handleFiles"
        />

        <!-- PDF设置 -->
        <div class="settings-panel">
          <h3 class="settings-title">PDF设置</h3>
          
          <div class="setting-row">
            <label class="setting-label">文档标题</label>
            <input 
              type="text" 
              v-model="pdfTitle" 
              class="setting-input"
              placeholder="古籍扫描"
            />
          </div>

          <div class="setting-row">
            <label class="setting-label">作者</label>
            <input 
              type="text" 
              v-model="pdfAuthor" 
              class="setting-input"
              placeholder="可选"
            />
          </div>

          <div class="setting-row">
            <label class="setting-label">页面尺寸</label>
            <select v-model="pageSize" class="setting-select">
              <option value="original">原始尺寸</option>
              <option value="a4">A4</option>
              <option value="a5">A5</option>
            </select>
          </div>

          <label class="setting-item">
            <input type="checkbox" v-model="textVisible" />
            <span>显示文字层（调试用）</span>
          </label>
        </div>

        <!-- 页面列表 -->
        <div v-if="pages.length" class="page-list">
          <div class="page-list-header">
            <span>页面列表 ({{ pages.length }})</span>
            <button class="btn-text-sm" @click="clearAll">清空</button>
          </div>
          
          <div class="page-items">
            <div
              v-for="(page, index) in pages"
              :key="page.id"
              class="page-item"
              :class="{ active: selectedId === page.id }"
              @click="selectedId = page.id"
            >
              <img :src="page.previewUrl" class="page-thumb" />
              <div class="page-info">
                <span class="page-num">第 {{ index + 1 }} 页</span>
                <span class="page-size">{{ page.width }}×{{ page.height }}</span>
              </div>
              <div class="page-actions">
                <button 
                  class="btn-icon" 
                  :disabled="index === 0"
                  @click.stop="movePage(index, index - 1)"
                >↑</button>
                <button 
                  class="btn-icon" 
                  :disabled="index === pages.length - 1"
                  @click.stop="movePage(index, index + 1)"
                >↓</button>
                <button 
                  class="btn-icon text-red-500" 
                  @click.stop="removePage(page.id)"
                >×</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成按钮 -->
        <div class="tool-actions">
          <button
            class="btn-primary"
            :disabled="pages.length === 0 || processing"
            @click="generatePdf"
          >
            {{ processing ? '生成中...' : '生成PDF' }}
          </button>
        </div>

        <ProgressBar v-if="processing" :value="progress" class="mt-4" />
      </div>

      <!-- 右侧：预览和文本编辑 -->
      <div class="tool-right">
        <template v-if="currentPage">
          <div class="preview-section">
            <img :src="currentPage.previewUrl" class="preview-image" />
          </div>
          
          <div class="text-section">
            <h3 class="text-title">
              第 {{ currentIndex + 1 }} 页文本
              <span class="text-hint">（可选，用于搜索）</span>
            </h3>
            <textarea
              v-model="currentPage.text"
              class="text-input"
              placeholder="粘贴或输入此页的OCR文本，将作为可搜索的隐藏文字层..."
              rows="8"
            ></textarea>
          </div>
        </template>
        <div v-else class="preview-empty">
          <span>上传图片开始制作PDF</span>
        </div>
      </div>
    </div>

    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page {
  @apply max-w-6xl mx-auto;
}
.tool-header {
  @apply mb-6;
}
.tool-title {
  @apply text-2xl font-bold text-stone-800;
}
.tool-desc {
  @apply text-stone-600 mt-1;
}
.tool-body {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}
.tool-left {
  @apply space-y-4;
}
.settings-panel {
  @apply bg-white rounded-lg border border-stone-200 p-4;
}
.settings-title {
  @apply font-medium text-stone-800 mb-3;
}
.setting-row {
  @apply flex items-center gap-2 py-2;
}
.setting-label {
  @apply w-20 text-sm text-stone-600;
}
.setting-input {
  @apply flex-1 px-3 py-1.5 border border-stone-200 rounded-lg text-sm
         focus:border-amber-400 focus:outline-none;
}
.setting-select {
  @apply flex-1 px-3 py-1.5 border border-stone-200 rounded-lg text-sm
         focus:border-amber-400 focus:outline-none;
}
.setting-item {
  @apply flex items-center gap-2 py-2 text-sm text-stone-700;
}
.setting-item input[type="checkbox"] {
  @apply w-4 h-4 accent-amber-500;
}
.page-list {
  @apply bg-white rounded-lg border border-stone-200;
}
.page-list-header {
  @apply flex justify-between items-center px-4 py-2 border-b border-stone-100;
}
.page-items {
  @apply max-h-64 overflow-auto;
}
.page-item {
  @apply flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-stone-50 transition-colors;
}
.page-item.active {
  @apply bg-amber-50;
}
.page-thumb {
  @apply w-12 h-16 object-cover rounded border border-stone-200;
}
.page-info {
  @apply flex-1;
}
.page-num {
  @apply block text-sm text-stone-700;
}
.page-size {
  @apply text-xs text-stone-400;
}
.page-actions {
  @apply flex gap-1;
}
.btn-icon {
  @apply w-6 h-6 text-stone-400 hover:text-stone-600 disabled:opacity-30 transition-colors;
}
.btn-text-sm {
  @apply text-sm text-stone-500 hover:text-amber-600;
}
.tool-actions {
  @apply flex gap-3;
}
.btn-primary {
  @apply px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}
.tool-right {
  @apply space-y-4;
}
.preview-section {
  @apply bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-center;
}
.preview-image {
  @apply max-w-full max-h-[300px] object-contain;
}
.preview-empty {
  @apply bg-white rounded-xl border border-stone-200 p-4 min-h-[400px] flex items-center justify-center text-stone-400;
}
.text-section {
  @apply bg-white rounded-xl border border-stone-200 p-4;
}
.text-title {
  @apply font-medium text-stone-800 mb-2;
}
.text-hint {
  @apply text-sm font-normal text-stone-400;
}
.text-input {
  @apply w-full px-3 py-2 border border-stone-200 rounded-lg text-sm
         focus:border-amber-400 focus:outline-none resize-none;
}
</style>
