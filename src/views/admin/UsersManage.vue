<script setup lang="ts">
/**
 * 用户管理页面
 */
import { ref, computed, onMounted } from 'vue'

interface MockUser {
  id: string
  email: string
  username: string
  role: 'user' | 'admin'
  plan: 'free' | 'basic' | 'pro' | 'enterprise'
  createdAt: string
}

const users = ref<MockUser[]>([])
const loading = ref(false)
const searchQuery = ref('')
const filterPlan = ref('all')
const filterRole = ref('all')

const planOptions = [
  { value: 'all', label: '全部计划' },
  { value: 'free', label: '免费版' },
  { value: 'basic', label: '基础版' },
  { value: 'pro', label: '专业版' },
  { value: 'enterprise', label: '企业版' },
]

const roleOptions = [
  { value: 'all', label: '全部角色' },
  { value: 'user', label: '普通用户' },
  { value: 'admin', label: '管理员' },
]

onMounted(() => {
  loadUsers()
})

function loadUsers() {
  loading.value = true
  
  // 从 localStorage 读取 Mock 用户数据
  const saved = localStorage.getItem('guji_mock_users')
  if (saved) {
    users.value = JSON.parse(saved)
  } else {
    // 默认数据
    users.value = [
      {
        id: 'admin-001',
        email: 'admin@test.com',
        username: 'Admin',
        role: 'admin',
        plan: 'pro',
        createdAt: new Date().toISOString(),
      }
    ]
  }
  
  loading.value = false
}

function saveUsers() {
  localStorage.setItem('guji_mock_users', JSON.stringify(users.value))
}

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!user.email.toLowerCase().includes(query) && 
          !user.username.toLowerCase().includes(query)) {
        return false
      }
    }
    if (filterPlan.value !== 'all' && user.plan !== filterPlan.value) {
      return false
    }
    if (filterRole.value !== 'all' && user.role !== filterRole.value) {
      return false
    }
    return true
  })
})

const stats = computed(() => ({
  total: users.value.length,
  paid: users.value.filter(u => u.plan !== 'free').length,
  admins: users.value.filter(u => u.role === 'admin').length,
}))

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function updateUserPlan(userId: string, newPlan: string) {
  const user = users.value.find(u => u.id === userId)
  if (user) {
    user.plan = newPlan as MockUser['plan']
    saveUsers()
  }
}

function updateUserRole(userId: string, newRole: string) {
  const user = users.value.find(u => u.id === userId)
  if (user) {
    user.role = newRole as MockUser['role']
    saveUsers()
  }
}

function deleteUser(userId: string) {
  if (confirm('确定要删除此用户吗？')) {
    users.value = users.value.filter(u => u.id !== userId)
    saveUsers()
  }
}
</script>

<template>
  <div class="users-manage">
    <header class="page-header">
      <div>
        <h1>用户管理</h1>
        <p>查看和管理注册用户（Mock 模式）</p>
      </div>
    </header>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">{{ stats.total }}</span>
        <span class="stat-label">总用户数</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.paid }}</span>
        <span class="stat-label">付费用户</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.admins }}</span>
        <span class="stat-label">管理员</span>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索邮箱或用户名..."
        class="search-input"
      />
      <select v-model="filterPlan" class="filter-select">
        <option v-for="opt in planOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <select v-model="filterRole" class="filter-select">
        <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- 用户列表 -->
    <div class="users-table">
      <table>
        <thead>
          <tr>
            <th>用户</th>
            <th>计划</th>
            <th>角色</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td class="user-cell">
              <div class="avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
              <div class="user-info">
                <span class="username">{{ user.username }}</span>
                <span class="email">{{ user.email }}</span>
              </div>
            </td>
            <td>
              <select
                :value="user.plan"
                class="inline-select"
                @change="updateUserPlan(user.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="free">免费版</option>
                <option value="basic">基础版</option>
                <option value="pro">专业版</option>
                <option value="enterprise">企业版</option>
              </select>
            </td>
            <td>
              <select
                :value="user.role"
                class="inline-select"
                @change="updateUserRole(user.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <button class="delete-btn" @click="deleteUser(user.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="filteredUsers.length === 0" class="empty">暂无用户数据</div>
    </div>
  </div>
</template>

<style scoped>
.users-manage { @apply max-w-5xl; }
.page-header { @apply mb-6; }
.page-header h1 { @apply text-2xl font-bold text-stone-800; }
.page-header p { @apply text-stone-500 mt-1; }

.stats-grid { @apply grid grid-cols-3 gap-4 mb-6; }
.stat-card { @apply bg-white rounded-xl p-4 text-center shadow-sm; }
.stat-value { @apply block text-2xl font-bold text-stone-800; }
.stat-label { @apply text-sm text-stone-500; }

.filter-bar { @apply flex gap-4 mb-4; }
.search-input { @apply flex-1 px-4 py-2 border border-stone-300 rounded-lg; }
.filter-select { @apply px-4 py-2 border border-stone-300 rounded-lg bg-white; }

.users-table { @apply bg-white rounded-xl shadow-sm overflow-hidden; }
table { @apply w-full; }
th { @apply px-4 py-3 text-left text-sm font-medium text-stone-600 bg-stone-50 border-b; }
td { @apply px-4 py-3 border-b border-stone-100; }

.user-cell { @apply flex items-center gap-3; }
.avatar { @apply w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-medium; }
.user-info { @apply flex flex-col; }
.username { @apply font-medium text-stone-800; }
.email { @apply text-sm text-stone-500; }

.inline-select { @apply px-2 py-1 text-sm border border-stone-200 rounded bg-white; }
.delete-btn { @apply text-sm text-red-600 hover:underline; }

.loading, .empty { @apply p-8 text-center text-stone-500; }
</style>
