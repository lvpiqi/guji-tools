<script setup lang="ts">
/**
 * 竖横排转换工具
 * SEO 优化版本
 */
import { ref, computed } from 'vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'
import { useQuota } from '@core/composables/useQuota'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '竖横排转换',
  path: '/read/vertical-horizontal',
  category: '阅读辅助',
  categoryPath: '/read',
  
  description: '免费在线古文竖横排转换工具。将文字在竖排和横排之间切换显示，支持自定义字体、字号和行距。',
  keywords: ['竖排转换', '横排转换', '古文排版', '竖排阅读', '古籍排版', '文字方向'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '将文字在竖排和横排之间切换显示',
  
  features: [
    '横排转竖排显示',
    '竖排转横排显示',
    '可调节字体大小',
    '可调节行距',
    '支持宋体/黑体/楷体',
    '可选显示边框',
    '实时预览效果',
    '一键复制文本'
  ],
  
  howToUse: [
    '粘贴或输入古文文本',
    '选择显示模式（横排/竖排）',
    '调整字体、字号和行距',
    '预览显示效果',
    '可复制文本用于其他用途'
  ],
  
  introduction: `古籍传统上采用竖排排版，从右到左阅读。本工具可以将文字在竖排和横排之间切换，适应不同的阅读习惯。

竖排模式适合阅读古籍原文，更有古典韵味；横排模式则更符合现代阅读习惯，便于快速浏览。

工具还提供字体、字号、行距等设置，可以根据个人喜好调整显示效果。`,

  faq: [
    {
      question: '竖排阅读有什么好处？',
      answer: '竖排是古籍的传统排版方式，更能体现古文的韵味，也有助于理解古人的阅读习惯。'
    },
    {
      question: '可以导出竖排文档吗？',
      answer: '当前版本仅支持在线预览。如需导出，可以截图或使用EPUB生成工具。'
    },
    {
      question: '为什么有些字显示不正常？',
      answer: '可能是字体不支持某些生僻字。可以尝试切换不同的字体。'
    },
    {
      question: '支持繁体字吗？',
      answer: '支持。工具不会改变文字内容，只改变显示方向。'
    }
  ],
  
  isOffline: true,
  isFree: true
}

// 配额检查
const { canPerform, consume } = useQuota('vertical-horizontal', '竖横排转换')

const inputText = ref('')
const mode = ref<'v2h' | 'h2v'>('v2h')

// 显示设置
const fontSize = ref(18)
const lineHeight = ref(1.8)
const showBorder = ref(false)
const fontFamily = ref('guji')

const fontOptions = [
  { value: 'guji', label: '宋体（古籍）' },
  { value: 'sans', label: '黑体' },
  { value: 'kai', label: '楷体' },
]

const outputStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  lineHeight: lineHeight.value,
  fontFamily: fontFamily.value === 'guji' 
    ? '"Noto Serif SC", "Source Han Serif CN", SimSun, serif'
    : fontFamily.value === 'kai'
    ? 'KaiTi, STKaiti, serif'
    : '"Noto Sans SC", "Source Han Sans CN", sans-serif',
}))

const isVertical = computed(() => mode.value === 'h2v')

function copyOutput() {
  navigator.clipboard.writeText(inputText.value)
}

function clearAll() {
  inputText.value = ''
}

// 示例文本
const exampleText = `子曰：「學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？」

有子曰：「其為人也孝弟，而好犯上者，鮮矣；不好犯上，而好作亂者，未之有也。君子務本，本立而道生。孝弟也者，其為仁之本與！」

子曰：「巧言令色，鮮矣仁！」`

function loadExample() {
  inputText.value = exampleText
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">

    <!-- 模式切换 -->
    <div class="mode-switch">
      <button 
        class="mode-btn"
        :class="{ active: mode === 'v2h' }"
        @click="mode = 'v2h'"
      >
        横排显示
      </button>
      <button 
        class="mode-btn"
        :class="{ active: mode === 'h2v' }"
        @click="mode = 'h2v'"
      >
        竖排显示
      </button>
    </div>

    <div class="tool-body">
      <!-- 输入区 -->
      <div class="input-section">
        <div class="section-header">
          <h3>输入文本</h3>
          <button class="btn-example" @click="loadExample">加载示例</button>
        </div>
        <textarea
          v-model="inputText"
          class="text-input"
          placeholder="粘贴古文文本..."
          rows="15"
        ></textarea>
      </div>

      <!-- 输出区 -->
      <div class="output-section">
        <div class="section-header">
          <h3>{{ isVertical ? '竖排预览' : '横排预览' }}</h3>
          <button class="btn-copy" @click="copyOutput">复制</button>
        </div>
        <div 
          class="text-output"
          :class="{ vertical: isVertical, bordered: showBorder }"
          :style="outputStyle"
        >
          {{ inputText || '预览区域' }}
        </div>
      </div>
    </div>

    <!-- 显示设置 -->
    <div class="settings-panel">
      <h3>显示设置</h3>
      
      <div class="settings-grid">
        <div class="setting-item">
          <label>字体大小</label>
          <input type="range" v-model.number="fontSize" min="12" max="32" />
          <span>{{ fontSize }}px</span>
        </div>
        
        <div class="setting-item">
          <label>行距</label>
          <input type="range" v-model.number="lineHeight" min="1.2" max="3" step="0.1" />
          <span>{{ lineHeight.toFixed(1) }}</span>
        </div>
        
        <div class="setting-item">
          <label>字体</label>
          <select v-model="fontFamily">
            <option v-for="opt in fontOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="showBorder" />
            显示边框
          </label>
        </div>
      </div>
    </div>

    <div class="footer-actions">
      <button class="btn-text" @click="clearAll">清空</button>
      <ToolFeedback tool-name="竖横排转换" />
    </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body {
  @apply max-w-5xl mx-auto space-y-6;
}
.mode-switch {
  @apply flex gap-2;
}
.mode-btn {
  @apply px-6 py-2 bg-white border border-stone-200 rounded-lg
         hover:border-amber-400 transition-colors;
}
.mode-btn.active {
  @apply bg-amber-500 text-white border-amber-500;
}
.tool-body {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6;
}
.input-section, .output-section {
  @apply bg-white rounded-xl border border-stone-200 p-4;
}
.section-header {
  @apply flex justify-between items-center mb-3;
}
.section-header h3 {
  @apply font-medium text-stone-800;
}
.btn-example {
  @apply px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors;
}
.btn-copy {
  @apply px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded transition-colors;
}
.text-input {
  @apply w-full px-3 py-2 border border-stone-200 rounded-lg
         focus:border-amber-400 focus:outline-none resize-none;
}
.text-output {
  @apply min-h-[300px] p-4 bg-stone-50 rounded-lg overflow-auto whitespace-pre-wrap;
}
.text-output.vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  @apply h-[400px];
}
.text-output.bordered {
  @apply border border-stone-300;
}
.settings-panel {
  @apply bg-white rounded-xl border border-stone-200 p-4 mb-6;
}
.settings-panel h3 {
  @apply font-medium text-stone-800 mb-4;
}
.settings-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}
.setting-item {
  @apply flex flex-col gap-1;
}
.setting-item label {
  @apply text-sm text-stone-600;
}
.setting-item input[type="range"] {
  @apply accent-amber-500;
}
.setting-item select {
  @apply px-2 py-1 border border-stone-200 rounded text-sm;
}
.setting-item span {
  @apply text-xs text-stone-500;
}
.footer-actions {
  @apply text-center;
}
.btn-text {
  @apply px-4 py-2 text-stone-500 hover:text-stone-700 transition-colors;
}
</style>
