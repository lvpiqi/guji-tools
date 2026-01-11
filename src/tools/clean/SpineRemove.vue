<script setup lang="ts">
/**
 * 中缝阴影补偿
 * 去除书籍中缝的黑色阴影
 */
import { ref, onMounted } from 'vue'
import RelatedTools from '@/components/common/RelatedTools.vue'

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
  <div class="tool-page">
    <header class="tool-header">
      <h1>📖 中缝阴影补偿</h1>
      <p>去除书籍中缝的黑色阴影，让页面更均匀</p>
    </header>

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

    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page { @apply max-w-4xl mx-auto; }
.tool-header { @apply mb-6; }
.tool-header h1 { @apply text-xl md:text-2xl font-bold text-stone-800; }
.tool-header p { @apply text-stone-500 mt-1; }

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
