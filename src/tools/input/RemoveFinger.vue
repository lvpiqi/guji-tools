<script setup lang="ts">
/**
 * 去手指阴影工具
 * SEO 优化版本
 */
import { ref, computed } from 'vue'
import FileDropzone from '@components/common/FileDropzone.vue'
import ImageCompare from '@components/common/ImageCompare.vue'
import ProgressBar from '@components/common/ProgressBar.vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'
import { useImageProcessor } from '@core/composables/useImageProcessor'
import { useQuota } from '@core/composables/useQuota'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  // 基础信息
  name: '去手指阴影',
  path: '/input/remove-finger',
  category: '输入处理',
  categoryPath: '/input',
  
  // SEO Meta
  title: '去手指阴影 - 古籍拍摄手指阴影去除工具',
  description: '免费在线去除古籍拍摄时的手指和阴影。基于AI智能识别，自动检测并修复手指遮挡区域，支持批量处理，本地运行保护隐私。',
  keywords: ['去手指阴影', '古籍拍摄', '图像修复', '阴影去除', 'AI修复', '古籍数字化', '图像处理'],
  ogImage: '/og-images/remove-finger.png',
  
  // 时间信息
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  // 内容
  shortDesc: '一键去除拍摄古籍时的手指和阴影，基于 AI 智能识别技术',
  
  features: [
    'AI 智能识别手指和阴影区域',
    '自动修复遮挡部分的文字和图案',
    '支持批量处理多张图片',
    '本地浏览器运行，无需上传服务器',
    '支持 JPG、PNG、WebP 格式',
    '处理前后对比预览',
    '一键打包下载处理结果',
    '完全免费，无水印'
  ],
  
  howToUse: [
    '点击上传区域或拖拽图片到上传框',
    '可一次上传多张需要处理的古籍图片',
    '点击「开始处理」按钮，等待 AI 自动识别和修复',
    '在预览区查看处理前后的对比效果',
    '满意后点击「打包下载」保存所有处理结果'
  ],
  
  introduction: `在拍摄古籍、古书、线装书等珍贵文献时，经常会因为需要按压书页而在照片中留下手指和阴影。这些手指阴影不仅影响美观，还会遮挡部分文字内容，给后续的阅读、OCR识别和数字化存档带来困难。

本工具采用先进的 AI 图像修复技术，能够智能识别图片中的手指和阴影区域，并根据周围的纹理和内容自动填充修复。整个处理过程完全在您的浏览器本地完成，图片不会上传到任何服务器，充分保护您的隐私和文献安全。

无论是个人收藏的古籍拍摄，还是图书馆、博物馆的文献数字化项目，本工具都能帮助您快速批量处理大量图片，显著提升古籍数字化的效率和质量。处理完成后，您还可以使用「自动纠偏」工具校正图片角度，或使用「竖排OCR」进行文字识别。`,

  faq: [
    {
      question: '支持哪些图片格式？',
      answer: '支持常见的 JPG/JPEG、PNG、WebP 格式。建议使用高清原图以获得最佳修复效果。'
    },
    {
      question: '最大可以处理多大的图片？',
      answer: '单张图片最大支持 50MB。对于超大图片，建议先进行适当压缩后再处理。'
    },
    {
      question: '图片会上传到服务器吗？',
      answer: '不会。所有图像处理都在您的浏览器本地完成，图片不会上传到任何服务器，完全保护您的隐私。'
    },
    {
      question: '处理速度如何？',
      answer: '处理速度取决于图片大小和您的设备性能。一般情况下，一张 2000x3000 像素的图片处理时间约为 2-5 秒。'
    },
    {
      question: '可以批量处理吗？',
      answer: '可以。您可以一次上传多张图片，工具会依次处理所有图片，处理完成后可以一键打包下载。'
    },
    {
      question: '修复效果不理想怎么办？',
      answer: '如果自动修复效果不理想，建议尝试：1) 使用更高清的原图；2) 确保手指阴影区域与背景有明显对比；3) 对于复杂情况，可以配合使用「蠹鱼眼修复」工具手动标记修复区域。'
    },
    {
      question: '这个工具收费吗？',
      answer: '基础功能完全免费，每天可免费处理一定数量的图片。如需更大处理量或更高级功能，可以升级到 Pro 版本。'
    }
  ],
  
  // 技术信息
  supportedFormats: ['JPG', 'PNG', 'WebP'],
  maxFileSize: 50,
  isOffline: true,
  isFree: true
}

// 工具逻辑
const { tasks, processing, progress, addFiles, processAll, downloadAllAsZip } = useImageProcessor()
const { canPerform, consume, usageHint } = useQuota('remove-finger', '去手指阴影')

const selectedTask = ref<string | null>(null)
const currentTask = computed(() => tasks.value.find(t => t.id === selectedTask.value))

function getObjectUrl(blob: Blob | File): string {
  return URL.createObjectURL(blob)
}

function handleFiles(files: File[]) {
  addFiles(files)
  if (tasks.value.length && !selectedTask.value) {
    selectedTask.value = tasks.value[0].id
  }
}

async function startProcess() {
  const check = canPerform()
  if (!check.allowed) {
    alert(check.reason || '使用次数已达上限')
    return
  }

  await consume(tasks.value.length)

  await processAll(async (canvas) => {
    // TODO: 接入 MediaPipe + lama-wasm 实际处理
    // 这里是占位的模拟处理
    await new Promise(r => setTimeout(r, 1000))
    return canvas
  })
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <!-- 工具主体 -->
    <div class="tool-body">
      <!-- 左侧：上传区 -->
      <div class="tool-upload">
        <FileDropzone
          accept="image/jpeg,image/png,image/webp"
          :max-size="50"
          @files="handleFiles"
        />

        <!-- 任务列表 -->
        <div v-if="tasks.length" class="task-list">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="task-item"
            :class="{ active: selectedTask === task.id, done: task.status === 'done' }"
            @click="selectedTask = task.id"
          >
            <span class="task-name">{{ task.file.name }}</span>
            <span class="task-status">
              <template v-if="task.status === 'pending'">待处理</template>
              <template v-else-if="task.status === 'processing'">处理中...</template>
              <template v-else-if="task.status === 'done'">✓</template>
              <template v-else>✗</template>
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="tool-actions">
          <div class="actions-left">
            <button
              class="btn-primary"
              :disabled="!tasks.length || processing"
              @click="startProcess"
            >
              {{ processing ? '处理中...' : '开始处理' }}
            </button>
            <button
              class="btn-secondary"
              :disabled="!tasks.some(t => t.status === 'done')"
              @click="downloadAllAsZip"
            >
              打包下载
            </button>
          </div>
          <ToolFeedback tool-name="去手指阴影" />
        </div>

        <ProgressBar v-if="processing" :value="progress" class="mt-4" />
      </div>

      <!-- 右侧：预览区 -->
      <div class="tool-preview">
        <template v-if="currentTask?.result">
          <ImageCompare
            :before="getObjectUrl(currentTask.file)"
            :after="getObjectUrl(currentTask.result.blob)"
          />
        </template>
        <template v-else-if="currentTask">
          <img
            :src="getObjectUrl(currentTask.file)"
            class="preview-image"
            alt="古籍图片预览"
          />
        </template>
        <div v-else class="preview-empty">
          <span>选择或上传图片开始</span>
        </div>
      </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}
.tool-upload {
  @apply space-y-4;
}
.task-list {
  @apply bg-white rounded-lg border border-stone-200 divide-y divide-stone-100;
}
.task-item {
  @apply flex justify-between items-center px-4 py-2 cursor-pointer
         hover:bg-stone-50 transition-colors;
}
.task-item.active {
  @apply bg-amber-50;
}
.task-item.done .task-status {
  @apply text-green-600;
}
.task-name {
  @apply text-sm text-stone-700 truncate;
}
.task-status {
  @apply text-xs text-stone-500;
}
.tool-actions {
  @apply flex items-center justify-between;
}
.actions-left {
  @apply flex gap-3;
}
.btn-primary {
  @apply px-4 py-2 bg-amber-500 text-white rounded-lg
         hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors;
}
.btn-secondary {
  @apply px-4 py-2 bg-stone-200 text-stone-700 rounded-lg
         hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors;
}
.tool-preview {
  @apply bg-white rounded-xl border border-stone-200 p-4 min-h-[400px]
         flex items-center justify-center;
}
.preview-image {
  @apply max-w-full max-h-[500px] object-contain;
}
.preview-empty {
  @apply text-stone-400;
}
</style>
