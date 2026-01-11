<script setup lang="ts">
/**
 * 配额检查组件
 * 在工具页面显示剩余次数，并在使用前检查配额
 */
import { computed } from 'vue'
import { useQuota } from '@core/composables/useQuota'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  toolId: string
  toolName: string
  guestFreeCount?: number
}>()

const authStore = useAuthStore()
const { remaining, usageHint, canPerform, isLoggedIn } = useQuota(props.toolId, props.toolName)

const showLoginPrompt = computed(() => {
  if (isLoggedIn.value) return false
  return remaining.value <= 1
})

const quotaClass = computed(() => {
  if (remaining.value === -1) return 'unlimited'
  if (remaining.value <= 0) return 'exhausted'
  if (remaining.value <= 2) return 'low'
  return 'normal'
})
</script>

<template>
  <div class="quota-guard">
    <!-- 配额提示 -->
    <div class="quota-info" :class="quotaClass">
      <span class="quota-icon">
        <template v-if="quotaClass === 'unlimited'">♾️</template>
        <template v-else-if="quotaClass === 'exhausted'">🚫</template>
        <template v-else-if="quotaClass === 'low'">⚠️</template>
        <template v-else>✨</template>
      </span>
      <span class="quota-text">{{ usageHint }}</span>
    </div>

    <!-- 登录提示 -->
    <div v-if="showLoginPrompt" class="login-prompt">
      <p>登录后可获得更多使用次数</p>
      <router-link to="/auth/login" class="login-btn">立即登录</router-link>
      <router-link to="/auth/register" class="register-link">免费注册</router-link>
    </div>
  </div>
</template>

<style scoped>
.quota-guard {
  @apply mb-4;
}

.quota-info {
  @apply inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm;
}

.quota-info.normal {
  @apply bg-green-50 text-green-700;
}

.quota-info.low {
  @apply bg-amber-50 text-amber-700;
}

.quota-info.exhausted {
  @apply bg-red-50 text-red-700;
}

.quota-info.unlimited {
  @apply bg-blue-50 text-blue-700;
}

.login-prompt {
  @apply mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-sm;
}

.login-prompt p {
  @apply text-amber-700 flex-1;
}

.login-btn {
  @apply px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600;
}

.register-link {
  @apply text-amber-600 hover:underline;
}
</style>
