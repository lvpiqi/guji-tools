<script setup lang="ts">
/**
 * 管理后台布局 - 响应式
 */
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const sidebarOpen = ref(false)

const menuItems = [
  { path: '/admin', name: '概览', icon: '📊', exact: true },
  { path: '/admin/tools', name: '工具管理', icon: '🔧', exact: false },
  { path: '/admin/users', name: '用户管理', icon: '👥', exact: false },
  { path: '/admin/plans', name: '计划管理', icon: '💎', exact: false },
  { path: '/admin/feedback', name: '用户反馈', icon: '💬', exact: false },
  { path: '/admin/seo', name: 'SEO管理', icon: '🔍', exact: false },
  { path: '/admin/content', name: '内容管理', icon: '📝', exact: false },
  { path: '/admin/api', name: 'API配置', icon: '🔑', exact: false },
  { path: '/admin/export', name: '数据导出', icon: '📦', exact: false },
  { path: '/admin/settings', name: '系统设置', icon: '⚙️', exact: false },
]

function isActive(item: typeof menuItems[0]) {
  if (item.exact) return route.path === item.path
  return route.path.startsWith(item.path)
}

function handleLogout() {
  authStore.logout()
  router.push('/')
}

function navigateTo(path: string) {
  router.push(path)
  sidebarOpen.value = false
}
</script>

<template>
  <div class="admin-layout">
    <!-- 移动端顶栏 -->
    <header class="mobile-header">
      <button class="menu-btn" @click="sidebarOpen = true">☰</button>
      <h1>管理后台</h1>
      <div class="spacer"></div>
    </header>

    <!-- 侧边栏遮罩 -->
    <div 
      v-if="sidebarOpen" 
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>

    <!-- 侧边栏 -->
    <aside class="admin-sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <h1>🏛️ 管理后台</h1>
        <button class="close-btn" @click="sidebarOpen = false">×</button>
      </div>
      
      <nav class="sidebar-nav">
        <a
          v-for="item in menuItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item) }"
          @click="navigateTo(item.path)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-name">{{ item.name }}</span>
        </a>
      </nav>
      
      <div class="sidebar-footer">
        <div v-if="user" class="user-info">
          <div class="user-avatar">{{ user.username?.charAt(0).toUpperCase() }}</div>
          <div class="user-detail">
            <span class="user-name">{{ user.username }}</span>
            <span class="user-role">管理员</span>
          </div>
        </div>
        <div class="footer-actions">
          <a class="back-link" @click="navigateTo('/')">← 返回前台</a>
          <button class="logout-btn" @click="handleLogout">退出</button>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.admin-layout { @apply flex min-h-screen bg-stone-100; }

/* 移动端顶栏 */
.mobile-header {
  @apply fixed top-0 left-0 right-0 h-14 bg-stone-800 text-white flex items-center px-4 z-40;
  @apply lg:hidden;
}
.menu-btn { @apply text-2xl p-2; }
.mobile-header h1 { @apply text-lg font-bold ml-2; }
.spacer { @apply flex-1; }

/* 侧边栏遮罩 */
.sidebar-overlay {
  @apply fixed inset-0 bg-black/50 z-40;
  @apply lg:hidden;
}

/* 侧边栏 */
.admin-sidebar {
  @apply fixed left-0 top-0 bottom-0 w-56 bg-stone-800 text-white flex flex-col z-50;
  @apply transform -translate-x-full transition-transform;
  @apply lg:relative lg:translate-x-0;
}
.admin-sidebar.open { @apply translate-x-0; }

.sidebar-header {
  @apply p-4 border-b border-stone-700 flex items-center justify-between;
}
.sidebar-header h1 { @apply text-lg font-bold; }
.close-btn { @apply text-2xl text-stone-400 hover:text-white lg:hidden; }

.sidebar-nav { @apply flex-1 py-4 overflow-y-auto; }

.nav-item {
  @apply flex items-center gap-3 px-4 py-3 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors cursor-pointer;
}
.nav-item.active { @apply bg-amber-600 text-white; }
.nav-icon { @apply text-lg; }
.nav-name { @apply text-sm; }

.sidebar-footer { @apply p-4 border-t border-stone-700 space-y-3; }
.user-info { @apply flex items-center gap-3 pb-3 border-b border-stone-700; }
.user-avatar { @apply w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-sm font-medium; }
.user-detail { @apply flex flex-col; }
.user-name { @apply text-sm font-medium; }
.user-role { @apply text-xs text-stone-400; }
.footer-actions { @apply flex items-center justify-between; }
.back-link { @apply text-sm text-stone-400 hover:text-white cursor-pointer; }
.logout-btn { @apply text-sm text-stone-400 hover:text-red-400; }

/* 主内容区 */
.admin-main {
  @apply flex-1 p-4 overflow-auto;
  @apply lg:p-6;
  padding-top: 4.5rem;
}

@media (min-width: 1024px) {
  .admin-main { padding-top: 1rem; }
}
</style>
