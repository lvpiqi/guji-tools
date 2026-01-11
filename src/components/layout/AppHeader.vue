<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)

// 搜索相关
const searchQuery = ref('')
const showSearchResults = ref(false)

// 所有工具列表
const allTools = [
  { name: '去手指阴影', desc: '一键去除拍摄时的手指和阴影', path: '/input/remove-finger', icon: '👆' },
  { name: '自动纠偏', desc: '校正倾斜的扫描图像', path: '/input/deskew', icon: '📐' },
  { name: '竖排OCR', desc: '专为古籍竖排文字优化的识别', path: '/input/ocr-vertical', icon: '📝' },
  { name: '自动句读', desc: '为古文自动添加标点符号', path: '/input/punctuation', icon: '。' },
  { name: '繁简转换', desc: '繁体简体双向转换', path: '/input/convert', icon: '繁' },
  { name: '批量重命名', desc: '按规则批量重命名并打包', path: '/input/batch-rename', icon: '📁' },
  { name: '古汉语分词', desc: '文言文自动分词+词性标注', path: '/input/segmentation', icon: '📝' },
  { name: '拼音注音', desc: '为古文添加拼音/注音标注', path: '/input/pinyin', icon: '🔤' },
  { name: '背景统一', desc: '统一页面背景色，消除光照不均', path: '/clean/background-unify', icon: '🌅' },
  { name: '蠹鱼眼修复', desc: 'AI智能修复虫蛀墨点', path: '/clean/inpaint', icon: '🔧' },
  { name: 'AI超分', desc: '提升图像分辨率和清晰度', path: '/clean/super-resolution', icon: '🔬' },
  { name: '印章提取', desc: '从文档中提取印章图像', path: '/clean/extract-seal', icon: '🔴' },
  { name: '中缝阴影补偿', desc: '消除书籍中缝的黑影', path: '/clean/spine-remove', icon: '📖' },
  { name: '图片压缩', desc: '转换WebP/AVIF格式', path: '/clean/compress', icon: '🗜️' },
  { name: '空白页检测', desc: '自动检测空白页和重复页', path: '/clean/blank-detect', icon: '🔍' },
  { name: '污渍修复', desc: '自动修复水渍和黄斑', path: '/clean/stain-remove', icon: '💧' },
  { name: '竖横排转换', desc: '竖排文字转横排显示', path: '/read/vertical-horizontal', icon: '↔️' },
  { name: '划词释义', desc: '选中文字即时查看释义', path: '/read/dictionary', icon: '📚' },
  { name: '古文朗读', desc: '文字转语音朗读', path: '/read/tts', icon: '🔊' },
  { name: '古文翻译', desc: '文言→现代汉语→英文', path: '/read/translate', icon: '🌐' },
  { name: '异体字搜索', desc: '搜索包含异体字的内容', path: '/search/variant-search', icon: '字' },
  { name: '版本对比', desc: '对比不同版本的文本差异', path: '/search/diff-compare', icon: '⚖️' },
  { name: '双层PDF', desc: '图像+可搜索文本层', path: '/export/dual-layer-pdf', icon: '📄' },
  { name: 'EPUB生成', desc: '生成电子书格式', path: '/export/epub', icon: '📱' },
  { name: '长图生成', desc: '多页合并为长图', path: '/export/long-image', icon: '📜' },
  { name: '纯文本导出', desc: '导出TXT/MD格式', path: '/export/plain-text', icon: '📄' },
  { name: '字形演变', desc: '查看汉字从甲骨文到楷书的演变', path: '/pro/glyph-evolution', icon: '甲' },
  { name: '押韵检测', desc: '检测诗词的押韵情况', path: '/pro/rhyme-check', icon: '韵' },
  { name: '古画色卡', desc: '提取古画的传统色彩', path: '/pro/color-palette', icon: '🎨' },
  { name: '自动摘要', desc: 'AI生成摘要、关键词、主题', path: '/pro/summary', icon: '📋' },
]

// 搜索结果
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  const q = searchQuery.value.toLowerCase()
  return allTools.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.desc.toLowerCase().includes(q)
  ).slice(0, 8)
})

// 选择搜索结果
function selectResult(path: string) {
  router.push(path)
  searchQuery.value = ''
  showSearchResults.value = false
}

// 关闭搜索结果
function closeSearch() {
  setTimeout(() => {
    showSearchResults.value = false
  }, 200)
}

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
      <div class="search-wrapper">
        <input 
          v-model="searchQuery"
          type="search" 
          placeholder="搜索工具..." 
          class="search-input"
          @focus="showSearchResults = true"
          @blur="closeSearch"
          @keydown.enter="searchResults.length && selectResult(searchResults[0].path)"
        />
        <!-- 搜索结果下拉 -->
        <div v-if="showSearchResults && searchResults.length" class="search-results">
          <a 
            v-for="tool in searchResults" 
            :key="tool.path"
            class="search-item"
            @mousedown.prevent="selectResult(tool.path)"
          >
            <span class="search-icon">{{ tool.icon }}</span>
            <div class="search-info">
              <span class="search-name">{{ tool.name }}</span>
              <span class="search-desc">{{ tool.desc }}</span>
            </div>
          </a>
        </div>
        <!-- 无结果提示 -->
        <div v-else-if="showSearchResults && searchQuery.trim() && !searchResults.length" class="search-results">
          <div class="search-empty">未找到相关工具</div>
        </div>
      </div>
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
.search-wrapper { @apply relative; }
.search-input {
  @apply w-64 px-4 py-1.5 rounded-full bg-stone-100 border border-transparent focus:border-amber-400 focus:bg-white focus:outline-none transition-all;
}
.search-results {
  @apply absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-50 max-h-80 overflow-y-auto;
}
.search-item {
  @apply flex items-center gap-3 px-4 py-2 hover:bg-amber-50 cursor-pointer transition-colors;
}
.search-icon { @apply text-xl; }
.search-info { @apply flex flex-col; }
.search-name { @apply text-sm font-medium text-stone-800; }
.search-desc { @apply text-xs text-stone-500; }
.search-empty { @apply px-4 py-3 text-sm text-stone-400 text-center; }
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
