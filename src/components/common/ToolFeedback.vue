<script setup lang="ts">
/**
 * 工具页面内嵌反馈组件
 * 点击弹出模态框输入反馈
 */
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/core/services/supabase'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  toolName: string
}>()

const route = useRoute()
const auth = useAuthStore()

const isOpen = ref(false)
const loading = ref(false)
const submitted = ref(false)

const form = ref({
  type: 'bug' as 'bug' | 'feature' | 'question' | 'other',
  content: '',
  contact: ''
})

const feedbackTypes = [
  { value: 'bug', label: '🐛 功能异常', desc: '工具无法正常使用' },
  { value: 'feature', label: '💡 功能建议', desc: '希望增加新功能' },
  { value: 'question', label: '❓ 使用疑问', desc: '不知道怎么操作' },
  { value: 'other', label: '📝 其他反馈', desc: '其他问题或建议' },
]

async function submitFeedback() {
  if (!form.value.content.trim()) {
    alert('请填写反馈内容')
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.from('feedbacks').insert({
      type: form.value.type,
      content: `[${props.toolName}] ${form.value.content.trim()}`,
      contact: form.value.contact.trim() || null,
      page_url: route.fullPath,
      user_id: auth.user?.id || null,
      user_agent: navigator.userAgent,
      status: 'pending'
    })

    if (error) throw error

    submitted.value = true
    setTimeout(() => {
      closeModal()
    }, 2000)
  } catch (e) {
    console.error('提交反馈失败:', e)
    alert('提交失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function openModal() {
  isOpen.value = true
  submitted.value = false
}

function closeModal() {
  isOpen.value = false
  submitted.value = false
  form.value = { type: 'bug', content: '', contact: '' }
}
</script>

<template>
  <!-- 反馈入口按钮 -->
  <button class="feedback-trigger" @click="openModal">
    <span class="trigger-icon">💬</span>
    <span class="trigger-text">遇到问题？反馈给我们</span>
  </button>

  <!-- 模态框 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <!-- 成功状态 -->
          <div v-if="submitted" class="success-state">
            <div class="success-icon">✅</div>
            <h3>感谢您的反馈！</h3>
            <p>我们会认真处理您的问题</p>
          </div>

          <!-- 表单 -->
          <template v-else>
            <div class="modal-header">
              <div class="header-info">
                <h3>问题反馈</h3>
                <p>反馈「{{ toolName }}」工具的问题</p>
              </div>
              <button class="close-btn" @click="closeModal" aria-label="关闭">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <!-- 反馈类型 -->
              <div class="form-section">
                <label class="section-label">反馈类型</label>
                <div class="type-grid">
                  <label 
                    v-for="t in feedbackTypes" 
                    :key="t.value"
                    class="type-card"
                    :class="{ active: form.type === t.value }"
                  >
                    <input 
                      type="radio" 
                      :value="t.value" 
                      v-model="form.type"
                      class="sr-only"
                    />
                    <span class="type-label">{{ t.label }}</span>
                    <span class="type-desc">{{ t.desc }}</span>
                  </label>
                </div>
              </div>

              <!-- 反馈内容 -->
              <div class="form-section">
                <label class="section-label">
                  问题描述 <span class="required">*</span>
                </label>
                <textarea 
                  v-model="form.content"
                  placeholder="请详细描述您遇到的问题，包括操作步骤、期望结果等..."
                  rows="4"
                  maxlength="1000"
                ></textarea>
                <div class="input-hint">
                  <span>详细的描述有助于我们更快解决问题</span>
                  <span>{{ form.content.length }}/1000</span>
                </div>
              </div>

              <!-- 联系方式 -->
              <div class="form-section">
                <label class="section-label">
                  联系方式 <span class="optional">(选填)</span>
                </label>
                <input 
                  type="text"
                  v-model="form.contact"
                  placeholder="邮箱或微信号，方便我们回复您"
                />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" @click="closeModal">取消</button>
              <button 
                class="btn-submit" 
                @click="submitFeedback"
                :disabled="loading || !form.content.trim()"
              >
                {{ loading ? '提交中...' : '提交反馈' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 触发按钮 - 更低调融入页面 */
.feedback-trigger {
  @apply inline-flex items-center gap-1.5 
         text-sm text-stone-400 
         hover:text-amber-600
         cursor-pointer transition-colors;
}
.trigger-icon {
  @apply text-sm;
}
.trigger-text {
  @apply underline underline-offset-2 decoration-dashed decoration-stone-300
         hover:decoration-amber-400;
}

/* 模态框遮罩 */
.modal-overlay {
  @apply fixed inset-0 z-50 
         bg-black/50 backdrop-blur-sm
         flex items-center justify-center p-4;
}

/* 模态框容器 */
.modal-container {
  @apply bg-white rounded-2xl shadow-2xl 
         w-full max-w-lg max-h-[90vh] overflow-hidden
         flex flex-col;
}

/* 头部 */
.modal-header {
  @apply flex items-start justify-between gap-4 
         px-6 py-5 border-b border-stone-100;
}
.header-info h3 {
  @apply text-lg font-bold text-stone-800;
}
.header-info p {
  @apply text-sm text-stone-500 mt-0.5;
}
.close-btn {
  @apply p-1.5 rounded-lg text-stone-400 
         hover:bg-stone-100 hover:text-stone-600 
         transition-colors flex-shrink-0;
}

/* 主体 */
.modal-body {
  @apply px-6 py-5 space-y-5 overflow-y-auto flex-1;
}

.form-section {
  @apply space-y-2;
}
.section-label {
  @apply block text-sm font-medium text-stone-700;
}
.required {
  @apply text-red-500;
}
.optional {
  @apply text-stone-400 font-normal;
}

/* 类型选择 */
.type-grid {
  @apply grid grid-cols-2 gap-2;
}
.type-card {
  @apply p-3 rounded-xl border-2 border-stone-200
         cursor-pointer transition-all text-center
         hover:border-stone-300;
}
.type-card.active {
  @apply border-amber-500 bg-amber-50;
}
.type-label {
  @apply block text-sm font-medium;
}
.type-desc {
  @apply block text-xs text-stone-400 mt-0.5;
}
.type-card.active .type-desc {
  @apply text-amber-600;
}

/* 输入框 */
textarea, input[type="text"] {
  @apply w-full px-4 py-3 
         border border-stone-200 rounded-xl
         text-sm text-stone-700
         placeholder:text-stone-400
         focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
         transition-all;
}
textarea {
  @apply resize-none;
}

.input-hint {
  @apply flex justify-between text-xs text-stone-400;
}

/* 底部 */
.modal-footer {
  @apply flex gap-3 px-6 py-4 border-t border-stone-100 bg-stone-50;
}
.btn-cancel {
  @apply flex-1 px-4 py-2.5 rounded-xl
         bg-white border border-stone-200 
         text-stone-600 font-medium
         hover:bg-stone-50 transition-colors;
}
.btn-submit {
  @apply flex-1 px-4 py-2.5 rounded-xl
         bg-amber-500 text-white font-medium
         hover:bg-amber-600 
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors;
}

/* 成功状态 */
.success-state {
  @apply py-16 px-6 text-center;
}
.success-icon {
  @apply text-6xl mb-4;
}
.success-state h3 {
  @apply text-xl font-bold text-stone-800 mb-2;
}
.success-state p {
  @apply text-stone-500;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(10px);
}
</style>
