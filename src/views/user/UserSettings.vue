<script setup lang="ts">
/**
 * 用户设置页面
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

// 表单数据
const profileForm = ref({
  username: user.value?.username || '',
  phone: user.value?.phone || '',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const saving = ref(false)
const message = ref({ type: '', text: '' })

async function saveProfile() {
  saving.value = true
  message.value = { type: '', text: '' }
  
  try {
    const success = await authStore.updateProfile({
      username: profileForm.value.username,
      phone: profileForm.value.phone,
    })
    if (success) {
      message.value = { type: 'success', text: '保存成功' }
    } else {
      message.value = { type: 'error', text: '保存失败' }
    }
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '保存失败' }
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    message.value = { type: 'error', text: '两次密码不一致' }
    return
  }
  
  saving.value = true
  message.value = { type: '', text: '' }
  
  try {
    // TODO: 实际 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.value = { type: 'success', text: '密码修改成功' }
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '修改失败' }
  } finally {
    saving.value = false
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="settings-page">
    <div class="container">
      <header class="page-header">
        <router-link to="/user" class="back-link">← 返回用户中心</router-link>
        <h1>账号设置</h1>
      </header>

      <!-- 消息提示 -->
      <div v-if="message.text" class="message" :class="message.type">
        {{ message.text }}
      </div>

      <!-- 基本信息 -->
      <section class="section">
        <h2>基本信息</h2>
        <form @submit.prevent="saveProfile" class="form">
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" :value="user?.email" disabled />
            <p class="hint">邮箱不可修改</p>
          </div>

          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="profileForm.username"
              type="text"
              placeholder="2-20个字符"
            />
          </div>

          <div class="form-group">
            <label for="phone">手机号（选填）</label>
            <input
              id="phone"
              v-model="profileForm.phone"
              type="tel"
              placeholder="用于接收通知"
            />
          </div>

          <button type="submit" class="save-btn" :disabled="saving">
            {{ saving ? '保存中...' : '保存修改' }}
          </button>
        </form>
      </section>

      <!-- 修改密码 -->
      <section class="section">
        <h2>修改密码</h2>
        <form @submit.prevent="changePassword" class="form">
          <div class="form-group">
            <label for="currentPassword">当前密码</label>
            <input
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="请输入当前密码"
            />
          </div>

          <div class="form-group">
            <label for="newPassword">新密码</label>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="至少6位"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">确认新密码</label>
            <input
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="再次输入新密码"
            />
          </div>

          <button type="submit" class="save-btn" :disabled="saving">
            {{ saving ? '修改中...' : '修改密码' }}
          </button>
        </form>
      </section>

      <!-- 危险操作 -->
      <section class="section danger">
        <h2>账号操作</h2>
        <div class="danger-actions">
          <button class="logout-btn" @click="handleLogout">
            退出登录
          </button>
          <button class="delete-btn" disabled>
            注销账号（暂不支持）
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  @apply min-h-screen bg-stone-100 py-8;
}

.container {
  @apply max-w-2xl mx-auto px-4 space-y-6;
}

.page-header {
  @apply mb-6;
}

.back-link {
  @apply text-sm text-amber-600 hover:underline;
}

.page-header h1 {
  @apply text-2xl font-bold text-stone-800 mt-2;
}

.message {
  @apply p-4 rounded-lg text-sm;
}

.message.success {
  @apply bg-green-50 text-green-700;
}

.message.error {
  @apply bg-red-50 text-red-700;
}

.section {
  @apply bg-white rounded-2xl p-6 shadow-sm;
}

.section h2 {
  @apply font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100;
}

.form {
  @apply space-y-4;
}

.form-group {
  @apply space-y-1;
}

.form-group label {
  @apply block text-sm font-medium text-stone-700;
}

.form-group input {
  @apply w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors disabled:bg-stone-100 disabled:text-stone-500;
}

.hint {
  @apply text-xs text-stone-400;
}

.save-btn {
  @apply px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors;
}

.section.danger h2 {
  @apply text-red-600;
}

.danger-actions {
  @apply flex gap-4;
}

.logout-btn {
  @apply px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50;
}

.delete-btn {
  @apply px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50;
}
</style>
