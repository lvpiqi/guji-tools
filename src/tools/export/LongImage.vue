<script setup lang="ts">
/**
 * 长图生成工具
 * 将多张图片或文本拼接成小红书风格长图
 */
import { ref, computed, watch } from 'vue'
import FileDropzone from '@components/common/FileDropzone.vue'
import RelatedTools from '@/components/common/RelatedTools.vue'

interface ImageItem {
  id: string
  file: File
  url: string
}

const images = ref<ImageItem[]>([])
const textContent = ref('')
const mode = ref<'image' | 'text'>('image')

// 样式设置
const bgColor = ref('#f5f0e6')
const padding = ref(40)
const gap = ref(20)
const borderRadius = ref(0)
const showWatermark = ref(true)
const watermarkText = ref('古籍工具')

// 文本模式设置
const textFontSize = ref(18)
const textLineHeight = ref(2)
const textColor = ref('#3d3d3d')
const textWidth = ref(600)

const generating = ref(false)
const resultUrl = ref<string | null>(null)

const previewStyle = computed(() => ({
  backgroundColor: bgColor.value,
  padding: `${padding.value}px`,
  borderRadius: `${borderRadius.value}px`,
}))

function handleFiles(files: File[]) {
  for (const file of files) {
    images.value.push({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file)
    })
  }
}

function removeImage(id: string) {
  const idx = images.value.findIndex(i => i.id === id)
  if (idx !== -1) {
    URL.revokeObjectURL(images.value[idx].url)
    images.value.splice(idx, 1)
  }
}

function moveImage(id: string, direction: 'up' | 'down') {
  const idx = images.value.findIndex(i => i.id === id)
  if (idx === -1) return
  const newIdx = direction === 'up' ? idx - 1 : idx + 1
  if (newIdx < 0 || newIdx >= images.value.length) return
  const temp = images.value[idx]
  images.value[idx] = images.value[newIdx]
  images.value[newIdx] = temp
}

async function generateLongImage() {
  generating.value = true
  
  try {
    if (mode.value === 'image') {
      await generateFromImages()
    } else {
      await generateFromText()
    }
  } catch (e) {
    console.error('Generate error:', e)
    alert('生成失败')
  } finally {
    generating.value = false
  }
}

async function generateFromImages() {
  if (images.value.length === 0) return
  
  // 加载所有图片
  const loadedImages: HTMLImageElement[] = []
  for (const item of images.value) {
    const img = await loadImage(item.url)
    loadedImages.push(img)
  }
  
  // 计算画布尺寸
  const maxWidth = Math.max(...loadedImages.map(img => img.width))
  const totalHeight = loadedImages.reduce((sum, img) => {
    const scale = maxWidth / img.width
    return sum + img.height * scale
  }, 0)
  
  const canvasWidth = maxWidth + padding.value * 2
  const canvasHeight = totalHeight + padding.value * 2 + gap.value * (loadedImages.length - 1)
  
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')!
  
  // 绘制背景
  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  
  // 绘制图片
  let y = padding.value
  for (const img of loadedImages) {
    const scale = maxWidth / img.width
    const drawWidth = maxWidth
    const drawHeight = img.height * scale
    
    if (borderRadius.value > 0) {
      roundedImage(ctx, padding.value, y, drawWidth, drawHeight, borderRadius.value)
      ctx.clip()
    }
    
    ctx.drawImage(img, padding.value, y, drawWidth, drawHeight)
    ctx.restore()
    
    y += drawHeight + gap.value
  }
  
  // 水印
  if (showWatermark.value && watermarkText.value) {
    ctx.font = '14px sans-serif'
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.textAlign = 'right'
    ctx.fillText(watermarkText.value, canvasWidth - 20, canvasHeight - 20)
  }
  
  // 输出
  const blob = await canvasToBlob(canvas)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = URL.createObjectURL(blob)
}

async function generateFromText() {
  if (!textContent.value.trim()) return
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  // 设置字体以测量文本
  ctx.font = `${textFontSize.value}px "Songti SC", "SimSun", serif`
  
  // 分行
  const lines = wrapText(ctx, textContent.value, textWidth.value)
  const lineHeightPx = textFontSize.value * textLineHeight.value
  
  // 计算画布尺寸
  const canvasWidth = textWidth.value + padding.value * 2
  const canvasHeight = lines.length * lineHeightPx + padding.value * 2
  
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  
  // 绘制背景
  ctx.fillStyle = bgColor.value
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  
  // 绘制文本
  ctx.font = `${textFontSize.value}px "Songti SC", "SimSun", serif`
  ctx.fillStyle = textColor.value
  ctx.textBaseline = 'top'
  
  let y = padding.value
  for (const line of lines) {
    ctx.fillText(line, padding.value, y)
    y += lineHeightPx
  }
  
  // 水印
  if (showWatermark.value && watermarkText.value) {
    ctx.font = '14px sans-serif'
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.textAlign = 'right'
    ctx.fillText(watermarkText.value, canvasWidth - 20, canvasHeight - 20)
  }
  
  const blob = await canvasToBlob(canvas)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = URL.createObjectURL(blob)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n')
  const lines: string[] = []
  
  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('')
      continue
    }
    
    let currentLine = ''
    for (const char of para) {
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)
  }
  
  return lines
}

function roundedImage(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed')), 'image/png')
  })
}

function download() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = `长图_${Date.now()}.png`
  a.click()
}

function clearAll() {
  images.value.forEach(i => URL.revokeObjectURL(i.url))
  images.value = []
  textContent.value = ''
  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = null
  }
}

watch(mode, () => {
  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = null
  }
})
</script>

<template>
  <div class="tool-page">
    <header class="tool-header">
      <h1 class="tool-title">长图生成</h1>
      <p class="tool-desc">将多张古籍图片或文本拼接成小红书风格长图，支持自定义背景和水印</p>
    </header>

    <div class="tool-body">
      <div class="tool-left">
        <!-- 模式切换 -->
        <div class="mode-tabs">
          <button :class="{ active: mode === 'image' }" @click="mode = 'image'">图片拼接</button>
          <button :class="{ active: mode === 'text' }" @click="mode = 'text'">文本长图</button>
        </div>

        <!-- 图片模式 -->
        <template v-if="mode === 'image'">
          <FileDropzone accept="image/*" :max-size="20" @files="handleFiles" />
          
          <div v-if="images.length" class="image-list">
            <div v-for="(img, idx) in images" :key="img.id" class="image-item">
              <img :src="img.url" class="thumb" />
              <span class="name">{{ img.file.name }}</span>
              <div class="actions">
                <button @click="moveImage(img.id, 'up')" :disabled="idx === 0">↑</button>
                <button @click="moveImage(img.id, 'down')" :disabled="idx === images.length - 1">↓</button>
                <button @click="removeImage(img.id)" class="remove">×</button>
              </div>
            </div>
          </div>
        </template>

        <!-- 文本模式 -->
        <template v-else>
          <textarea
            v-model="textContent"
            placeholder="输入要生成长图的文本内容..."
            class="text-input"
          ></textarea>
          
          <div class="settings-panel">
            <div class="setting-item">
              <span>字号: {{ textFontSize }}px</span>
              <input v-model.number="textFontSize" type="range" min="14" max="28" />
            </div>
            <div class="setting-item">
              <span>行高: {{ textLineHeight }}</span>
              <input v-model.number="textLineHeight" type="range" min="1.5" max="3" step="0.1" />
            </div>
            <div class="setting-item">
              <span>宽度: {{ textWidth }}px</span>
              <input v-model.number="textWidth" type="range" min="400" max="800" step="50" />
            </div>
          </div>
        </template>

        <!-- 通用设置 -->
        <div class="settings-panel">
          <h3 class="settings-title">样式设置</h3>
          
          <div class="setting-item">
            <span>背景色</span>
            <input v-model="bgColor" type="color" class="color-input" />
          </div>
          
          <div class="setting-item">
            <span>内边距: {{ padding }}px</span>
            <input v-model.number="padding" type="range" min="0" max="80" />
          </div>
          
          <div class="setting-item" v-if="mode === 'image'">
            <span>图片间距: {{ gap }}px</span>
            <input v-model.number="gap" type="range" min="0" max="40" />
          </div>
          
          <label class="setting-item">
            <input type="checkbox" v-model="showWatermark" />
            <span>显示水印</span>
          </label>
          
          <div v-if="showWatermark" class="setting-item">
            <input v-model="watermarkText" type="text" placeholder="水印文字" class="text-sm-input" />
          </div>
        </div>

        <div class="tool-actions">
          <button 
            class="btn-primary" 
            :disabled="generating || (mode === 'image' ? images.length === 0 : !textContent.trim())"
            @click="generateLongImage"
          >
            {{ generating ? '生成中...' : '生成长图' }}
          </button>
          <button v-if="resultUrl" class="btn-success" @click="download">下载</button>
          <button class="btn-text" @click="clearAll">清空</button>
        </div>
      </div>

      <div class="tool-preview">
        <div v-if="resultUrl" class="result-container">
          <img :src="resultUrl" class="result-image" alt="生成结果" />
        </div>
        <div v-else class="preview-empty">
          <span>预览区域</span>
        </div>
      </div>
    </div>

    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page { @apply max-w-6xl mx-auto; }
.tool-header { @apply mb-6; }
.tool-title { @apply text-2xl font-bold text-stone-800; }
.tool-desc { @apply text-stone-600 mt-1; }
.tool-body { @apply grid grid-cols-1 lg:grid-cols-2 gap-6; }
.tool-left { @apply space-y-4; }
.mode-tabs { @apply flex gap-2 bg-stone-100 p-1 rounded-lg; }
.mode-tabs button { @apply flex-1 py-2 px-4 rounded-md text-sm text-stone-600 transition-colors; }
.mode-tabs button.active { @apply bg-white text-amber-600 shadow-sm; }
.image-list { @apply bg-white rounded-lg border border-stone-200 divide-y; }
.image-item { @apply flex items-center gap-3 p-2; }
.thumb { @apply w-12 h-12 object-cover rounded; }
.name { @apply flex-1 text-sm text-stone-700 truncate; }
.actions { @apply flex gap-1; }
.actions button { @apply w-6 h-6 text-xs bg-stone-100 rounded hover:bg-stone-200; }
.actions button.remove { @apply bg-red-100 text-red-600 hover:bg-red-200; }
.text-input { @apply w-full h-40 px-3 py-2 border border-stone-300 rounded-lg resize-none font-serif; }
.settings-panel { @apply bg-white rounded-lg border border-stone-200 p-4; }
.settings-title { @apply font-medium text-stone-800 mb-3; }
.setting-item { @apply flex items-center gap-2 py-2 text-sm text-stone-700; }
.setting-item input[type="range"] { @apply flex-1 accent-amber-500; }
.setting-item input[type="checkbox"] { @apply w-4 h-4 accent-amber-500; }
.color-input { @apply w-8 h-8 rounded cursor-pointer; }
.text-sm-input { @apply flex-1 px-2 py-1 border border-stone-300 rounded text-sm; }
.tool-actions { @apply flex gap-3 flex-wrap; }
.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed; }
.btn-success { @apply px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600; }
.btn-text { @apply px-4 py-2 text-stone-500 hover:text-stone-700; }
.tool-preview { @apply bg-white rounded-xl border border-stone-200 p-4 min-h-[400px] flex items-center justify-center overflow-auto; }
.result-container { @apply max-h-[600px] overflow-auto; }
.result-image { @apply max-w-full; }
.preview-empty { @apply text-stone-400; }
</style>
