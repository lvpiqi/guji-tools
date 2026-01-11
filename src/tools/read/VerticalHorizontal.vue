<script setup lang="ts">
/**
 * 竖横排转换工具
 * 将竖排文字转为横排，或横排转竖排
 */
import { ref, computed } from 'vue'
import RelatedTools from '@/components/common/RelatedTools.vue'

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
  <div class="tool-page">
    <header class="tool-header">
      <h1 class="tool-title">竖横排转换</h1>
      <p class="tool-desc">将文字在竖排和横排之间切换显示，适配不同阅读习惯</p>
    </header>

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
    </div>

    <RelatedTools />
  </div>
</template>

<style scoped>
.tool-page {
  @apply max-w-5xl mx-auto;
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
.mode-switch {
  @apply flex gap-2 mb-6;
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
