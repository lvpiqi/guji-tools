<script setup lang="ts">
/**
 * 古画色卡工具
 * 从图像中提取颜色并匹配中国传统色名
 */
import { ref, computed } from 'vue'
import FileDropzone from '@components/common/FileDropzone.vue'
import RelatedTools from '@/components/common/RelatedTools.vue'

interface ExtractedColor {
  hex: string
  rgb: [number, number, number]
  count: number
  percentage: number
  traditionalName?: string
  traditionalHex?: string
}

const imageFile = ref<File | null>(null)
const imageUrl = ref<string>('')
const extractedColors = ref<ExtractedColor[]>([])
const processing = ref(false)
const colorCount = ref(8)

const hasImage = computed(() => !!imageUrl.value)

// 中国传统色（示例数据）
const traditionalColors: Array<{ name: string; hex: string; rgb: [number, number, number] }> = [
  { name: '胭脂', hex: '#9d2933', rgb: [157, 41, 51] },
  { name: '朱砂', hex: '#ff461f', rgb: [255, 70, 31] },
  { name: '火红', hex: '#ff2d51', rgb: [255, 45, 81] },
  { name: '朱红', hex: '#ff4c00', rgb: [255, 76, 0] },
  { name: '丹', hex: '#ff4e20', rgb: [255, 78, 32] },
  { name: '彤', hex: '#f35336', rgb: [243, 83, 54] },
  { name: '茜色', hex: '#cb3a56', rgb: [203, 58, 86] },
  { name: '绛紫', hex: '#8c4356', rgb: [140, 67, 86] },
  { name: '紫棠', hex: '#56004f', rgb: [86, 0, 79] },
  { name: '青莲', hex: '#801dae', rgb: [128, 29, 174] },
  { name: '藤黄', hex: '#ffb61e', rgb: [255, 182, 30] },
  { name: '雄黄', hex: '#e9bb1d', rgb: [233, 187, 29] },
  { name: '秋香', hex: '#d9b611', rgb: [217, 182, 17] },
  { name: '金', hex: '#eacd76', rgb: [234, 205, 118] },
  { name: '鹅黄', hex: '#fff143', rgb: [255, 241, 67] },
  { name: '缃色', hex: '#f0c239', rgb: [240, 194, 57] },
  { name: '杏黄', hex: '#ffa631', rgb: [255, 166, 49] },
  { name: '橘红', hex: '#ff7500', rgb: [255, 117, 0] },
  { name: '松花', hex: '#bce672', rgb: [188, 230, 114] },
  { name: '葱绿', hex: '#9ed900', rgb: [158, 217, 0] },
  { name: '豆绿', hex: '#9ed048', rgb: [158, 208, 72] },
  { name: '竹青', hex: '#789262', rgb: [120, 146, 98] },
  { name: '青', hex: '#00e09e', rgb: [0, 224, 158] },
  { name: '碧', hex: '#1bd1a5', rgb: [27, 209, 165] },
  { name: '石青', hex: '#1685a9', rgb: [22, 133, 169] },
  { name: '靛青', hex: '#177cb0', rgb: [23, 124, 176] },
  { name: '蓝', hex: '#44cef6', rgb: [68, 206, 246] },
  { name: '群青', hex: '#4c8dae', rgb: [76, 141, 174] },
  { name: '藏蓝', hex: '#3b2e7e', rgb: [59, 46, 126] },
  { name: '黛', hex: '#4a4266', rgb: [74, 66, 102] },
  { name: '墨', hex: '#50616d', rgb: [80, 97, 109] },
  { name: '玄', hex: '#622a1d', rgb: [98, 42, 29] },
  { name: '缁', hex: '#493131', rgb: [73, 49, 49] },
  { name: '漆黑', hex: '#161823', rgb: [22, 24, 35] },
  { name: '象牙白', hex: '#fffbf0', rgb: [255, 251, 240] },
  { name: '月白', hex: '#d6ecf0', rgb: [214, 236, 240] },
  { name: '素', hex: '#e0f0e9', rgb: [224, 240, 233] },
  { name: '霜', hex: '#e9f1f6', rgb: [233, 241, 246] },
  { name: '银白', hex: '#e9e7ef', rgb: [233, 231, 239] },
  { name: '铅白', hex: '#f0f0f4', rgb: [240, 240, 244] },
]

function handleFiles(files: File[]) {
  if (files.length === 0) return
  
  imageFile.value = files[0]
  imageUrl.value = URL.createObjectURL(files[0])
  extractedColors.value = []
}

async function extractColors() {
  if (!imageUrl.value) return
  
  processing.value = true
  
  try {
    const img = await loadImage(imageUrl.value)
    const canvas = document.createElement('canvas')
    
    // 缩小图像以加快处理
    const maxSize = 200
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
    canvas.width = img.width * scale
    canvas.height = img.height * scale
    
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const colors = quantizeColors(imageData.data, colorCount.value)
    
    // 匹配传统色名
    extractedColors.value = colors.map(c => ({
      ...c,
      ...findClosestTraditionalColor(c.rgb)
    }))
    
  } catch (e) {
    console.error('Extract error:', e)
  } finally {
    processing.value = false
  }
}

function quantizeColors(data: Uint8ClampedArray, count: number): ExtractedColor[] {
  // 简单的颜色量化：使用颜色直方图
  const colorMap = new Map<string, { rgb: [number, number, number]; count: number }>()
  
  for (let i = 0; i < data.length; i += 4) {
    // 量化到 32 级
    const r = Math.round(data[i] / 8) * 8
    const g = Math.round(data[i + 1] / 8) * 8
    const b = Math.round(data[i + 2] / 8) * 8
    
    const key = `${r},${g},${b}`
    const existing = colorMap.get(key)
    if (existing) {
      existing.count++
    } else {
      colorMap.set(key, { rgb: [r, g, b], count: 1 })
    }
  }
  
  // 按出现次数排序
  const sorted = Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
  
  const total = data.length / 4
  
  return sorted.map(c => ({
    hex: rgbToHex(c.rgb),
    rgb: c.rgb,
    count: c.count,
    percentage: Math.round((c.count / total) * 100)
  }))
}

function findClosestTraditionalColor(rgb: [number, number, number]): { traditionalName: string; traditionalHex: string } {
  let minDistance = Infinity
  let closest = traditionalColors[0]
  
  for (const tc of traditionalColors) {
    const distance = colorDistance(rgb, tc.rgb)
    if (distance < minDistance) {
      minDistance = distance
      closest = tc
    }
  }
  
  return {
    traditionalName: closest.name,
    traditionalHex: closest.hex
  }
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  // 使用加权欧氏距离（人眼对绿色更敏感）
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11)
}

function rgbToHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('')
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function copyColor(hex: string) {
  navigator.clipboard.writeText(hex)
}

function clearAll() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  imageFile.value = null
  imageUrl.value = ''
  extractedColors.value = []
}
</script>

<template>
  <div class="tool-page">
    <header class="tool-header">
      <h1 class="tool-title">古画色卡</h1>
      <p class="tool-desc">从古画中提取主要颜色，匹配中国传统色名</p>
    </header>

    <div v-if="!hasImage">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp"
        :max-size="10"
        :multiple="false"
        @files="handleFiles"
      />
    </div>

    <div v-else class="tool-body">
      <!-- 图像预览 -->
      <div class="preview-section">
        <img :src="imageUrl" class="preview-image" />
      </div>

      <!-- 设置 -->
      <div class="settings">
        <div class="setting-item">
          <label>提取颜色数量</label>
          <input type="range" v-model.number="colorCount" min="4" max="16" />
          <span>{{ colorCount }}</span>
        </div>
        
        <div class="actions">
          <button 
            class="btn-primary"
            :disabled="processing"
            @click="extractColors"
          >
            {{ processing ? '提取中...' : '提取颜色' }}
          </button>
          <button class="btn-text" @click="clearAll">重新选择</button>
        </div>
      </div>

      <!-- 提取结果 -->
      <div v-if="extractedColors.length" class="colors-section">
        <h3>提取的颜色</h3>
        
        <div class="colors-grid">
          <div 
            v-for="(color, i) in extractedColors" 
            :key="i"
            class="color-card"
            @click="copyColor(color.hex)"
          >
            <div 
              class="color-swatch"
              :style="{ backgroundColor: color.hex }"
            >
              <span class="color-percentage">{{ color.percentage }}%</span>
            </div>
            <div class="color-info">
              <div class="color-hex">{{ color.hex }}</div>
              <div class="color-traditional">
                <span 
                  class="traditional-swatch"
                  :style="{ backgroundColor: color.traditionalHex }"
                ></span>
                {{ color.traditionalName }}
              </div>
            </div>
          </div>
        </div>

        <p class="hint">点击颜色卡片复制色值</p>
      </div>
    </div>

    <!-- 传统色参考 -->
    <div class="reference-section">
      <h3>中国传统色参考</h3>
      <div class="traditional-colors">
        <div 
          v-for="tc in traditionalColors.slice(0, 20)" 
          :key="tc.name"
          class="traditional-item"
          :title="tc.hex"
          @click="copyColor(tc.hex)"
        >
          <span 
            class="traditional-swatch-lg"
            :style="{ backgroundColor: tc.hex }"
          ></span>
          <span class="traditional-name">{{ tc.name }}</span>
        </div>
      </div>
    </div>

    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page {
  @apply max-w-4xl mx-auto;
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
  @apply space-y-6;
}
.preview-section {
  @apply bg-white rounded-xl border border-stone-200 p-4 flex justify-center;
}
.preview-image {
  @apply max-w-full max-h-[300px] object-contain rounded-lg;
}
.settings {
  @apply bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-6;
}
.setting-item {
  @apply flex items-center gap-3;
}
.setting-item label {
  @apply text-sm text-stone-600;
}
.setting-item input[type="range"] {
  @apply w-32 accent-amber-500;
}
.setting-item span {
  @apply w-8 text-sm text-stone-500;
}
.actions {
  @apply flex gap-3 ml-auto;
}
.btn-primary {
  @apply px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600
         disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}
.btn-text {
  @apply px-4 py-2 text-stone-500 hover:text-stone-700 transition-colors;
}
.colors-section {
  @apply bg-white rounded-xl border border-stone-200 p-4;
}
.colors-section h3 {
  @apply font-medium text-stone-800 mb-4;
}
.colors-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}
.color-card {
  @apply border border-stone-200 rounded-lg overflow-hidden cursor-pointer
         hover:shadow-md transition-shadow;
}
.color-swatch {
  @apply h-20 flex items-end justify-end p-2;
}
.color-percentage {
  @apply px-2 py-0.5 bg-black/50 text-white text-xs rounded;
}
.color-info {
  @apply p-3 bg-white;
}
.color-hex {
  @apply font-mono text-sm text-stone-700;
}
.color-traditional {
  @apply flex items-center gap-2 mt-1 text-sm text-stone-500;
}
.traditional-swatch {
  @apply w-4 h-4 rounded-full border border-stone-200;
}
.hint {
  @apply text-center text-sm text-stone-400 mt-4;
}
.reference-section {
  @apply bg-amber-50 rounded-xl p-4 mt-6;
}
.reference-section h3 {
  @apply font-medium text-amber-900 mb-3;
}
.traditional-colors {
  @apply flex flex-wrap gap-2;
}
.traditional-item {
  @apply flex items-center gap-1 px-2 py-1 bg-white rounded-lg cursor-pointer
         hover:shadow-sm transition-shadow;
}
.traditional-swatch-lg {
  @apply w-5 h-5 rounded border border-stone-200;
}
.traditional-name {
  @apply text-sm text-stone-700;
}
</style>
