<script setup lang="ts">
/**
 * 古文朗读工具
 * SEO 优化版本
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ToolPageSeo, { type ToolSeoConfig } from '@/components/common/ToolPageSeo.vue'
import ToolFeedback from '@/components/common/ToolFeedback.vue'

// SEO 配置
const seoConfig: ToolSeoConfig = {
  name: '古文朗读',
  path: '/read/text-to-speech',
  category: '阅读辅助',
  categoryPath: '/read',
  
  description: '免费在线古文朗读工具。使用浏览器语音合成朗读古文，支持调节语速、音调和音量，按句子分段播放。',
  keywords: ['古文朗读', '文字转语音', 'TTS', '语音合成', '古籍朗读', '有声古文'],
  ogImage: '/og-images/default.png',
  
  publishedTime: '2024-01-01T00:00:00Z',
  modifiedTime: new Date().toISOString(),
  
  shortDesc: '使用语音合成朗读古文，支持调节语速音调',
  
  features: [
    '使用浏览器原生语音合成',
    '支持多种中文语音',
    '可调节语速（0.5x-1.5x）',
    '可调节音调和音量',
    '按句子自动分段',
    '显示当前朗读进度',
    '支持跳转到任意句子',
    '完全本地处理'
  ],
  
  howToUse: [
    '粘贴或输入要朗读的古文',
    '选择语音和调节语速',
    '点击播放按钮开始朗读',
    '可随时暂停或跳转',
    '点击句子列表可跳转到指定位置'
  ],
  
  introduction: `古文朗读可以帮助理解文意和感受古文的韵律之美。本工具使用浏览器内置的语音合成功能，无需安装任何软件。

工具会自动按句号、问号、感叹号分割文本，逐句朗读。您可以调节语速让朗读更慢更清晰，也可以调节音调让声音更符合您的喜好。

朗读过程中可以随时暂停，也可以点击句子列表跳转到任意位置继续朗读。`,

  faq: [
    {
      question: '为什么没有声音？',
      answer: '请确保系统已安装中文语音包，并且浏览器音量未静音。'
    },
    {
      question: '语音听起来不自然怎么办？',
      answer: '可以尝试调节语速和音调，或切换不同的语音。不同系统的语音质量有差异。'
    },
    {
      question: '支持哪些浏览器？',
      answer: '支持Chrome、Edge、Safari等现代浏览器。Firefox支持有限。'
    },
    {
      question: '可以保存为音频文件吗？',
      answer: '当前版本暂不支持导出音频文件，仅支持在线播放。'
    },
    {
      question: '古文发音准确吗？',
      answer: '使用现代普通话发音，古音（如入声）无法还原。'
    }
  ],
  
  isOffline: true,
  isFree: true
}

const inputText = ref('')
const isPlaying = ref(false)
const isPaused = ref(false)
const currentIndex = ref(0)

// 语音设置
const rate = ref(0.8)  // 语速
const pitch = ref(1)   // 音调
const volume = ref(1)  // 音量
const selectedVoice = ref<SpeechSynthesisVoice | null>(null)
const availableVoices = ref<SpeechSynthesisVoice[]>([])

// 当前朗读的句子
const sentences = computed(() => {
  return inputText.value
    .split(/[。！？\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
})

const currentSentence = computed(() => sentences.value[currentIndex.value] || '')
const progress = computed(() => {
  if (sentences.value.length === 0) return 0
  return Math.round((currentIndex.value / sentences.value.length) * 100)
})

let utterance: SpeechSynthesisUtterance | null = null

onMounted(() => {
  loadVoices()
  // 某些浏览器需要等待 voiceschanged 事件
  speechSynthesis.onvoiceschanged = loadVoices
})

onUnmounted(() => {
  stop()
})

function loadVoices() {
  const voices = speechSynthesis.getVoices()
  // 筛选中文语音
  availableVoices.value = voices.filter(v => 
    v.lang.startsWith('zh') || v.lang.startsWith('cmn')
  )
  
  // 默认选择第一个中文语音
  if (availableVoices.value.length > 0 && !selectedVoice.value) {
    selectedVoice.value = availableVoices.value[0]
  }
}

function play() {
  if (sentences.value.length === 0) return
  
  if (isPaused.value) {
    speechSynthesis.resume()
    isPaused.value = false
    isPlaying.value = true
    return
  }
  
  isPlaying.value = true
  speakSentence(currentIndex.value)
}

function speakSentence(index: number) {
  if (index >= sentences.value.length) {
    stop()
    return
  }
  
  currentIndex.value = index
  const text = sentences.value[index]
  
  utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate.value
  utterance.pitch = pitch.value
  utterance.volume = volume.value
  
  if (selectedVoice.value) {
    utterance.voice = selectedVoice.value
  }
  
  utterance.onend = () => {
    if (isPlaying.value && !isPaused.value) {
      speakSentence(index + 1)
    }
  }
  
  utterance.onerror = (e) => {
    console.error('Speech error:', e)
    stop()
  }
  
  speechSynthesis.speak(utterance)
}

function pause() {
  speechSynthesis.pause()
  isPaused.value = true
  isPlaying.value = false
}

function stop() {
  speechSynthesis.cancel()
  isPlaying.value = false
  isPaused.value = false
  currentIndex.value = 0
}

function skipTo(index: number) {
  speechSynthesis.cancel()
  currentIndex.value = index
  if (isPlaying.value || isPaused.value) {
    isPaused.value = false
    isPlaying.value = true
    speakSentence(index)
  }
}

function prevSentence() {
  if (currentIndex.value > 0) {
    skipTo(currentIndex.value - 1)
  }
}

function nextSentence() {
  if (currentIndex.value < sentences.value.length - 1) {
    skipTo(currentIndex.value + 1)
  }
}

// 示例文本
const exampleText = `子曰：學而時習之，不亦說乎？
有朋自遠方來，不亦樂乎？
人不知而不慍，不亦君子乎？`

function loadExample() {
  inputText.value = exampleText
}

function clearAll() {
  stop()
  inputText.value = ''
}
</script>

<template>
  <ToolPageSeo :config="seoConfig">
    <div class="tool-body">
      <!-- 文本输入 -->
      <div class="input-section">
        <div class="section-header">
          <h3>输入文本</h3>
          <button class="btn-example" @click="loadExample">加载示例</button>
        </div>
        <textarea
          v-model="inputText"
          class="text-input"
          placeholder="粘贴要朗读的古文..."
          rows="8"
        ></textarea>
      </div>

      <!-- 播放控制 -->
      <div class="player-section">
        <div class="player-display">
          <div class="current-text">
            {{ currentSentence || '准备就绪' }}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
          <div class="progress-info">
            {{ currentIndex + 1 }} / {{ sentences.length || 1 }}
          </div>
        </div>

        <div class="player-controls">
          <button 
            class="ctrl-btn"
            :disabled="sentences.length === 0"
            @click="prevSentence"
          >
            ⏮
          </button>
          
          <button 
            v-if="!isPlaying"
            class="ctrl-btn play"
            :disabled="sentences.length === 0"
            @click="play"
          >
            ▶
          </button>
          <button 
            v-else
            class="ctrl-btn pause"
            @click="pause"
          >
            ⏸
          </button>
          
          <button 
            class="ctrl-btn"
            :disabled="!isPlaying && !isPaused"
            @click="stop"
          >
            ⏹
          </button>
          
          <button 
            class="ctrl-btn"
            :disabled="sentences.length === 0"
            @click="nextSentence"
          >
            ⏭
          </button>
        </div>
      </div>

      <!-- 语音设置 -->
      <div class="settings-section">
        <h3>语音设置</h3>
        
        <div class="setting-row">
          <label>语音</label>
          <select v-model="selectedVoice" class="voice-select">
            <option 
              v-for="voice in availableVoices" 
              :key="voice.name"
              :value="voice"
            >
              {{ voice.name }} ({{ voice.lang }})
            </option>
          </select>
        </div>
        
        <div class="setting-row">
          <label>语速</label>
          <input type="range" v-model.number="rate" min="0.5" max="1.5" step="0.1" />
          <span>{{ rate.toFixed(1) }}x</span>
        </div>
        
        <div class="setting-row">
          <label>音调</label>
          <input type="range" v-model.number="pitch" min="0.5" max="2" step="0.1" />
          <span>{{ pitch.toFixed(1) }}</span>
        </div>
        
        <div class="setting-row">
          <label>音量</label>
          <input type="range" v-model.number="volume" min="0" max="1" step="0.1" />
          <span>{{ Math.round(volume * 100) }}%</span>
        </div>
      </div>

      <!-- 句子列表 -->
      <div v-if="sentences.length > 0" class="sentences-section">
        <h3>句子列表</h3>
        <div class="sentences-list">
          <div
            v-for="(sentence, i) in sentences"
            :key="i"
            class="sentence-item"
            :class="{ active: i === currentIndex, played: i < currentIndex }"
            @click="skipTo(i)"
          >
            <span class="sentence-num">{{ i + 1 }}</span>
            <span class="sentence-text">{{ sentence }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-actions">
      <button class="btn-text" @click="clearAll">清空</button>
      <ToolFeedback tool-name="古文朗读" />
    </div>

    <!-- 提示 -->
    <div v-if="availableVoices.length === 0" class="warning">
      ⚠️ 未检测到中文语音，请确保系统已安装中文语音包
    </div>
    </div>
  </ToolPageSeo>
</template>

<style scoped>
.tool-body {
  @apply max-w-3xl mx-auto space-y-6;
}
.input-section, .player-section, .settings-section, .sentences-section {
  @apply bg-white rounded-xl border border-stone-200 p-4;
}
.section-header {
  @apply flex justify-between items-center mb-3;
}
.section-header h3, .settings-section h3, .sentences-section h3 {
  @apply font-medium text-stone-800;
}
.btn-example {
  @apply px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors;
}
.text-input {
  @apply w-full px-3 py-2 border border-stone-200 rounded-lg font-guji
         focus:border-amber-400 focus:outline-none resize-none;
}
.player-display {
  @apply text-center mb-4;
}
.current-text {
  @apply text-xl font-guji text-stone-800 mb-3 min-h-[2em];
}
.progress-bar {
  @apply h-1 bg-stone-200 rounded-full overflow-hidden mb-2;
}
.progress-fill {
  @apply h-full bg-amber-500 transition-all duration-300;
}
.progress-info {
  @apply text-sm text-stone-500;
}
.player-controls {
  @apply flex justify-center gap-4;
}
.ctrl-btn {
  @apply w-12 h-12 rounded-full bg-stone-100 text-xl
         hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed
         transition-colors flex items-center justify-center;
}
.ctrl-btn.play {
  @apply bg-amber-500 text-white hover:bg-amber-600;
}
.ctrl-btn.pause {
  @apply bg-amber-500 text-white hover:bg-amber-600;
}
.settings-section h3 {
  @apply mb-4;
}
.setting-row {
  @apply flex items-center gap-4 py-2;
}
.setting-row label {
  @apply w-12 text-sm text-stone-600;
}
.setting-row input[type="range"] {
  @apply flex-1 accent-amber-500;
}
.setting-row span {
  @apply w-12 text-sm text-stone-500 text-right;
}
.voice-select {
  @apply flex-1 px-3 py-1.5 border border-stone-200 rounded-lg text-sm;
}
.sentences-section h3 {
  @apply mb-3;
}
.sentences-list {
  @apply max-h-48 overflow-auto space-y-1;
}
.sentence-item {
  @apply flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
         hover:bg-stone-50 transition-colors;
}
.sentence-item.active {
  @apply bg-amber-100;
}
.sentence-item.played {
  @apply text-stone-400;
}
.sentence-num {
  @apply w-6 h-6 rounded-full bg-stone-200 text-xs flex items-center justify-center;
}
.sentence-item.active .sentence-num {
  @apply bg-amber-500 text-white;
}
.sentence-text {
  @apply flex-1 text-sm font-guji truncate;
}
.footer-actions {
  @apply text-center mt-6;
}
.btn-text {
  @apply px-4 py-2 text-stone-500 hover:text-stone-700 transition-colors;
}
.warning {
  @apply mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm;
}
</style>
