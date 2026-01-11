<script setup lang="ts">
import { ref } from 'vue'
import RelatedTools from '@/components/common/RelatedTools.vue'

const imageFile = ref<File | null>(null)
const imageUrl = ref('')
const resultUrl = ref('')
const processing = ref(false)
const strength = ref(50)
const preserveText = ref(true)

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]
  if (file?.type.startsWith('image/')) loadImage(file)
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadImage(file)
}

function loadImage(file: File) {
  imageFile.value = file
  imageUrl.value = URL.createObjectURL(file)
  resultUrl.value = ''
}

async function processImage() {
  if (!imageFile.value) return
  processing.value = true
  try {
    const img = new Image()
    img.src = imageUrl.value
    await new Promise(r => img.onload = r)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const isYellow = r > 180 && g > 160 && b < 150 && (r - b) > 40
      const isWater = r > 150 && g > 140 && b > 120 && Math.abs(r - g) < 30 && (r + g + b) / 3 < 200
      if (isYellow || isWater) {
        const factor = strength.value / 100
        const avg = (r + g + b) / 3
        const target = preserveText.value ? Math.max(avg, 240) : 250
        data[i] = Math.round(r + (target - r) * factor)
        data[i + 1] = Math.round(g + (target - g) * factor)
        data[i + 2] = Math.round(b + (target - b) * factor)
      }
    }
    ctx.putImageData(imageData, 0, 0)
    resultUrl.value = canvas.toDataURL('image/png')
  } finally { processing.value = false }
}

function download() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = `stain_removed_${imageFile.value?.name || 'image.png'}`
  a.click()
}

function clearAll() {
  imageFile.value = null
  imageUrl.value = ''
  resultUrl.value = ''
}
</script>

<template>
  <div class="tool-page">
    <header class="tool-header">
      <h1>💧 水渍/黄斑修复</h1>
      <p>自动检测并修复古籍图像上的水渍和黄斑</p>
    </header>
    <div class="settings-section">
      <div class="setting-group">
        <label>修复强度: {{ strength }}%</label>
        <input type="range" v-model="strength" min="10" max="100" class="slider" />
      </div>
      <div class="setting-group">
        <label class="checkbox"><input type="checkbox" v-model="preserveText" /> 保护文字区域</label>
      </div>
    </div>
    <div v-if="!imageUrl" class="upload-zone" @drop="handleDrop" @dragover.prevent @click="($refs.fileInput as HTMLInputElement).click()">
      <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFileSelect" />
      <p class="upload-text">📁 拖放图片到此处，或点击选择</p>
    </div>
    <div v-else class="preview-section">
      <div class="preview-grid">
        <div class="preview-item"><h3>原图</h3><img :src="imageUrl" alt="原图" /></div>
        <div class="preview-item">
          <h3>修复后</h3>
          <img v-if="resultUrl" :src="resultUrl" alt="修复后" />
          <div v-else class="placeholder">点击"开始修复"</div>
        </div>
      </div>
      <div class="actions">
        <button @click="processImage" :disabled="processing" class="process-btn">{{ processing ? '处理中...' : '开始修复' }}</button>
        <button v-if="resultUrl" @click="download" class="download-btn">下载结果</button>
        <button @click="clearAll" class="clear-btn">重新选择</button>
      </div>
    </div>

    <!-- 相关工具 -->
    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page { @apply max-w-4xl mx-auto; }
.tool-header { @apply mb-6; }
.tool-header h1 { @apply text-xl md:text-2xl font-bold text-stone-800; }
.tool-header p { @apply text-stone-500 mt-1; }
.settings-section { @apply bg-white rounded-xl p-4 mb-4 flex flex-wrap gap-6; }
.setting-group { @apply flex flex-col gap-1; }
.setting-group label { @apply text-sm text-stone-600; }
.slider { @apply w-48; }
.checkbox { @apply flex items-center gap-2 cursor-pointer; }
.upload-zone { @apply bg-white border-2 border-dashed border-stone-300 rounded-xl p-12 text-center cursor-pointer hover:border-amber-400; }
.upload-text { @apply text-stone-600; }
.preview-section { @apply bg-white rounded-xl p-4; }
.preview-grid { @apply grid md:grid-cols-2 gap-4 mb-4; }
.preview-item h3 { @apply text-sm font-medium text-stone-600 mb-2; }
.preview-item img { @apply w-full rounded-lg border border-stone-200; }
.placeholder { @apply aspect-video bg-stone-100 rounded-lg flex items-center justify-center text-stone-400; }
.actions { @apply flex gap-3; }
.process-btn { @apply px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50; }
.download-btn { @apply px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600; }
.clear-btn { @apply px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50; }
</style>
