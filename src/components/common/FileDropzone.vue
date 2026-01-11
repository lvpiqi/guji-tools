<script setup lang="ts">
/**
 * 通用文件拖放区域
 * 所有工具共享的上传组件
 */
import { ref } from 'vue'

interface Props {
  accept?: string
  multiple?: boolean
  maxSize?: number // MB
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*',
  multiple: true,
  maxSize: 50,
  disabled: false,
})

const emit = defineEmits<{
  files: [files: File[]]
}>()

const isDragging = ref(false)
const inputRef = ref<HTMLInputElement>()

function handleDrop(e: DragEvent) {
  isDragging.value = false
  if (props.disabled || !e.dataTransfer?.files) return
  
  const files = filterFiles(Array.from(e.dataTransfer.files))
  if (files.length) emit('files', files)
}

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  
  const files = filterFiles(Array.from(input.files))
  if (files.length) emit('files', files)
  input.value = '' // 允许重复选择同一文件
}

function filterFiles(files: File[]): File[] {
  return files.filter(f => {
    if (f.size > props.maxSize * 1024 * 1024) {
      console.warn(`文件过大: ${f.name}`)
      return false
    }
    return true
  })
}

function openPicker() {
  inputRef.value?.click()
}
</script>

<template>
  <div
    class="dropzone"
    :class="{ dragging: isDragging, disabled }"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="handleDrop"
    @click="openPicker"
  >
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      class="hidden"
      @change="handleInput"
    />
    
    <div class="dropzone-content">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
      </svg>
      <p class="text-lg font-medium">拖放文件到此处</p>
      <p class="text-sm text-stone-500">或点击选择文件</p>
      <p class="text-xs text-stone-400 mt-2">
        支持 {{ accept }} · 单文件最大 {{ maxSize }}MB
      </p>
    </div>
  </div>
</template>

<style scoped>
.dropzone {
  @apply border-2 border-dashed border-stone-300 rounded-xl p-8
         cursor-pointer transition-all duration-200
         hover:border-amber-400 hover:bg-amber-50/50;
}
.dropzone.dragging {
  @apply border-amber-500 bg-amber-50;
}
.dropzone.disabled {
  @apply opacity-50 cursor-not-allowed;
}
.dropzone-content {
  @apply flex flex-col items-center justify-center text-stone-600;
}
.icon {
  @apply w-12 h-12 mb-4 text-stone-400;
}
</style>
