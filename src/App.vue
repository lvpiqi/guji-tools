<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@components/layout/AppHeader.vue'
import AppSidebar from '@components/layout/AppSidebar.vue'
import AppFooter from '@components/layout/AppFooter.vue'
import FeedbackButton from '@components/common/FeedbackButton.vue'

const route = useRoute()

// 这些路由使用独立布局，不显示全局 Header/Sidebar
const independentLayouts = ['/admin', '/auth']

const useGlobalLayout = computed(() => {
  return !independentLayouts.some(path => route.path.startsWith(path))
})
</script>

<template>
  <!-- 全局布局（首页、工具页等） -->
  <div v-if="useGlobalLayout" class="app-container">
    <AppHeader />
    <div class="app-body">
      <AppSidebar />
      <main class="app-main">
        <router-view v-slot="{ Component }">
          <keep-alive :max="5">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </main>
    </div>
    <AppFooter />
    <FeedbackButton />
  </div>
  
  <!-- 独立布局（后台、登录等） -->
  <router-view v-else />
</template>

<style scoped>
.app-container {
  @apply min-h-screen flex flex-col bg-stone-50;
}
.app-body {
  @apply flex flex-1;
}
.app-main {
  @apply flex-1 p-4 md:p-6 overflow-auto;
}
</style>
