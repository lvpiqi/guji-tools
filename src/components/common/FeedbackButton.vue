<script setup lang="ts">
/**
 * 问题反馈浮动按钮组件
 * 点击弹出反馈表单
 */
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/core/services/supabase'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const isOpen = ref(false)
const loading = ref(false)
const submitted = ref(false)

// 表单数据
const form = ref({
  type: 'bug' as 'bug' | 'feature' | 'question' | 'other',
  content: '',
  contact: ''
})

const feedbackTypes = [
  { value: 'bug', label: '🐛 问题反馈', desc: '功能异常或错误' },
  { value: 'feature', label: '💡 功能建议', desc: '希望增加的功能' },
  { value: 'question', label: '❓ 使用疑问', desc: '不知道怎么用' },
  { value: 'other', label: '📝 其他', desc: '其他反馈' },
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
      content: form.value.content.trim(),
      contact: form.value.contact.trim() || null,
      page_url: route.fullPath,
      user_id: auth.user?.id || null,
      user_agent: navigator.userAgent,
      status: 'pending'
    })

    if (error) throw error

    submitted.value = true
    // 3秒后关闭
    setTimeout(() => {
      isOpen.value = false
      submitted.value = false
      form.value = { type: 'bug', content: '', contact: '' }
    }, 2000)
  } catch (e) {
    console.error('提交反馈失败:', e)
    alert('提交失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function openFeedback() {
  isOpen.value = true
  submitted.value = false
}
</script>

<template>
  <!-- 浮动按钮 -->
  <button 
    v-if="!isOpen"
    class="feedback-btn"
    @click="openFeedback"
    title="问题反馈"
  >
    💬
  </button>

  <!-- 反馈弹窗 -->
  <Teleport to="body">
    <div v-if="isOpen" class="feedback-overlay" @click.self="isOpen = false">
      <div class="feedback-modal">
        <!-- 成功状态 -->
        <div v-if="submitted" class="feedback-success">
          <span class="success-icon">✅</span>
          <p>感谢您的反馈！</p>
          <p class="success-sub">我们会尽快处理</p>
        </div>

        <!-- 表单 -->
        <template v-else>
          <div class="modal-header">
            <h3>问题反馈</h3>
            <button class="close-btn" @click="isOpen = false">✕</button>
          </div>

          <div class="modal-body">
            <!-- 反馈类型 -->
            <div class="form-group">
              <label>反馈类型</label>
              <div class="type-grid">
                <label 
                  v-for="t in feedbackTypes" 
                  :key="t.value"
                  class="type-option"
                  :class="{ active: form.type === t.value }"
                >
                  <input 
                    type="radio" 
                    :value="t.value" 
                    v-model="form.type"
                    class="sr-only"
                  />
                  <span class="type-label">{{ t.label }}</span>
                </label>
              </div>
            </div>

            <!-- 反馈内容 -->
            <div class="form-group">
              <label>反馈内容 <span class="required">*</span></label>
              <textarea 
                v-model="form.content"
                placeholder="请详细描述您遇到的问题或建议..."
                rows="4"
                maxlength="1000"
              ></textarea>
              <span class="char-count">{{ form.content.length }}/1000</span>
            </div>

            <!-- 联系方式 -->
            <div class="form-group">
              <label>联系方式 <span class="optional">(选填)</span></label>
              <input 
                type="text"
                v-model="form.contact"
                placeholder="邮箱或微信，方便我们回复您"
              />
            </div>

            <!-- 当前页面 -->
            <div class="current-page">
              <span>📍 当前页面：{{ route.path }}</span>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="isOpen = false">取消</button>
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
  </Teleport>
</template>

<style scoped>
/* 浮动按钮 */
.feedback-btn {
  @apply fixed bottom-6 right-6 z-50
         w-12 h-12 rounded-full
         bg-amber-500 hover:bg-amber-600
         text-xl shadow-lg
         flex items-center justify-center
         transition-all hover:scale-110;
}

/* 遮罩层 */
.feedback-overlay {
  @apply fixed inset-0 z-50 bg-black/50
         flex items-center justify-center p-4;
}

/* 弹窗 */
.feedback-modal {
  @apply bg-white rounded-xl shadow-2xl w-full max-w-md
         max-h-[90vh] overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between px-5 py-4 border-b border-stone-200;
}
.modal-header h3 {
  @apply text-lg font-bold text-stone-800;
}
.close-btn {
  @apply w-8 h-8 rounded-full hover:bg-stone-100
         flex items-center justify-center text-stone-500;
}

.modal-body {
  @apply px-5 py-4 space-y-4;
}

.modal-footer {
  @apply flex gap-3 px-5 py-4 border-t border-stone-200;
}

/* 表单 */
.form-group {
  @apply space-y-2;
}
.form-group label {
  @apply block text-sm font-medium text-stone-700;
}
.required {
  @apply text-red-500;
}
.optional {
  @apply text-stone-400 font-normal;
}

.type-grid {
  @apply grid grid-cols-2 gap-2;
}
.type-option {
  @apply px-3 py-2 rounded-lg border-2 border-stone-200
         cursor-pointer transition-all text-center;
}
.type-option.active {
  @apply border-amber-500 bg-amber-50;
}
.type-label {
  @apply text-sm;
}

textarea, input[type="text"] {
  @apply w-full px-3 py-2 border border-stone-300 rounded-lg
         focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
         text-sm;
}
textarea {
  @apply resize-none;
}

.char-count {
  @apply text-xs text-stone-400 text-right block;
}

.current-page {
  @apply text-xs text-stone-400 bg-stone-50 px-3 py-2 rounded;
}

/* 按钮 */
.btn-cancel {
  @apply flex-1 px-4 py-2 rounded-lg
         bg-stone-100 text-stone-600 hover:bg-stone-200
         transition-colors;
}
.btn-submit {
  @apply flex-1 px-4 py-2 rounded-lg
         bg-amber-500 text-white hover:bg-amber-600
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors;
}

/* 成功状态 */
.feedback-success {
  @apply py-12 text-center;
}
.success-icon {
  @apply text-5xl block mb-4;
}
.feedback-success p {
  @apply text-lg font-medium text-stone-800;
}
.success-sub {
  @apply text-sm text-stone-500 mt-1;
}
</style>
