<script setup lang="ts">
/**
 * 批量重命名ZIP
 * 按"卷-页-面"规则批量重命名图片并打包下载
 */
import { ref, computed } from 'vue'
import JSZip from 'jszip'
import RelatedTools from '@/components/common/RelatedTools.vue'

interface FileItem {
  id: string
  file: File
  originalName: string
  newName: string
  preview?: string
}

const files = ref<FileItem[]>([])
const processing = ref(false)

// 命名规则
const rule = ref({
  prefix: '卷一',
  startPage: 1,
  separator: '-',
  suffix: '',
  digits: 3,
  side: 'single' as 'single' | 'double', // single: 单面, double: 双面(a/b)
})

// 预览新文件名
const previewFiles = computed(() => {
  return files.value.map((f, i) => {
    const pageNum = rule.value.startPage + (rule.value.side === 'double' ? Math.floor(i / 2) : i)
    const pageStr = String(pageNum).padStart(rule.value.digits, '0')
    const sideStr = rule.value.side === 'double' ? (i % 2 === 0 ? 'a' : 'b') : ''
    const ext = f.originalName.split('.').pop()
    const newName = `${rule.value.prefix}${rule.value.separator}${pageStr}${sideStr}${rule.value.suffix}.${ext}`
    return { ...f, newName }
  })
})

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const items = e.dataTransfer?.files
  if (items) addFiles(Array.from(items))
}

function handleSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
}

function addFiles(newFiles: File[]) {
  const imageFiles = newFiles.filter(f => f.type.startsWith('image/'))
  const items: FileItem[] = imageFiles.map(file => ({
    id: Math.random().toString(36).substr(2, 9),
    file,
    originalName: file.name,
    newName: '',
    preview: URL.createObjectURL(file),
  }))
  files.value.push(...items)
}

function removeFile(id: string) {
  const index = files.value.findIndex(f => f.id === id)
  if (index !== -1) {
    if (files.value[index].preview) {
      URL.revokeObjectURL(files.value[index].preview!)
    }
    files.value.splice(index, 1)
  }
}

function clearAll() {
  files.value.forEach(f => {
    if (f.preview) URL.revokeObjectURL(f.preview)
  })
  files.value = []
}

function moveUp(index: number) {
  if (index > 0) {
    [files.value[index], files.value[index - 1]] = [files.value[index - 1], files.value[index]]
  }
}

function moveDown(index: number) {
  if (index < files.value.length - 1) {
    [files.value[index], files.value[index + 1]] = [files.value[index + 1], files.value[index]]
  }
}

async function downloadZip() {
  if (files.value.length === 0) return
  
  processing.value = true
  
  try {
    const zip = new JSZip()
    
    for (const item of previewFiles.value) {
      const arrayBuffer = await item.file.arrayBuffer()
      zip.file(item.newName, arrayBuffer)
    }
    
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${rule.value.prefix || '古籍图片'}.zip`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('打包失败:', e)
    alert('打包失败，请重试')
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="tool-page">
    <header class="tool-header">
      <h1>📁 批量重命名ZIP</h1>
      <p>按"卷-页-面"规则批量重命名图片并打包下载</p>
    </header>

    <!-- 命名规则 -->
    <section class="rule-section">
      <h2>命名规则</h2>
      <div class="rule-form">
        <div class="form-item">
          <label>前缀（卷名）</label>
          <input v-model="rule.prefix" type="text" placeholder="如：卷一" />
        </div>
        <div class="form-item">
          <label>起始页码</label>
          <input v-model.number="rule.startPage" type="number" min="1" />
        </div>
        <div class="form-item">
          <label>分隔符</label>
          <select v-model="rule.separator">
            <option value="-">-</option>
            <option value="_">_</option>
            <option value="">无</option>
          </select>
        </div>
        <div class="form-item">
          <label>页码位数</label>
          <select v-model.number="rule.digits">
            <option :value="2">2位 (01)</option>
            <option :value="3">3位 (001)</option>
            <option :value="4">4位 (0001)</option>
          </select>
        </div>
        <div class="form-item">
          <label>单双面</label>
          <select v-model="rule.side">
            <option value="single">单面</option>
            <option value="double">双面 (a/b)</option>
          </select>
        </div>
        <div class="form-item">
          <label>后缀</label>
          <input v-model="rule.suffix" type="text" placeholder="可选" />
        </div>
      </div>
      <div class="rule-preview">
        预览：<code>{{ rule.prefix }}{{ rule.separator }}{{ String(rule.startPage).padStart(rule.digits, '0') }}{{ rule.side === 'double' ? 'a' : '' }}{{ rule.suffix }}.jpg</code>
      </div>
    </section>

    <!-- 上传区域 -->
    <section 
      class="upload-zone"
      @drop="handleDrop"
      @dragover.prevent
    >
      <input 
        type="file" 
        multiple 
        accept="image/*"
        @change="handleSelect"
        class="file-input"
      />
      <div class="upload-hint">
        <span class="icon">📷</span>
        <p>拖拽图片到此处，或点击选择</p>
        <p class="sub">支持批量上传，可拖拽排序</p>
      </div>
    </section>

    <!-- 文件列表 -->
    <section v-if="files.length > 0" class="file-list">
      <div class="list-header">
        <span>共 {{ files.length }} 个文件</span>
        <button class="clear-btn" @click="clearAll">清空</button>
      </div>
      
      <div class="file-table">
        <div class="table-header">
          <span class="col-thumb">预览</span>
          <span class="col-original">原文件名</span>
          <span class="col-new">新文件名</span>
          <span class="col-action">操作</span>
        </div>
        <div 
          v-for="(item, index) in previewFiles" 
          :key="item.id"
          class="table-row"
        >
          <span class="col-thumb">
            <img v-if="item.preview" :src="item.preview" alt="" />
          </span>
          <span class="col-original">{{ item.originalName }}</span>
          <span class="col-new">{{ item.newName }}</span>
          <span class="col-action">
            <button @click="moveUp(index)" :disabled="index === 0">↑</button>
            <button @click="moveDown(index)" :disabled="index === files.length - 1">↓</button>
            <button @click="removeFile(item.id)" class="del">×</button>
          </span>
        </div>
      </div>

      <button 
        class="download-btn"
        :disabled="processing"
        @click="downloadZip"
      >
        {{ processing ? '打包中...' : '📦 下载ZIP' }}
      </button>
    </section>

    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page { @apply max-w-4xl mx-auto; }
.tool-header { @apply mb-6; }
.tool-header h1 { @apply text-xl md:text-2xl font-bold text-stone-800; }
.tool-header p { @apply text-stone-500 mt-1; }

.rule-section { @apply bg-white rounded-xl p-4 mb-4; }
.rule-section h2 { @apply font-medium text-stone-800 mb-3; }
.rule-form { @apply grid grid-cols-2 md:grid-cols-3 gap-3; }
.form-item { @apply space-y-1; }
.form-item label { @apply block text-sm text-stone-600; }
.form-item input, .form-item select { 
  @apply w-full px-3 py-2 border border-stone-300 rounded-lg text-sm;
}
.rule-preview { @apply mt-3 text-sm text-stone-500; }
.rule-preview code { @apply bg-stone-100 px-2 py-1 rounded; }

.upload-zone {
  @apply relative border-2 border-dashed border-stone-300 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 transition-colors mb-4;
}
.file-input { @apply absolute inset-0 opacity-0 cursor-pointer; }
.upload-hint .icon { @apply text-4xl block mb-2; }
.upload-hint p { @apply text-stone-600; }
.upload-hint .sub { @apply text-sm text-stone-400; }

.file-list { @apply bg-white rounded-xl p-4; }
.list-header { @apply flex justify-between items-center mb-3; }
.clear-btn { @apply text-sm text-red-500 hover:underline; }

.file-table { @apply border border-stone-200 rounded-lg overflow-hidden mb-4; }
.table-header { @apply flex bg-stone-50 px-3 py-2 text-sm font-medium text-stone-600; }
.table-row { @apply flex items-center px-3 py-2 border-t border-stone-100; }

.col-thumb { @apply w-12 flex-shrink-0; }
.col-thumb img { @apply w-10 h-10 object-cover rounded; }
.col-original { @apply flex-1 text-sm text-stone-500 truncate px-2; }
.col-new { @apply flex-1 text-sm text-stone-800 font-medium truncate px-2; }
.col-action { @apply flex gap-1; }
.col-action button { @apply w-6 h-6 text-sm bg-stone-100 rounded hover:bg-stone-200; }
.col-action button.del { @apply text-red-500 hover:bg-red-100; }

.download-btn {
  @apply w-full py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50;
}
</style>
