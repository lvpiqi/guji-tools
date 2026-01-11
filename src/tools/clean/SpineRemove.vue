<script setup lang="ts">
/**
 * 中缝阴影补偿
 * SEO 优化版本
 */
import { ref } from 'vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '中缝去除',
  path: '/clean/spine-remove',
  category: '图像清理',
  categoryPath: '/clean',
  
  description: '免费在线古籍中缝阴影去除工具。自动补偿书籍装订处的黑色阴影，让扫描页面更均匀清晰。',
  keywords: ['中缝去除', '阴影补偿', '书脊阴影', '古籍扫描', '图像修复', '装订阴影'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '去除书籍中缝的黑色阴影，让页面更均匀',
  
  features: [
    '可调节中缝位置（20%-80%）',
    '可调节中缝宽度',
    '可调节补偿强度',
    '羽化边缘自然过渡',
    '实时预览处理效果',
    '显示中缝位置指示线',
    '支持常见图片格式',
    '本地处理保护隐私'
  ],
  
  howToUse: [
    '上传有中缝阴影的古籍扫描图片',
    '调整中缝位置对准阴影区域',
    '设置合适的中缝宽度和补偿强度',
    '点击「应用补偿」查看效果',
    '满意后下载处理结果'
  ],
  
  introduction: `扫描装订成册的古籍时，书脊处常会产生黑色阴影，影响阅读和后续处理。本工具可以自动补偿这些阴影区域的亮度。

工具会分析中缝区域和边缘区域的亮度差异，然后对中缝区域进行亮度补偿，使整个页面亮度更加均匀。羽化功能可以让补偿区域与周围自然过渡，避免明显的边界。

建议先调整中缝位置对准阴影最深处，然后逐步调整宽度和强度，直到效果满意。`,

  faq: [
    {
      question: '中缝位置如何确定？',
      answer: '红色虚线表示中缝中心位置。调整滑块使虚线对准阴影最深的位置。'
    },
    {
      question: '补偿强度设多少合适？',
      answer: '通常70-90%效果较好。强度太高可能导致中缝区域过亮。'
    },
    {
      question: '羽化有什么作用？',
      answer: '羽化可以让补偿区域边缘自然过渡，避免出现明显的亮度分界线。'
    },
    {
      question: '适合什么样的图片？',
      answer: '适合有明显中缝阴影的书籍扫描件。单页扫描或平铺扫描的图片不需要此处理。'
    },
    {
      question: '处理后文字会变淡吗？',
      answer: '补偿主要针对背景区域，文字区域影响较小。如果文字变淡，可以降低补偿强度。'
    }
  ],
  
  supportedFormats: ['JPG', 'PNG', 'WebP'],
  maxFileSize: 20,
  isOffline: true,
  isFree: true
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const originalImage = ref<HTMLImageElement | null>(null)
const processing = ref(false)
const processed = ref(false)

// 参数
const params = ref({
  spinePosition: 50, // 中缝位置 (%)
  spineWidth: 10,    // 中缝宽度 (%)
  strength: 80,      // 补偿强度 (%)
  feather: 20,       // 羽化程度 (%)
})

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  const img = new Image()
  img.onload = () => {
    originalImage.value = img
    drawOriginal()
    processed.value = false
  }
  img.src = URL.createObjectURL(file)
}

function drawOriginal() {
  if (!canvasRef.value || !originalImage.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')!
  const img = originalImage.value
  
  // 设置画布大小
  const maxWidth = 800
  const scale = Math.min(1, maxWidth / img.width)
  canvas.width = img.width * scale
  canvas.height = img.height * scale
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
}

function processImage() {
  if (!canvasRef.value || !originalImage.value) return
  
  processing.value = true
  
  setTimeout(() => {
    const canvas = canvasRef.value!
    const ctx = canvas.getContext('2d')!
    
    // 先绘制原图
    drawOriginal()
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    const spineCenter = canvas.width * (params.value.spinePosition / 100)
    const spineHalfWidth = canvas.width * (params.value.spineWidth / 200)
    const featherWidth = spineHalfWidth * (params.value.feather / 100)
    const strength = params.value.strength / 100
    
    // 计算中缝区域的平均亮度
    let totalBrightness = 0
    let count = 0
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = Math.floor(spineCenter - spineHalfWidth); x < Math.floor(spineCenter + spineHalfWidth); x++) {
        if (x < 0 || x >= canvas.width) continue
        const i = (y * canvas.width + x) * 4
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
        totalBrightness += brightness
        count++
      }
    }
    
    const avgBrightness = totalBrightness / count
    
    // 计算边缘区域的平均亮度（作为目标亮度）
    let edgeBrightness = 0
    let edgeCount = 0
    
    for (let y = 0; y < canvas.height; y++) {
      // 左边缘
      for (let x = 0; x < 50; x++) {
        const i = (y * canvas.width + x) * 4
        edgeBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3
        edgeCount++
      }
      // 右边缘
      for (let x = canvas.width - 50; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4
        edgeBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3
        edgeCount++
      }
    }
    
    const targetBrightness = edgeBrightness / edgeCount
    const brightnessBoost = (targetBrightness - avgBrightness) * strength
    
    // 应用补偿
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const distFromCenter = Math.abs(x - spineCenter)
        
        if (distFromCenter < spineHalfWidth + featherWidth) {
          let factor = 1
          
          if (distFromCenter < spineHalfWidth) {
            factor = 1
          } else {
            // 羽化区域
            factor = 1 - (distFromCenter - spineHalfWidth) / featherWidth
          }
          
          const i = (y * canvas.width + x) * 4
          const boost = brightnessBoost * factor
          
          data[i] = Math.min(255, data[i] + boost)
          data[i + 1] = Math.min(255, data[i + 1] + boost)
          data[i + 2] = Math.min(255, data[i + 2] + boost)
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    
    // 绘制中缝指示线
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)'
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(spineCenter, 0)
    ctx.lineTo(spineCenter, canvas.height)
    ctx.stroke()
    
    processing.value = false
    processed.value = true
  }, 100)
}

function downloadResult() {
  if (!canvasRef.value) return
  
  const link = document.createElement('a')
  link.download = 'spine-removed.png'
  link.href = canvasRef.value.toDataURL('image/png')
  link.click()
}

function reset() {
  processed.value = false
  drawOriginal()
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">
      <!-- 上传区域 -->
      <div v-if="!originalImage" class="upload-zone">
        <input type="file" accept="image/*" @change="handleFileSelect" class="file-input" />
        <div class="upload-hint">
          <span class="icon">📷</span>
          <p>上传书籍扫描图片</p>
        </div>
      </div>

      <!-- 编辑区域 -->
      <div v-else class="editor">
        <!-- 参数面板 -->
        <div class="params-panel">
          <div class="param-item">
            <label>中缝位置: {{ params.spinePosition }}%</label>
            <input type="range" v-model.number="params.spinePosition" min="20" max="80" />
          </div>
          <div class="param-item">
            <label>中缝宽度: {{ params.spineWidth }}%</label>
            <input type="range" v-model.number="params.spineWidth" min="2" max="30" />
          </div>
          <div class="param-item">
            <label>补偿强度: {{ params.strength }}%</label>
            <input type="range" v-model.number="params.strength" min="0" max="100" />
          </div>
          <div class="param-item">
            <label>羽化程度: {{ params.feather }}%</label>
            <input type="range" v-model.number="params.feather" min="0" max="100" />
          </div>
          
          <div class="param-actions">
            <button class="process-btn" @click="processImage" :disabled="processing">
              {{ processing ? '处理中...' : '应用补偿' }}
            </button>
            <button v-if="processed" class="reset-btn" @click="reset">重置</button>
            <ToolFeedback tool-name="中缝去除" />
          </div>
        </div>

        <!-- 画布 -->
        <div class="canvas-container">
          <canvas ref="canvasRef"></canvas>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <button class="change-btn" @click="originalImage = null">更换图片</button>
          <button v-if="processed" class="download-btn" @click="downloadResult">下载结果</button>
        </div>
      </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body { @apply max-w-4xl mx-auto space-y-4; }

.upload-zone {
  @apply relative border-2 border-dashed border-stone-300 rounded-xl p-12 text-center cursor-pointer hover:border-amber-400 transition-colors;
}
.file-input { @apply absolute inset-0 opacity-0 cursor-pointer; }
.upload-hint .icon { @apply text-5xl block mb-3; }
.upload-hint p { @apply text-stone-600; }

.editor { @apply space-y-4; }

.params-panel { @apply bg-white rounded-xl p-4; }
.param-item { @apply mb-3; }
.param-item label { @apply block text-sm text-stone-600 mb-1; }
.param-item input[type="range"] { @apply w-full; }

.param-actions { @apply flex gap-2 mt-4; }
.process-btn { @apply flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50; }
.reset-btn { @apply px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50; }

.canvas-container { @apply bg-stone-200 rounded-xl p-2 overflow-auto; }
.canvas-container canvas { @apply max-w-full mx-auto block rounded; }

.actions { @apply flex gap-2; }
.change-btn { @apply px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50; }
.download-btn { @apply flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600; }
</style>
