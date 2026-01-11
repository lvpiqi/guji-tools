<script setup lang="ts">
/**
 * 注册页面
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
  inviteCode: '',
})

const showPassword = ref(false)
const submitting = ref(false)
const step = ref(1) // 1: 填写信息, 2: 验证邮箱

const passwordStrength = computed(() => {
  const pwd = form.value.password
  if (!pwd) return { level: 0, text: '' }
  
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  
  if (score <= 1) return { level: 1, text: '弱', color: 'red' }
  if (score <= 3) return { level: 2, text: '中', color: 'yellow' }
  return { level: 3, text: '强', color: 'green' }
})

const isValid = computed(() => {
  return (
    form.value.email &&
    form.value.username.length >= 2 &&
    form.value.password.length >= 6 &&
    form.value.password === form.value.confirmPassword &&
    form.value.agreeTerms
  )
})

const errors = computed(() => {
  const errs: string[] = []
  if (form.value.password && form.value.password.length < 6) {
    errs.push('密码至少6位')
  }
  if (form.value.confirmPassword && form.value.password !== form.value.confirmPassword) {
    errs.push('两次密码不一致')
  }
  return errs
})

async function handleSubmit() {
  if (!isValid.value || submitting.value) return
  
  submitting.value = true
  const success = await authStore.register(
    form.value.email,
    form.value.password,
    form.value.username
  )
  submitting.value = false
  
  if (success) {
    step.value = 2
    // 3秒后跳转
    setTimeout(() => {
      router.push('/')
    }, 3000)
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- 步骤1: 填写信息 -->
      <template v-if="step === 1">
        <div class="auth-header">
          <router-link to="/" class="logo">古籍工具</router-link>
          <h1>创建账号</h1>
          <p>注册后享受更多功能和配额</p>
        </div>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="请输入邮箱"
              autocomplete="email"
              required
            />
          </div>

          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="2-20个字符"
              autocomplete="username"
              minlength="2"
              maxlength="20"
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
                placeholder="至少6位"
                autocomplete="new-password"
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
            <div v-if="form.password" class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :class="passwordStrength.color"
                  :style="{ width: (passwordStrength.level / 3 * 100) + '%' }"
                ></div>
              </div>
              <span class="strength-text" :class="passwordStrength.color">
                {{ passwordStrength.text }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="再次输入密码"
              autocomplete="new-password"
              required
            />
          </div>

          <div class="form-group">
            <label for="inviteCode">邀请码（选填）</label>
            <input
              id="inviteCode"
              v-model="form.inviteCode"
              type="text"
              placeholder="有邀请码可获得额外配额"
            />
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.agreeTerms" />
              <span>
                我已阅读并同意
                <a href="/terms" target="_blank">服务条款</a>
                和
                <a href="/privacy" target="_blank">隐私政策</a>
              </span>
            </label>
          </div>

          <div v-if="errors.length || authStore.error" class="error-message">
            <p v-for="err in errors" :key="err">{{ err }}</p>
            <p v-if="authStore.error">{{ authStore.error }}</p>
          </div>

          <button
            type="submit"
            class="submit-btn"
            :disabled="!isValid || submitting"
          >
            {{ submitting ? '注册中...' : '注册' }}
          </button>
        </form>

        <div class="auth-footer">
          <span>已有账号？</span>
          <router-link to="/auth/login">立即登录</router-link>
        </div>
      </template>

      <!-- 步骤2: 注册成功 -->
      <template v-else>
        <div class="success-page">
          <div class="success-icon">✓</div>
          <h2>注册成功！</h2>
          <p>欢迎加入古籍工具</p>
          <p class="hint">我们已向 {{ form.email }} 发送验证邮件</p>
          <p class="redirect">即将跳转到首页...</p>
          <router-link to="/" class="home-link">立即前往</router-link>
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

.password-input {
  @apply relative;
}

.password-input input {
  @apply pr-16;
}

.toggle-password {
  @apply absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-500 hover:text-stone-700;
}

.password-strength {
  @apply flex items-center gap-2 mt-2;
}

.strength-bar {
  @apply flex-1 h-1 bg-stone-200 rounded-full overflow-hidden;
}

.strength-fill {
  @apply h-full transition-all;
}

.strength-fill.red { @apply bg-red-500; }
.strength-fill.yellow { @apply bg-yellow-500; }
.strength-fill.green { @apply bg-green-500; }

.strength-text {
  @apply text-xs;
}

.strength-text.red { @apply text-red-500; }
.strength-text.yellow { @apply text-yellow-500; }
.strength-text.green { @apply text-green-500; }

.form-options {
  @apply flex items-start;
}

.checkbox-label {
  @apply flex items-start gap-2 text-sm text-stone-600 cursor-pointer;
}

.checkbox-label input {
  @apply w-4 h-4 mt-0.5 text-amber-600 rounded;
}

.checkbox-label a {
  @apply text-amber-600 hover:underline;
}

.error-message {
  @apply p-3 bg-red-50 text-red-600 rounded-lg text-sm space-y-1;
}

.submit-btn {
  @apply w-full py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.auth-footer {
  @apply text-center mt-6 text-sm text-stone-600;
}

.auth-footer a {
  @apply text-amber-600 hover:underline ml-1;
}

/* 成功页面 */
.success-page {
  @apply text-center py-8;
}

.success-icon {
  @apply w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4;
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

.success-page .redirect {
  @apply text-sm text-stone-400 mt-2;
}

.home-link {
  @apply inline-block mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600;
}
</style>
