<script setup lang="ts">
/**
 * 图像对比滑块
 * 处理前后对比展示
 */
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  before: string // URL or base64
  after: string
  initialPosition?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialPosition: 50,
})

const containerRef = ref<HTMLDivElement>()
const position = ref(props.initialPosition)
const isDragging = ref(false)

function updatePosition(clientX: number) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const x = clientX - rect.left
  position.value = Math.max(0, Math.min(100, (x / rect.width) * 100))
}

function onMouseDown() {
  isDragging.value = true
}

function onMouseMove(e: MouseEvent) {
  if (isDragging.value) updatePosition(e.clientX)
}

function onMouseUp() {
  isDragging.value = false
}

function onTouchMove(e: TouchEvent) {
  if (isDragging.value) updatePosition(e.touches[0].clientX)
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.addEventListener('touchmove', onTouchMove)
  document.addEventListener('touchend', onMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onMouseUp)
})
</script>

<template>
  <div ref="containerRef" class="compare-container">
    <!-- 处理后（底层） -->
    <img :src="after" class="compare-image" alt="处理后" />
    
    <!-- 处理前（裁切层） -->
    <div class="compare-before" :style="{ clipPath: `inset(0 ${100 - position}% 0 0)` }">
      <img :src="before" class="compare-image" alt="处理前" />
    </div>
    
    <!-- 滑块 -->
    <div
      class="compare-slider"
      :style="{ left: `${position}%` }"
      @mousedown="onMouseDown"
      @touchstart="onMouseDown"
    >
      <div class="slider-line" />
      <div class="slider-handle">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5l-5 7 5 7M16 5l5 7-5 7"/>
        </svg>
      </div>
    </div>
    
    <!-- 标签 -->
    <span class="label label-before">原图</span>
    <span class="label label-after">处理后</span>
  </div>
</template>

<style scoped>
.compare-container {
  @apply relative w-full aspect-[4/3] overflow-hidden rounded-lg select-none;
}
.compare-image {
  @apply absolute inset-0 w-full h-full object-contain bg-stone-100;
}
.compare-before {
  @apply absolute inset-0;
}
.compare-slider {
  @apply absolute top-0 bottom-0 w-1 -ml-0.5 cursor-ew-resize z-10;
}
.slider-line {
  @apply absolute inset-0 bg-white shadow-lg;
}
.slider-handle {
  @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
         w-10 h-10 bg-white rounded-full shadow-lg
         flex items-center justify-center text-stone-600;
}
.slider-handle svg {
  @apply w-5 h-5;
}
.label {
  @apply absolute bottom-3 px-2 py-1 text-xs bg-black/60 text-white rounded;
}
.label-before {
  @apply left-3;
}
.label-after {
  @apply right-3;
}
</style>
