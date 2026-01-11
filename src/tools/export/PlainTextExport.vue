<script setup lang="ts">
/**
 * 纯文本导出
 * 将古籍内容导出为 TXT/MD 格式，支持标点处理
 */
import { ref, computed } from 'vue'
import RelatedTools from '@/components/common/RelatedTools.vue'

const inputText = ref('')
const processing = ref(false)

// 导出选项
const options = ref({
  format: 'txt' as 'txt' | 'md',
  punctuation: 'keep' as 'keep' | 'modern' | 'remove',
  lineBreak: 'paragraph' as 'paragraph' | 'sentence' | 'none',
  addTitle: true,
  title: '',
  addLineNumbers: false,
})

// 古籍标点转现代标点
const punctuationMap: Record<string, string> = {
  "\u300C": "\u201C", // 「 -> "
  "\u300D": "\u201D", // 」 -> "
  "\u300E": "\u2018", // 『 -> '
  "\u300F": "\u2019", // 』 -> '
}

function processText(text: string): string {
  let result = text.trim()
  
  // 标点处理
  if (options.value.punctuation === 'modern') {
    for (const [old, modern] of Object.entries(punctuationMap)) {
      result = result.replace(new RegExp(old, 'g'), modern)
    }
  } else if (options.value.punctuation === 'remove') {
    result = result.replace(/[，。！？；：、""''（）《》【】「」『』]/g, '')
  }
  
  // 换行处理
  if (options.value.lineBreak === 'sentence') {
    result = result.replace(/([。！？])/g, '$1\n')
  } else if (options.value.lineBreak === 'none') {
    result = result.replace(/\n+/g, '')
  }
  
  // 添加行号
  if (options.value.addLineNumbers) {
    const lines = result.split('\n')
    result = lines.map((line, i) => `${String(i + 1).padStart(4, ' ')}  ${line}`).join('\n')
  }
  
  // 添加标题
  if (options.value.addTitle && options.value.title) {
    if (options.value.format === 'md') {
      result = `# ${options.value.title}\n\n${result}`
    } else {
      result = `${options.value.title}\n${'='.repeat(options.value.title.length * 2)}\n\n${result}`
    }
  }
  
  return result
}

const previewText = computed(() => {
  if (!inputText.value) return ''
  const processed = processText(inputText.value)
  return processed.length > 500 ? processed.slice(0, 500) + '...' : processed
})

const charCount = computed(() => {
  const text = inputText.value.replace(/\s/g, '')
  return text.length
})

function downloadFile() {
  if (!inputText.value.trim()) return
  
  processing.value = true
  
  setTimeout(() => {
    const content = processText(inputText.value)
    const ext = options.value.format
    const filename = `${options.value.title || '古籍文本'}.${ext}`
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    
    processing.value = false
  }, 200)
}

function copyToClipboard() {
  const content = processText(inputText.value)
  navigator.clipboard.writeText(content)
  alert('已复制到剪贴板')
}

function clearAll() {
  inputText.value = ''
  options.value.title = ''
}

const exampleText = `子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？」

有子曰：「其为人也孝弟，而好犯上者，鲜矣；不好犯上，而好作乱者，未之有也。君子务本，本立而道生。孝弟也者，其为仁之本与！」

子曰：「巧言令色，鲜矣仁！」`

function useExample() {
  inputText.value = exampleText
  options.value.title = '论语·学而篇'
}
</script>

<template>
  <div class="tool-page">
    <header class="tool-header">
      <h1>📄 纯文本导出</h1>
      <p>将古籍内容导出为 TXT/MD 格式</p>
    </header>

    <!-- 导出选项 -->
    <div class="options-section">
      <h2>导出选项</h2>
      <div class="options-grid">
        <div class="option-item">
          <label>文件格式</label>
          <select v-model="options.format">
            <option value="txt">纯文本 (.txt)</option>
            <option value="md">Markdown (.md)</option>
          </select>
        </div>
        
        <div class="option-item">
          <label>标点处理</label>
          <select v-model="options.punctuation">
            <option value="keep">保持原样</option>
            <option value="modern">转现代标点</option>
            <option value="remove">移除标点</option>
          </select>
        </div>
        
        <div class="option-item">
          <label>换行方式</label>
          <select v-model="options.lineBreak">
            <option value="paragraph">按段落</option>
            <option value="sentence">按句子</option>
            <option value="none">不换行</option>
          </select>
        </div>
        
        <div class="option-item">
          <label>文档标题</label>
          <input v-model="options.title" type="text" placeholder="可选" />
        </div>
        
        <div class="option-item checkbox-item">
          <label>
            <input type="checkbox" v-model="options.addTitle" />
            添加标题到文档
          </label>
        </div>
        
        <div class="option-item checkbox-item">
          <label>
            <input type="checkbox" v-model="options.addLineNumbers" />
            添加行号
          </label>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <div class="input-header">
        <h2>输入文本</h2>
        <span class="char-count">{{ charCount }} 字</span>
      </div>
      <textarea
        v-model="inputText"
        placeholder="请粘贴或输入古籍文本..."
        rows="8"
      ></textarea>
      <button class="example-btn" @click="useExample">使用示例文本</button>
    </div>

    <!-- 预览区域 -->
    <div v-if="inputText" class="preview-section">
      <h2>导出预览</h2>
      <pre class="preview-content">{{ previewText }}</pre>
    </div>

    <!-- 操作按钮 -->
    <div class="actions-section">
      <button 
        class="download-btn"
        :disabled="processing || !inputText.trim()"
        @click="downloadFile"
      >
        {{ processing ? '处理中...' : `📥 下载 .${options.format} 文件` }}
      </button>
      <button 
        class="copy-btn"
        :disabled="!inputText.trim()"
        @click="copyToClipboard"
      >
        📋 复制到剪贴板
      </button>
      <button class="clear-btn" @click="clearAll">清空</button>
    </div>

    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page { @apply max-w-4xl mx-auto; }
.tool-header { @apply mb-6; }
.tool-header h1 { @apply text-xl md:text-2xl font-bold text-stone-800; }
.tool-header p { @apply text-stone-500 mt-1; }

.options-section { @apply bg-white rounded-xl p-4 mb-4; }
.options-section h2 { @apply font-medium text-stone-800 mb-3; }
.options-grid { @apply grid grid-cols-2 md:grid-cols-3 gap-4; }
.option-item { @apply space-y-1; }
.option-item > label { @apply block text-sm text-stone-600; }
.option-item select, .option-item input[type="text"] {
  @apply w-full px-3 py-2 border border-stone-300 rounded-lg text-sm;
}
.checkbox-item label { @apply flex items-center gap-2 text-sm cursor-pointer; }

.input-section { @apply bg-white rounded-xl p-4 mb-4; }
.input-header { @apply flex justify-between items-center mb-2; }
.input-header h2 { @apply font-medium text-stone-800; }
.char-count { @apply text-sm text-stone-500; }
.input-section textarea {
  @apply w-full p-3 border border-stone-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono text-sm;
}
.example-btn { @apply mt-2 text-sm text-amber-600 hover:underline; }

.preview-section { @apply bg-white rounded-xl p-4 mb-4; }
.preview-section h2 { @apply font-medium text-stone-800 mb-3; }
.preview-content {
  @apply bg-stone-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap max-h-64 overflow-auto;
}

.actions-section { @apply flex flex-wrap gap-3; }
.download-btn {
  @apply flex-1 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50;
}
.copy-btn {
  @apply px-6 py-3 border border-stone-300 rounded-lg hover:bg-stone-50;
}
.clear-btn {
  @apply px-6 py-3 border border-stone-300 rounded-lg hover:bg-stone-50 text-red-500;
}
</style>
