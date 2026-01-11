<script setup lang="ts">
/**
 * 水渍/黄斑修复
 * SEO 优化版本
 */
import { ref } from 'vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '污渍修复',
  path: '/clean/stain-remove',
  category: '图像清理',
  categoryPath: '/clean',
  
  description: '免费在线古籍水渍黄斑修复工具。自动检测并修复古籍图像上的水渍、黄斑、霉斑等污渍，还原清晰页面。',
  keywords: ['水渍修复', '黄斑去除', '污渍清理', '古籍修复', '图像修复', '霉斑去除'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '自动检测并修复古籍图像上的水渍和黄斑',
  
  features: [
    '自动检测黄斑区域',
    '自动检测水渍区域',
    '可调节修复强度',
    '保护文字区域选项',
    '实时预览修复效果',
    '支持常见图片格式',
    '本地处理保护隐私',
    '一键下载修复结果'
  ],
  
  howToUse: [
    '上传有水渍或黄斑的古籍图片',
    '调整修复强度（推荐50-70%）',
    '根据需要开启「保护文字区域」',
    '点击「开始修复」进行处理',
    '对比效果，满意后下载结果'
  ],
  
  introduction: `古籍在保存过程中常会出现水渍、黄斑、霉斑等污渍，影响阅读和数字化效果。本工具可以自动检测并修复这些污渍区域。

工具通过颜色分析识别黄斑（偏黄色区域）和水渍（灰褐色不均匀区域），然后将这些区域的颜色向白色方向调整，达到修复效果。

「保护文字区域」选项可以避免修复过程影响到文字的清晰度。建议先用较低强度尝试，逐步调整到满意效果。`,

  faq: [
    {
      question: '修复强度设多少合适？',
      answer: '通常50-70%效果较好。强度太高可能导致背景过白，太低则修复不明显。'
    },
    {
      question: '「保护文字区域」有什么作用？',
      answer: '开启后会尽量保持深色区域（文字）不变，只修复浅色污渍区域。'
    },
    {
      question: '能修复所有类型的污渍吗？',
      answer: '主要针对黄斑和水渍。墨渍、油渍等深色污渍效果有限。'
    },
    {
      question: '修复后文字会变淡吗？',
      answer: '开启「保护文字区域」可以最大程度保护文字。如果文字变淡，可以降低修复强度。'
    },
    {
      question: '处理速度如何？',
      answer: '取决于图片大小。2000x3000的图片通常在2-5秒内完成。'
    }
  ],
  
  supportedFormats: ['JPG', 'PNG', 'WebP'],
  maxFileSize: 20,
  isOffline: true,
  isFree: true
}

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
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">
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
          <ToolFeedback tool-name="污渍修复" />
        </div>
      </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body { @apply max-w-4xl mx-auto space-y-4; }
.settings-section { @apply bg-white rounded-xl p-4 flex flex-wrap gap-6; }
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
