<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)

const categories = [
  { name: '\u8F93\u5165', path: '/input', icon: '\u{1F4F7}' },
  { name: '\u6E05\u7406', path: '/clean', icon: '\u2728' },
  { name: '\u9605\u8BFB', path: '/read', icon: '\u{1F4D6}' },
  { name: '\u641C\u7D22', path: '/search', icon: '\u{1F50D}' },
  { name: '\u8F93\u51FA', path: '/export', icon: '\u{1F4E4}' },
  { name: '\u4E13\u4E1A', path: '/pro', icon: '\u{1F393}' },
]

function navigateTo(path: string) {
  router.push(path)
  mobileMenuOpen.value = false
  userMenuOpen.value = false
}

function handleLogout() {
  authStore.logout()
  userMenuOpen.value = false
  router.push('/')
}

function closeUserMenu(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.user-dropdown')) {
    userMenuOpen.value = false
  }
}
</script>

<template>
  <header class="app-header" @click="closeUserMenu">
    <div class="header-left">
      <button class="menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">☰</button>
      <router-link to="/" class="logo">
        <span class="logo-icon">📜</span>
        <span class="logo-text">古籍工具</span>
      </router-link>
    </div>
    
    <div class="header-center">
      <input type="search" placeholder="搜索工具..." class="search-input" />
    </div>
    
    <div class="header-right">
      <template v-if="isAuthenticated">
        <div class="user-dropdown" @click.stop>
          <button class="user-btn" @click="userMenuOpen = !userMenuOpen">
            <span class="user-avatar">{{ user?.username?.charAt(0) }}</span>
            <span class="user-name">{{ user?.username }}</span>
            <span class="dropdown-arrow">{{ userMenuOpen ? '▲' : '▼' }}</span>
          </button>
          
          <Transition name="dropdown">
            <div v-if="userMenuOpen" class="dropdown-menu">
              <div class="dropdown-header">
                <span class="dropdown-avatar">{{ user?.username?.charAt(0) }}</span>
                <div class="dropdown-info">
                  <span class="dropdown-name">{{ user?.username }}</span>
                  <span class="dropdown-email">{{ user?.email }}</span>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <a class="dropdown-item" @click="navigateTo('/user')">
                <span>👤</span> 个人中心
              </a>
              <a class="dropdown-item" @click="navigateTo('/user/settings')">
                <span>⚙️</span> 账号设置
              </a>
              <a v-if="isAdmin" class="dropdown-item" @click="navigateTo('/admin')">
                <span>🏛️</span> 管理后台
              </a>
              <div class="dropdown-divider"></div>
              <a class="dropdown-item logout" @click="handleLogout">
                <span>🚪</span> 退出登录
              </a>
            </div>
          </Transition>
        </div>
      </template>
      <template v-else>
        <router-link to="/auth/login" class="login-btn">登录</router-link>
      </template>
    </div>
  </header>

  <div v-if="mobileMenuOpen" class="mobile-overlay" @click="mobileMenuOpen = false"></div>
  <nav class="mobile-menu" :class="{ open: mobileMenuOpen }">
    <div class="mobile-menu-header">
      <span>工具分类</span>
      <button @click="mobileMenuOpen = false">×</button>
    </div>
    <a v-for="cat in categories" :key="cat.path" class="mobile-menu-item" @click="navigateTo(cat.path)">
      <span>{{ cat.icon }}</span>
      <span>{{ cat.name }}</span>
    </a>
    <div class="mobile-menu-divider"></div>
    <a class="mobile-menu-item" @click="navigateTo('/pricing')">
      <span>💎</span>
      <span>定价</span>
    </a>
    <a v-if="isAuthenticated" class="mobile-menu-item" @click="navigateTo('/user')">
      <span>👤</span>
      <span>用户中心</span>
    </a>
  </nav>
</template>


<style scoped>
.app-header {
  @apply h-14 px-4 flex items-center justify-between bg-white border-b border-stone-200;
}
.header-left { @apply flex items-center gap-2; }
.menu-btn {
  @apply text-xl p-2 text-stone-600;
  @apply md:hidden;
}
.logo {
  @apply flex items-center gap-2 text-base md:text-lg font-semibold text-stone-800 hover:text-amber-600 transition-colors;
}
.logo-icon { @apply text-xl md:text-2xl; }
.logo-text { @apply hidden sm:inline; }
.header-center { @apply hidden md:block; }
.search-input {
  @apply w-64 px-4 py-1.5 rounded-full bg-stone-100 border border-transparent focus:border-amber-400 focus:bg-white focus:outline-none transition-all;
}
.header-right { @apply flex items-center gap-2; }

.user-dropdown { @apply relative; }
.user-btn {
  @apply flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors;
}
.user-avatar {
  @apply w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold;
}
.user-name { @apply text-sm text-stone-700 hidden sm:inline font-medium; }
.dropdown-arrow { @apply text-xs text-stone-400 hidden sm:inline; }

.dropdown-menu {
  @apply absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-50;
}
.dropdown-header { @apply flex items-center gap-3 px-4 py-3; }
.dropdown-avatar {
  @apply w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center text-lg font-bold;
}
.dropdown-info { @apply flex flex-col; }
.dropdown-name { @apply text-sm font-medium text-stone-800; }
.dropdown-email { @apply text-xs text-stone-500 truncate max-w-[140px]; }
.dropdown-divider { @apply border-t border-stone-100 my-1; }
.dropdown-item {
  @apply flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors;
}
.dropdown-item.logout { @apply text-red-600 hover:bg-red-50; }

.login-btn {
  @apply px-3 py-1.5 text-sm text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50;
}

.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-8px); }

.mobile-overlay {
  @apply fixed inset-0 bg-black/50 z-40;
  @apply md:hidden;
}
.mobile-menu {
  @apply fixed left-0 top-0 bottom-0 w-64 bg-white z-50 transform -translate-x-full transition-transform;
  @apply md:hidden;
}
.mobile-menu.open { @apply translate-x-0; }
.mobile-menu-header {
  @apply flex items-center justify-between px-4 py-3 border-b border-stone-200 font-medium;
}
.mobile-menu-header button { @apply text-2xl text-stone-400; }
.mobile-menu-item {
  @apply flex items-center gap-3 px-4 py-3 text-stone-700 hover:bg-stone-50 cursor-pointer;
}
.mobile-menu-divider { @apply border-t border-stone-200 my-2; }
</style>
