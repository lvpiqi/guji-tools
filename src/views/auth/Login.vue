<script setup lang="ts">
/**
 * 登录页面
 */
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  account: '',  // 邮箱或用户名
  password: '',
  remember: false,
})

const showPassword = ref(false)
const submitting = ref(false)

const isValid = computed(() => {
  return form.value.account && form.value.password.length >= 6
})

async function handleSubmit() {
  if (!isValid.value || submitting.value) return
  
  submitting.value = true
  const success = await authStore.login(form.value.account, form.value.password)
  submitting.value = false
  
  if (success) {
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <router-link to="/" class="logo">古籍工具</router-link>
        <h1>登录</h1>
        <p>登录后享受更多功能</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="account">用户名 / 邮箱</label>
          <input
            id="account"
            v-model="form.account"
            type="text"
            placeholder="请输入用户名或邮箱"
            autocomplete="username"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <div class="password-input">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.remember" />
            <span>记住我</span>
          </label>
          <router-link to="/auth/forgot" class="forgot-link">忘记密码？</router-link>
        </div>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          class="submit-btn"
          :disabled="!isValid || submitting"
        >
          {{ submitting ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>还没有账号？</span>
        <router-link to="/auth/register">立即注册</router-link>
      </div>

      <div class="divider">
        <span>或</span>
      </div>

      <div class="social-login">
        <button class="social-btn wechat" disabled>
          <span class="icon">📱</span>
          微信登录（即将开放）
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { @apply min-h-screen flex items-center justify-center bg-stone-100 py-8 px-4; }
.auth-card { @apply w-full max-w-md bg-white rounded-2xl shadow-lg p-6 md:p-8; }

.auth-header { @apply text-center mb-6 md:mb-8; }
.logo { @apply text-xl md:text-2xl font-bold text-amber-600; }
.auth-header h1 { @apply text-lg md:text-xl font-bold text-stone-800 mt-4; }
.auth-header p { @apply text-stone-500 mt-1 text-sm md:text-base; }

.auth-form { @apply space-y-4; }
.form-group { @apply space-y-1; }
.form-group label { @apply block text-sm font-medium text-stone-700; }
.form-group input { @apply w-full px-3 md:px-4 py-2.5 md:py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-sm md:text-base; }

.password-input { @apply relative; }
.password-input input { @apply pr-16; }
.toggle-password { @apply absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-500 hover:text-stone-700; }

.form-options { @apply flex items-center justify-between; }
.checkbox-label { @apply flex items-center gap-2 text-sm text-stone-600 cursor-pointer; }
.checkbox-label input { @apply w-4 h-4 text-amber-600 rounded; }
.forgot-link { @apply text-sm text-amber-600 hover:underline; }

.error-message { @apply p-3 bg-red-50 text-red-600 rounded-lg text-sm; }
.submit-btn { @apply w-full py-2.5 md:py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors; }

.auth-footer { @apply text-center mt-6 text-sm text-stone-600; }
.auth-footer a { @apply text-amber-600 hover:underline ml-1; }

.divider { @apply flex items-center my-6; }
.divider::before, .divider::after { @apply flex-1 border-t border-stone-200; content: ''; }
.divider span { @apply px-4 text-sm text-stone-400; }

.social-login { @apply space-y-3; }
.social-btn { @apply w-full py-2.5 md:py-3 border border-stone-300 rounded-lg flex items-center justify-center gap-2 text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm; }
.social-btn .icon { @apply text-lg; }
</style>
