<script setup lang="ts">
/**
 * 蠹鱼眼/墨点修复工具
 * SEO 优化版本
 */
import { ref, computed } from 'vue'
import FileDropzone from '@components/common/FileDropzone.vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '蠹鱼眼修复',
  path: '/clean/inpaint',
  category: '图像清理',
  categoryPath: '/clean',
  
  description: '免费在线古籍蠹鱼眼墨点修复工具。用画笔标记需要修复的虫蛀、墨点、污渍区域，自动填充修复，还原古籍原貌。',
  keywords: ['蠹鱼眼修复', '墨点修复', '古籍修复', '图像修复', '虫蛀修复', '污渍去除', 'inpaint'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '用画笔标记需要修复的区域，自动填充修复',
  
  features: [
    '画笔标记需要修复的区域',
    '自动分析周围像素进行填充',
    '可调节画笔大小',
    '支持绘制和擦除模式',
    '实时预览标记区域',
    '修复前后对比',
    '本地处理，保护隐私',
    '支持触屏设备操作'
  ],
  
  howToUse: [
    '上传需要修复的古籍图片',
    '调整画笔大小，用红色画笔标记需要修复的区域',
    '如标记错误，切换到擦除模式修正',
    '点击「开始修复」进行自动填充',
    '查看修复结果，满意后下载'
  ],
  
  introduction: `古籍在保存过程中，常常会受到虫蛀（蠹鱼眼）、墨点、水渍等损害，影响阅读和数字化效果。本工具可以帮助您修复这些损坏区域，还原古籍的原貌。

使用方法很简单：用画笔在图像上标记需要修复的区域（显示为红色半透明），然后点击修复按钮。工具会分析标记区域周围的像素，使用智能填充算法自动补全损坏部分。

修复算法基于周围像素的加权平均，对于小面积的虫蛀和墨点效果较好。对于大面积损坏，可能需要多次修复或配合其他专业工具使用。`,

  faq: [
    {
      question: '适合修复哪些类型的损坏？',
      answer: '适合修复小面积的虫蛀（蠹鱼眼）、墨点、污渍、水渍等。对于大面积损坏效果可能不理想。'
    },
    {
      question: '画笔大小如何选择？',
      answer: '画笔大小应略大于需要修复的区域。太小会遗漏边缘，太大会影响周围正常内容。'
    },
    {
      question: '标记错了怎么办？',
      answer: '切换到「擦除」模式，可以擦除错误标记的区域。也可以点击「清除遮罩」重新开始。'
    },
    {
      question: '修复效果不理想怎么办？',
      answer: '可以尝试：1) 更精确地标记损坏区域；2) 对大面积损坏分多次小范围修复；3) 修复后再次标记残留问题区域。'
    },
    {
      question: '图片会上传到服务器吗？',
      answer: '不会。所有处理都在浏览器本地完成，图片不会上传到任何服务器。'
    },
    {
      question: '支持触屏操作吗？',
      answer: '支持。可以在平板或触屏设备上用手指绘制标记区域。'
    }
  ],
  
  supportedFormats: ['JPG', 'PNG', 'WebP'],
  maxFileSize: 20,
  isOffline: true,
  isFree: true
}

const imageFile = ref<File | null>(null)
const imageUrl = ref<string>('')
const resultUrl = ref<string>('')

// Canvas refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const maskCanvasRef = ref<HTMLCanvasElement | null>(null)

// 绘制状态
const isDrawing = ref(false)
const brushSize = ref(20)
const brushMode = ref<'draw' | 'erase'>('draw')

// 图像尺寸
const imageWidth = ref(0)
const imageHeight = ref(0)

// 处理状态
const processing = ref(false)

const hasImage = computed(() => !!imageUrl.value)
const hasMask = computed(() => {
  if (!maskCanvasRef.value) return false
  const ctx = maskCanvasRef.value.getContext('2d')
  if (!ctx) return false
  const data = ctx.getImageData(0, 0, maskCanvasRef.value.width, maskCanvasRef.value.height).data
  return data.some((v, i) => i % 4 === 3 && v > 0)
})

function handleFiles(files: File[]) {
  if (files.length === 0) return
  
  imageFile.value = files[0]
  imageUrl.value = URL.createObjectURL(files[0])
  resultUrl.value = ''
  
  // 加载图像到 Canvas
  const img = new Image()
  img.onload = () => {
    imageWidth.value = img.width
    imageHeight.value = img.height
    
    // 初始化主画布
    if (canvasRef.value) {
      canvasRef.value.width = img.width
      canvasRef.value.height = img.height
      const ctx = canvasRef.value.getContext('2d')!
      ctx.drawImage(img, 0, 0)
    }
    
    // 初始化遮罩画布
    if (maskCanvasRef.value) {
      maskCanvasRef.value.width = img.width
      maskCanvasRef.value.height = img.height
      const ctx = maskCanvasRef.value.getContext('2d')!
      ctx.clearRect(0, 0, img.width, img.height)
    }
  }
  img.src = imageUrl.value
}

function startDraw(e: MouseEvent | TouchEvent) {
  isDrawing.value = true
  draw(e)
}

function stopDraw() {
  isDrawing.value = false
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value || !maskCanvasRef.value) return
  
  const canvas = maskCanvasRef.value
  const ctx = canvas.getContext('2d')!
  const rect = canvas.getBoundingClientRect()
  
  let clientX: number, clientY: number
  if ('touches' in e) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  
  // 计算缩放比例
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  
  const x = (clientX - rect.left) * scaleX
  const y = (clientY - rect.top) * scaleY
  
  ctx.beginPath()
  ctx.arc(x, y, brushSize.value * scaleX, 0, Math.PI * 2)
  
  if (brushMode.value === 'draw') {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.fill()
  } else {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }
}

function clearMask() {
  if (!maskCanvasRef.value) return
  const ctx = maskCanvasRef.value.getContext('2d')!
  ctx.clearRect(0, 0, maskCanvasRef.value.width, maskCanvasRef.value.height)
}

async function processInpaint() {
  if (!canvasRef.value || !maskCanvasRef.value) return
  
  processing.value = true
  
  try {
    const srcCtx = canvasRef.value.getContext('2d')!
    const maskCtx = maskCanvasRef.value.getContext('2d')!
    
    const srcData = srcCtx.getImageData(0, 0, imageWidth.value, imageHeight.value)
    const maskData = maskCtx.getImageData(0, 0, imageWidth.value, imageHeight.value)
    
    // 简单的修复算法：使用周围像素的平均值填充
    const result = simpleInpaint(srcData, maskData)
    
    // 创建结果画布
    const resultCanvas = document.createElement('canvas')
    resultCanvas.width = imageWidth.value
    resultCanvas.height = imageHeight.value
    const resultCtx = resultCanvas.getContext('2d')!
    resultCtx.putImageData(result, 0, 0)
    
    // 转换为 URL
    const blob = await new Promise<Blob>((resolve) => {
      resultCanvas.toBlob(b => resolve(b!), 'image/png')
    })
    resultUrl.value = URL.createObjectURL(blob)
    
  } catch (e) {
    console.error('Inpaint error:', e)
    alert('修复失败: ' + (e instanceof Error ? e.message : 'Unknown error'))
  } finally {
    processing.value = false
  }
}

/**
 * 简单的修复算法
 * 使用周围非遮罩区域的像素进行插值填充
 */
function simpleInpaint(srcData: ImageData, maskData: ImageData): ImageData {
  const width = srcData.width
  const height = srcData.height
  const src = srcData.data
  const mask = maskData.data
  const result = new Uint8ClampedArray(src)
  
  // 找出需要修复的像素
  const toFill: Array<[number, number]> = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (mask[idx + 3] > 0) { // 遮罩区域
        toFill.push([x, y])
      }
    }
  }
  
  // 迭代填充
  const maxIterations = 50
  for (let iter = 0; iter < maxIterations && toFill.length > 0; iter++) {
    const stillToFill: Array<[number, number]> = []
    
    for (const [x, y] of toFill) {
      const idx = (y * width + x) * 4
      
      // 收集周围非遮罩像素
      const neighbors: Array<[number, number, number, number]> = []
      const radius = 3
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx === 0 && dy === 0) continue
          
          const nx = x + dx
          const ny = y + dy
          
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          
          const nidx = (ny * width + nx) * 4
          if (mask[nidx + 3] === 0) { // 非遮罩区域
            const weight = 1 / Math.sqrt(dx * dx + dy * dy)
            neighbors.push([result[nidx], result[nidx + 1], result[nidx + 2], weight])
          }
        }
      }
      
      if (neighbors.length > 0) {
        // 加权平均
        let r = 0, g = 0, b = 0, totalWeight = 0
        for (const [nr, ng, nb, w] of neighbors) {
          r += nr * w
          g += ng * w
          b += nb * w
          totalWeight += w
        }
        
        result[idx] = Math.round(r / totalWeight)
        result[idx + 1] = Math.round(g / totalWeight)
        result[idx + 2] = Math.round(b / totalWeight)
        result[idx + 3] = 255
        
        // 标记为已填充
        mask[idx + 3] = 0
      } else {
        stillToFill.push([x, y])
      }
    }
    
    toFill.length = 0
    toFill.push(...stillToFill)
  }
  
  return new ImageData(result, width, height)
}

function downloadResult() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = `inpaint_${imageFile.value?.name || 'result.png'}`
  a.click()
}

function clearAll() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  imageFile.value = null
  imageUrl.value = ''
  resultUrl.value = ''
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div v-if="!hasImage">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp"
        :max-size="20"
        :multiple="false"
        @files="handleFiles"
      />
    </div>

    <div v-else class="tool-body">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="brush-settings">
          <label class="setting-item">
            <span>画笔大小</span>
            <input 
              type="range" 
              v-model.number="brushSize" 
              min="5" 
              max="50"
              class="range-input"
            />
            <span class="range-value">{{ brushSize }}px</span>
          </label>
          
          <div class="brush-modes">
            <button 
              class="mode-btn"
              :class="{ active: brushMode === 'draw' }"
              @click="brushMode = 'draw'"
            >
              🖌️ 绘制
            </button>
            <button 
              class="mode-btn"
              :class="{ active: brushMode === 'erase' }"
              @click="brushMode = 'erase'"
            >
              🧹 擦除
            </button>
          </div>
        </div>
        
        <div class="toolbar-actions">
          <button class="btn-secondary" @click="clearMask">清除遮罩</button>
          <button 
            class="btn-primary"
            :disabled="!hasMask || processing"
            @click="processInpaint"
          >
            {{ processing ? '修复中...' : '开始修复' }}
          </button>
        </div>
      </div>

      <!-- 画布区域 -->
      <div class="canvas-container">
        <div class="canvas-wrapper">
          <canvas 
            ref="canvasRef"
            class="main-canvas"
          />
          <canvas 
            ref="maskCanvasRef"
            class="mask-canvas"
            @mousedown="startDraw"
            @mousemove="draw"
            @mouseup="stopDraw"
            @mouseleave="stopDraw"
            @touchstart.prevent="startDraw"
            @touchmove.prevent="draw"
            @touchend="stopDraw"
          />
        </div>
        
        <p class="canvas-hint">在图像上绘制红色区域标记需要修复的部分</p>
      </div>

      <!-- 结果预览 -->
      <div v-if="resultUrl" class="result-section">
        <h3>修复结果</h3>
        <img :src="resultUrl" class="result-image" alt="修复结果" />
        <div class="result-actions">
          <button class="btn-primary" @click="downloadResult">下载结果</button>
          <button class="btn-text" @click="resultUrl = ''">关闭预览</button>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="footer-actions">
        <div class="actions-left">
          <button class="btn-text" @click="clearAll">重新选择图片</button>
        </div>
        <ToolFeedback tool-name="蠹鱼眼修复" />
      </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body {
  @apply space-y-6;
}
.toolbar {
  @apply flex justify-between items-center flex-wrap gap-4 p-4 bg-white rounded-lg border border-stone-200;
}
.brush-settings {
  @apply flex items-center gap-6;
}
.setting-item {
  @apply flex items-center gap-2 text-sm text-stone-700;
}
.range-input {
  @apply w-24 accent-amber-500;
}
.range-value {
  @apply w-12 text-stone-500;
}
.brush-modes {
  @apply flex gap-2;
}
.mode-btn {
  @apply px-3 py-1.5 text-sm rounded-lg border border-stone-200 
         hover:border-amber-400 transition-colors;
}
.mode-btn.active {
  @apply bg-amber-500 text-white border-amber-500;
}
.toolbar-actions {
  @apply flex gap-3;
}
.btn-primary {
  @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 
         disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}
.btn-secondary {
  @apply px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors;
}
.btn-text {
  @apply px-4 py-2 text-stone-500 hover:text-stone-700 transition-colors;
}
.canvas-container {
  @apply bg-white rounded-xl border border-stone-200 p-4;
}
.canvas-wrapper {
  @apply relative inline-block max-w-full overflow-auto;
}
.main-canvas {
  @apply block max-w-full h-auto;
}
.mask-canvas {
  @apply absolute top-0 left-0 cursor-crosshair;
  width: 100%;
  height: 100%;
}
.canvas-hint {
  @apply text-center text-sm text-stone-500 mt-3;
}
.result-section {
  @apply bg-white rounded-xl border border-stone-200 p-4;
}
.result-section h3 {
  @apply font-medium text-stone-800 mb-3;
}
.result-image {
  @apply max-w-full h-auto rounded-lg;
}
.result-actions {
  @apply flex gap-3 mt-4;
}
.footer-actions {
  @apply flex items-center justify-between;
}
.actions-left {
  @apply flex gap-3;
}
</style>
