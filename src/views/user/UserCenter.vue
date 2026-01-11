<script setup lang="ts">
/**
 * 用户中心
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_PLANS } from '@core/types/user'

const authStore = useAuthStore()

const user = computed(() => authStore.user)
const quota = computed(() => authStore.quota)
const planInfo = computed(() => authStore.planInfo)

const dailyProgress = computed(() => {
  if (!quota.value || quota.value.dailyLimit === -1) return 100
  return Math.min(100, (quota.value.dailyUsed / quota.value.dailyLimit) * 100)
})

const monthlyProgress = computed(() => {
  if (!quota.value || quota.value.monthlyLimit === -1) return 100
  return Math.min(100, (quota.value.monthlyUsed / quota.value.monthlyLimit) * 100)
})

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="user-center">
    <div class="container">
      <!-- 用户信息卡片 -->
      <div class="profile-card">
        <div class="avatar">
          {{ user?.username?.charAt(0).toUpperCase() || '?' }}
        </div>
        <div class="profile-info">
          <h1>{{ user?.username }}</h1>
          <p class="email">{{ user?.email }}</p>
          <div class="badges">
            <span class="badge plan">{{ planInfo?.name }}</span>
            <span v-if="user?.verified" class="badge verified">已验证</span>
          </div>
        </div>
        <router-link to="/user/settings" class="edit-btn">
          编辑资料
        </router-link>
      </div>

      <!-- 配额使用情况 -->
      <div class="section">
        <h2>使用配额</h2>
        <div class="quota-grid">
          <div class="quota-card">
            <div class="quota-header">
              <span class="quota-title">今日使用</span>
              <span class="quota-value">
                {{ quota?.dailyUsed || 0 }} / {{ quota?.dailyLimit === -1 ? '∞' : quota?.dailyLimit }}
              </span>
            </div>
            <div class="quota-bar">
              <div class="quota-fill" :style="{ width: dailyProgress + '%' }"></div>
            </div>
            <p class="quota-hint">每日 0:00 重置</p>
          </div>

          <div class="quota-card">
            <div class="quota-header">
              <span class="quota-title">本月使用</span>
              <span class="quota-value">
                {{ quota?.monthlyUsed || 0 }} / {{ quota?.monthlyLimit === -1 ? '∞' : quota?.monthlyLimit }}
              </span>
            </div>
            <div class="quota-bar">
              <div class="quota-fill" :style="{ width: monthlyProgress + '%' }"></div>
            </div>
            <p class="quota-hint">每月 1 日重置</p>
          </div>
        </div>
      </div>

      <!-- 当前计划 -->
      <div class="section">
        <div class="section-header">
          <h2>当前计划</h2>
          <router-link to="/pricing" class="upgrade-link">升级计划 →</router-link>
        </div>
        <div class="current-plan">
          <div class="plan-info">
            <h3>{{ planInfo?.name }}</h3>
            <p>{{ planInfo?.description }}</p>
          </div>
          <ul class="plan-features">
            <li v-for="feature in planInfo?.features" :key="feature">
              ✓ {{ feature }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="section">
        <h2>快捷操作</h2>
        <div class="quick-links">
          <router-link to="/user/history" class="quick-link">
            <span class="icon">📊</span>
            <span class="text">使用记录</span>
          </router-link>
          <router-link to="/user/settings" class="quick-link">
            <span class="icon">⚙️</span>
            <span class="text">账号设置</span>
          </router-link>
          <router-link to="/pricing" class="quick-link">
            <span class="icon">💎</span>
            <span class="text">升级计划</span>
          </router-link>
          <router-link to="/user/invite" class="quick-link">
            <span class="icon">🎁</span>
            <span class="text">邀请好友</span>
          </router-link>
        </div>
      </div>

      <!-- 账号信息 -->
      <div class="section">
        <h2>账号信息</h2>
        <div class="info-list">
          <div class="info-item">
            <span class="label">注册时间</span>
            <span class="value">{{ formatDate(user?.createdAt || 0) }}</span>
          </div>
          <div class="info-item">
            <span class="label">最近登录</span>
            <span class="value">{{ formatDate(user?.lastLoginAt || 0) }}</span>
          </div>
          <div class="info-item">
            <span class="label">用户ID</span>
            <span class="value">{{ user?.id }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-center { @apply min-h-screen bg-stone-100 py-4 md:py-8; }
.container { @apply max-w-3xl mx-auto px-4 space-y-4 md:space-y-6; }

.profile-card { @apply bg-white rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 shadow-sm; }
.avatar { @apply w-14 h-14 md:w-16 md:h-16 bg-amber-500 text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold; }
.profile-info { @apply flex-1 text-center md:text-left; }
.profile-info h1 { @apply text-lg md:text-xl font-bold text-stone-800; }
.email { @apply text-stone-500 text-sm; }
.badges { @apply flex justify-center md:justify-start gap-2 mt-2; }
.badge { @apply px-2 py-0.5 text-xs rounded-full; }
.badge.plan { @apply bg-amber-100 text-amber-700; }
.badge.verified { @apply bg-green-100 text-green-700; }
.edit-btn { @apply px-4 py-2 text-sm text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 w-full md:w-auto; }

.section { @apply bg-white rounded-2xl p-4 md:p-6 shadow-sm; }
.section h2 { @apply font-bold text-stone-800 mb-4; }
.section-header { @apply flex items-center justify-between mb-4; }
.section-header h2 { @apply mb-0; }
.upgrade-link { @apply text-sm text-amber-600 hover:underline; }

.quota-grid { @apply grid grid-cols-1 md:grid-cols-2 gap-4; }
.quota-card { @apply p-4 bg-stone-50 rounded-xl; }
.quota-header { @apply flex items-center justify-between mb-2; }
.quota-title { @apply text-sm text-stone-600; }
.quota-value { @apply font-medium text-stone-800; }
.quota-bar { @apply h-2 bg-stone-200 rounded-full overflow-hidden; }
.quota-fill { @apply h-full bg-amber-500 transition-all; }
.quota-hint { @apply text-xs text-stone-400 mt-2; }

.current-plan { @apply p-4 bg-amber-50 rounded-xl border border-amber-200; }
.plan-info h3 { @apply font-bold text-amber-800; }
.plan-info p { @apply text-sm text-amber-600; }
.plan-features { @apply mt-3 space-y-1; }
.plan-features li { @apply text-sm text-amber-700; }

.quick-links { @apply grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4; }
.quick-link { @apply flex flex-col items-center p-3 md:p-4 bg-stone-50 rounded-xl hover:bg-amber-50 transition-colors; }
.quick-link .icon { @apply text-xl md:text-2xl mb-2; }
.quick-link .text { @apply text-xs md:text-sm text-stone-700; }

.info-list { @apply space-y-3; }
.info-item { @apply flex items-center justify-between py-2 border-b border-stone-100 last:border-0; }
.info-item .label { @apply text-sm text-stone-500; }
.info-item .value { @apply text-sm text-stone-800 truncate max-w-[150px] md:max-w-none; }
</style>
