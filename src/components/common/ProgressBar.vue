<script setup lang="ts">
interface Props {
  value: number
  max?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'amber' | 'green' | 'blue'
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  showLabel: true,
  size: 'md',
  color: 'amber',
})

const percent = computed(() => Math.min(100, (props.value / props.max) * 100))
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<template>
  <div class="progress-wrapper">
    <div class="progress-bar" :class="[`size-${size}`]">
      <div
        class="progress-fill"
        :class="[`color-${color}`]"
        :style="{ width: `${percent}%` }"
      />
    </div>
    <span v-if="showLabel" class="progress-label">{{ Math.round(percent) }}%</span>
  </div>
</template>

<style scoped>
.progress-wrapper {
  @apply flex items-center gap-2;
}
.progress-bar {
  @apply flex-1 bg-stone-200 rounded-full overflow-hidden;
}
.size-sm { @apply h-1; }
.size-md { @apply h-2; }
.size-lg { @apply h-3; }

.progress-fill {
  @apply h-full transition-all duration-300 ease-out;
}
.color-amber { @apply bg-amber-500; }
.color-green { @apply bg-green-500; }
.color-blue { @apply bg-blue-500; }

.progress-label {
  @apply text-sm text-stone-600 w-12 text-right;
}
</style>
