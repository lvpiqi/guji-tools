<script setup lang="ts">
/**
 * 印章提取工具
 * 从古籍图像中提取红色印章为透明PNG
 */
import { ref, computed } from 'vue'
import FileDropzone from '@components/common/FileDropzone.vue'
import RelatedTools from '@/components/common/RelatedTools.vue'

interface ExtractedSeal {
  id: string
  blob: Blob
  url: string
  width: number
  height: number
}

const imageFile = ref<File | null>(null)
const imageUrl = ref<string>('')
const extractedSeals = ref<ExtractedSeal[]>([])
const processing = ref(false)

// 提取参数
const hueMax = ref(20)
const satMin = ref(50)   // 饱和度最小值
const valMin = ref(50)   // 明度最小值
const minArea = ref(100) // 最小面积（像素）

const hasImage = computed(() => !!imageUrl.value)

function handleFiles(files: File[]) {
  if (files.length === 0) return
  
  imageFile.value = files[0]
  imageUrl.value = URL.createObjectURL(files[0])
  extractedSeals.value = []
}

async function extractSeals() {
  if (!imageFile.value) return
  
  processing.value = true
  extractedSeals.value = []
  
  try {
    const img = await loadImage(imageUrl.value)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // 创建红色遮罩
    const mask = new Uint8Array(canvas.width * canvas.height)
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // RGB 转 HSV
      const hsv = rgbToHsv(r, g, b)
      
      // 检测红色（色相在0-20或340-360范围）
      const isRed = (hsv.h <= hueMax.value || hsv.h >= 360 - hueMax.value) &&
                    hsv.s >= satMin.value &&
                    hsv.v >= valMin.value
      
      mask[i / 4] = isRed ? 255 : 0
    }
    
    // 连通区域分析，找出独立的印章
    const regions = findConnectedRegions(mask, canvas.width, canvas.height, minArea.value)
    
    // 为每个区域创建透明PNG
    for (const region of regions) {
      const seal = await extractRegion(imageData, region, canvas.width, canvas.height)
      extractedSeals.value.push(seal)
    }
    
    if (extractedSeals.value.length === 0) {
      alert('未检测到印章，请调整参数后重试')
    }
    
  } catch (e) {
    console.error('Extract error:', e)
    alert('提取失败: ' + (e instanceof Error ? e.message : 'Unknown error'))
  } finally {
    processing.value = false
  }
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  
  return { h, s: s * 100, v: v * 100 }
}

interface Region {
  minX: number
  minY: number
  maxX: number
  maxY: number
  pixels: Set<number>
}

function findConnectedRegions(mask: Uint8Array, width: number, height: number, minArea: number): Region[] {
  const visited = new Set<number>()
  const regions: Region[] = []
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (mask[idx] === 0 || visited.has(idx)) continue
      
      // BFS 找连通区域
      const region: Region = {
        minX: x, minY: y, maxX: x, maxY: y,
        pixels: new Set()
      }
      
      const queue = [idx]
      while (queue.length > 0) {
        const current = queue.shift()!
        if (visited.has(current)) continue
        visited.add(current)
        
        const cx = current % width
        const cy = Math.floor(current / width)
        
        if (mask[current] === 0) continue
        
        region.pixels.add(current)
        region.minX = Math.min(region.minX, cx)
        region.minY = Math.min(region.minY, cy)
        region.maxX = Math.max(region.maxX, cx)
        region.maxY = Math.max(region.maxY, cy)
        
        // 4邻域
        if (cx > 0) queue.push(current - 1)
        if (cx < width - 1) queue.push(current + 1)
        if (cy > 0) queue.push(current - width)
        if (cy < height - 1) queue.push(current + width)
      }
      
      if (region.pixels.size >= minArea) {
        regions.push(region)
      }
    }
  }
  
  return regions
}

async function extractRegion(
  imageData: ImageData, 
  region: Region, 
  srcWidth: number,
  _srcHeight: number
): Promise<ExtractedSeal> {
  const padding = 5
  const x = Math.max(0, region.minX - padding)
  const y = Math.max(0, region.minY - padding)
  const w = region.maxX - region.minX + 1 + padding * 2
  const h = region.maxY - region.minY + 1 + padding * 2
  
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  
  // 创建透明背景
  const output = ctx.createImageData(w, h)
  
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const srcX = x + dx
      const srcY = y + dy
      const srcIdx = (srcY * srcWidth + srcX) * 4
      const dstIdx = (dy * w + dx) * 4
      const pixelIdx = srcY * srcWidth + srcX
      
      if (region.pixels.has(pixelIdx)) {
        // 复制像素
        output.data[dstIdx] = imageData.data[srcIdx]
        output.data[dstIdx + 1] = imageData.data[srcIdx + 1]
        output.data[dstIdx + 2] = imageData.data[srcIdx + 2]
        output.data[dstIdx + 3] = 255
      } else {
        // 透明
        output.data[dstIdx + 3] = 0
      }
    }
  }
  
  ctx.putImageData(output, 0, 0)
  
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(b => resolve(b!), 'image/png')
  })
  
  return {
    id: crypto.randomUUID(),
    blob,
    url: URL.createObjectURL(blob),
    width: w,
    height: h
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function downloadSeal(seal: ExtractedSeal) {
  const a = document.createElement('a')
  a.href = seal.url
  a.download = `seal_${seal.id.slice(0, 8)}.png`
  a.click()
}

async function downloadAll() {
  if (extractedSeals.value.length === 0) return
  
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  
  for (let i = 0; i < extractedSeals.value.length; i++) {
    zip.file(`seal_${i + 1}.png`, extractedSeals.value[i].blob)
  }
  
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'seals.zip'
  a.click()
  URL.revokeObjectURL(url)
}

function clearAll() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  extractedSeals.value.forEach(s => URL.revokeObjectURL(s.url))
  imageFile.value = null
  imageUrl.value = ''
  extractedSeals.value = []
}
</script>

<template>
  <div class="tool-page">
    <header class="tool-header">
      <h1 class="tool-title">印章提取</h1>
      <p class="tool-desc">自动检测并提取古籍中的红色印章为透明PNG</p>
    </header>

    <div v-if="!hasImage">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp"
        :max-size="20"
        :multiple="false"
        @files="handleFiles"
      />
    </div>

    <div v-else class="tool-body">
      <!-- 原图预览 -->
      <div class="preview-section">
        <h3>原图</h3>
        <img :src="imageUrl" class="preview-image" />
      </div>

      <!-- 参数设置 -->
      <div class="settings-panel">
        <h3>提取参数</h3>
        
        <div class="setting-row">
          <label>红色色相范围</label>
          <input type="range" v-model.number="hueMax" min="10" max="40" />
          <span>0-{{ hueMax }}°</span>
        </div>
        
        <div class="setting-row">
          <label>最小饱和度</label>
          <input type="range" v-model.number="satMin" min="20" max="80" />
          <span>{{ satMin }}%</span>
        </div>
        
        <div class="setting-row">
          <label>最小明度</label>
          <input type="range" v-model.number="valMin" min="20" max="80" />
          <span>{{ valMin }}%</span>
        </div>
        
        <div class="setting-row">
          <label>最小面积</label>
          <input type="range" v-model.number="minArea" min="50" max="500" step="50" />
          <span>{{ minArea }}px²</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button 
          class="btn-primary"
          :disabled="processing"
          @click="extractSeals"
        >
          {{ processing ? '提取中...' : '开始提取' }}
        </button>
        <button class="btn-text" @click="clearAll">重新选择</button>
      </div>

      <!-- 提取结果 -->
      <div v-if="extractedSeals.length > 0" class="results-section">
        <div class="results-header">
          <h3>提取结果 ({{ extractedSeals.length }} 个印章)</h3>
          <button class="btn-secondary" @click="downloadAll">打包下载</button>
        </div>
        
        <div class="seals-grid">
          <div 
            v-for="seal in extractedSeals" 
            :key="seal.id"
            class="seal-card"
          >
            <div class="seal-preview">
              <img :src="seal.url" />
            </div>
            <div class="seal-info">
              <span>{{ seal.width }}×{{ seal.height }}</span>
              <button class="btn-download" @click="downloadSeal(seal)">下载</button>
            </div>
          </div>
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
  @apply bg-white rounded-xl border border-stone-200 p-4;
}
.preview-section h3 {
  @apply font-medium text-stone-800 mb-3;
}
.preview-image {
  @apply max-w-full max-h-[400px] object-contain mx-auto;
}
.settings-panel {
  @apply bg-white rounded-xl border border-stone-200 p-4;
}
.settings-panel h3 {
  @apply font-medium text-stone-800 mb-4;
}
.setting-row {
  @apply flex items-center gap-4 py-2;
}
.setting-row label {
  @apply w-28 text-sm text-stone-600;
}
.setting-row input[type="range"] {
  @apply flex-1 accent-amber-500;
}
.setting-row span {
  @apply w-16 text-sm text-stone-500 text-right;
}
.actions {
  @apply flex gap-4 justify-center;
}
.btn-primary {
  @apply px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 
         disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}
.btn-secondary {
  @apply px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors;
}
.btn-text {
  @apply px-4 py-2 text-stone-500 hover:text-stone-700 transition-colors;
}
.results-section {
  @apply bg-white rounded-xl border border-stone-200 p-4;
}
.results-header {
  @apply flex justify-between items-center mb-4;
}
.results-header h3 {
  @apply font-medium text-stone-800;
}
.seals-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}
.seal-card {
  @apply border border-stone-200 rounded-lg overflow-hidden;
}
.seal-preview {
  @apply h-32 flex items-center justify-center p-2;
  background: repeating-conic-gradient(#e5e5e5 0% 25%, white 0% 50%) 50% / 16px 16px;
}
.seal-preview img {
  @apply max-w-full max-h-full object-contain;
}
.seal-info {
  @apply flex justify-between items-center px-3 py-2 bg-stone-50 text-sm;
}
.btn-download {
  @apply text-amber-600 hover:text-amber-700;
}
</style>
