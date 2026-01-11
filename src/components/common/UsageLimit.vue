<script setup lang="ts">
/**
 * 使用限制提示组件
 * 显示剩余次数和登录提示
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToolPolicyStore } from '@/stores/toolPolicy'

const props = defineProps<{
  toolId: string
}>()

const authStore = useAuthStore()
const toolPolicyStore = useToolPolicyStore()

const policy = computed(() => toolPolicyStore.getPolicy(props.toolId))
const guestFreeCount = computed(() => policy.value?.guestFreeCount ?? 3)

const isGuest = computed(() => authStore.isGuest)
const remaining = computed(() => authStore.getRemainingUsage(props.toolId, guestFreeCount.value))
const showWarning = computed(() => isGuest.value && remaining.value <= 2)
const showLoginPrompt = computed(() => isGuest.value && remaining.value === 0)

// 已登录用户的配额信息
const quota = computed(() => authStore.quota)
const dailyRemaining = computed(() => {
  if (!quota.value || quota.value.dailyLimit === -1) return -1
  return Math.max(0, quota.value.dailyLimit - quota.value.dailyUsed)
})
</script>

<template>
  <div class="usage-limit">
    <!-- 游客提示 -->
    <template v-if="isGuest">
      <!-- 已用完 -->
      <div v-if="showLoginPrompt" class="limit-alert error">
        <span class="icon">🔒</span>
        <div class="content">
          <p class="title">免费试用次数已用完</p>
          <p class="desc">登录后可继续使用，每日{{ quota?.dailyLimit || 10 }}次</p>
        </div>
        <router-link to="/auth/login" class="action-btn">立即登录</router-link>
      </div>
      
      <!-- 即将用完 -->
      <div v-else-if="showWarning" class="limit-alert warning">
        <span class="icon">⚠️</span>
        <div class="content">
          <p class="title">剩余 {{ remaining }} 次免费试用</p>
          <p class="desc">登录后可获得更多使用次数</p>
        </div>
        <router-link to="/auth/register" class="action-btn secondary">免费注册</router-link>
      </div>
      
      <!-- 正常显示剩余次数 -->
      <div v-else class="limit-info">
        <span class="remaining">剩余 {{ remaining }}/{{ guestFreeCount }} 次试用</span>
        <router-link to="/auth/login" class="login-link">登录获取更多</router-link>
      </div>
    </template>

    <!-- 已登录用户 -->
    <template v-else>
      <div v-if="dailyRemaining === 0" class="limit-alert error">
        <span class="icon">⏰</span>
        <div class="content">
          <p class="title">今日使用次数已达上限</p>
          <p class="desc">明日 0:00 重置，或升级计划获取更多配额</p>
        </div>
        <router-link to="/pricing" class="action-btn">升级计划</router-link>
      </div>
      
      <div v-else-if="dailyRemaining !== -1 && dailyRemaining <= 5" class="limit-alert warning">
        <span class="icon">📊</span>
        <div class="content">
          <p class="title">今日剩余 {{ dailyRemaining }} 次</p>
        </div>
      </div>
      
      <div v-else-if="dailyRemaining !== -1" class="limit-info logged-in">
        <span class="remaining">今日剩余 {{ dailyRemaining }} 次</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.usage-limit {
  @apply mb-4;
}

.limit-alert {
  @apply flex items-center gap-3 p-4 rounded-xl;
}

.limit-alert.error {
  @apply bg-red-50 border border-red-200;
}

.limit-alert.warning {
  @apply bg-yellow-50 border border-yellow-200;
}

.limit-alert .icon {
  @apply text-2xl;
}

.limit-alert .content {
  @apply flex-1;
}

.limit-alert .title {
  @apply font-medium text-stone-800;
}

.limit-alert .desc {
  @apply text-sm text-stone-500 mt-0.5;
}

.action-btn {
  @apply px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors;
}

.action-btn.secondary {
  @apply bg-white text-amber-600 border border-amber-300 hover:bg-amber-50;
}

.limit-info {
  @apply flex items-center justify-between p-3 bg-stone-50 rounded-lg text-sm;
}

.limit-info.logged-in {
  @apply bg-green-50;
}

.remaining {
  @apply text-stone-600;
}

.login-link {
  @apply text-amber-600 hover:underline;
}
</style>
