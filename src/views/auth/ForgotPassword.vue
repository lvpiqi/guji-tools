<script setup lang="ts">
/**
 * 忘记密码页面
 */
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const email = ref('')
const submitting = ref(false)
const sent = ref(false)

const isValid = computed(() => {
  return email.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
})

async function handleSubmit() {
  if (!isValid.value || submitting.value) return
  
  submitting.value = true
  const success = await authStore.resetPassword(email.value)
  submitting.value = false
  
  if (success) {
    sent.value = true
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <template v-if="!sent">
        <div class="auth-header">
          <router-link to="/" class="logo">古籍工具</router-link>
          <h1>找回密码</h1>
          <p>输入注册邮箱，我们将发送重置链接</p>
        </div>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="请输入注册邮箱"
              autocomplete="email"
              required
            />
          </div>

          <div v-if="authStore.error" class="error-message">
            {{ authStore.error }}
          </div>

          <button
            type="submit"
            class="submit-btn"
            :disabled="!isValid || submitting"
          >
            {{ submitting ? '发送中...' : '发送重置链接' }}
          </button>
        </form>

        <div class="auth-footer">
          <router-link to="/auth/login">← 返回登录</router-link>
        </div>
      </template>

      <template v-else>
        <div class="success-page">
          <div class="success-icon">✉️</div>
          <h2>邮件已发送</h2>
          <p>请查收 {{ email }} 的重置邮件</p>
          <p class="hint">如未收到，请检查垃圾邮件文件夹</p>
          <router-link to="/auth/login" class="home-link">返回登录</router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  @apply min-h-screen flex items-center justify-center bg-stone-100 py-12 px-4;
}

.auth-card {
  @apply w-full max-w-md bg-white rounded-2xl shadow-lg p-8;
}

.auth-header {
  @apply text-center mb-8;
}

.logo {
  @apply text-2xl font-bold text-amber-600;
}

.auth-header h1 {
  @apply text-xl font-bold text-stone-800 mt-4;
}

.auth-header p {
  @apply text-stone-500 mt-1;
}

.auth-form {
  @apply space-y-4;
}

.form-group {
  @apply space-y-1;
}

.form-group label {
  @apply block text-sm font-medium text-stone-700;
}

.form-group input {
  @apply w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors;
}

.error-message {
  @apply p-3 bg-red-50 text-red-600 rounded-lg text-sm;
}

.submit-btn {
  @apply w-full py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.auth-footer {
  @apply text-center mt-6 text-sm;
}

.auth-footer a {
  @apply text-amber-600 hover:underline;
}

.success-page {
  @apply text-center py-8;
}

.success-icon {
  @apply text-5xl mb-4;
}

.success-page h2 {
  @apply text-xl font-bold text-stone-800;
}

.success-page p {
  @apply text-stone-600 mt-2;
}

.success-page .hint {
  @apply text-sm text-stone-500 mt-4;
}

.home-link {
  @apply inline-block mt-6 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600;
}
</style>
