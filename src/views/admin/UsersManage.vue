<script setup lang="ts">
/**
 * 用户管理页面
 * 支持：修改计划、修改角色、增减配额、删除用户
 */
import { ref, computed, onMounted } from 'vue'

interface MockUser {
  id: string
  email: string
  username: string
  role: 'user' | 'admin'
  plan: 'free' | 'basic' | 'pro' | 'enterprise'
  dailyUsed: number
  dailyLimit: number
  monthlyUsed: number
  monthlyLimit: number
  createdAt: string
}

const users = ref<MockUser[]>([])
const loading = ref(false)
const searchQuery = ref('')
const filterPlan = ref('all')
const filterRole = ref('all')

// 编辑配额弹窗
const showQuotaModal = ref(false)
const editingUser = ref<MockUser | null>(null)
const quotaForm = ref({
  dailyLimit: 0,
  monthlyLimit: 0,
  dailyUsed: 0,
  monthlyUsed: 0,
  addCredits: 0,
})

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

// 计划默认配额
const planQuotas: Record<string, { daily: number; monthly: number }> = {
  free: { daily: 10, monthly: 200 },
  basic: { daily: 50, monthly: 1000 },
  pro: { daily: 200, monthly: 5000 },
  enterprise: { daily: -1, monthly: -1 },
}

onMounted(() => {
  loadUsers()
})

function loadUsers() {
  loading.value = true
  
  const saved = localStorage.getItem('guji_mock_users')
  if (saved) {
    const rawUsers = JSON.parse(saved)
    // 补充配额字段
    users.value = rawUsers.map((u: any) => ({
      ...u,
      dailyUsed: u.dailyUsed || 0,
      dailyLimit: u.dailyLimit ?? planQuotas[u.plan]?.daily ?? 10,
      monthlyUsed: u.monthlyUsed || 0,
      monthlyLimit: u.monthlyLimit ?? planQuotas[u.plan]?.monthly ?? 200,
    }))
  } else {
    users.value = [
      {
        id: 'admin-001',
        email: 'admin@test.com',
        username: 'Admin',
        role: 'admin',
        plan: 'pro',
        dailyUsed: 0,
        dailyLimit: 200,
        monthlyUsed: 0,
        monthlyLimit: 5000,
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
    // 同步更新配额限制
    const quota = planQuotas[newPlan]
    if (quota) {
      user.dailyLimit = quota.daily
      user.monthlyLimit = quota.monthly
    }
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

function openQuotaModal(user: MockUser) {
  editingUser.value = user
  quotaForm.value = {
    dailyLimit: user.dailyLimit,
    monthlyLimit: user.monthlyLimit,
    dailyUsed: user.dailyUsed,
    monthlyUsed: user.monthlyUsed,
    addCredits: 0,
  }
  showQuotaModal.value = true
}

function saveQuota() {
  if (!editingUser.value) return
  
  const user = users.value.find(u => u.id === editingUser.value!.id)
  if (user) {
    user.dailyLimit = quotaForm.value.dailyLimit
    user.monthlyLimit = quotaForm.value.monthlyLimit
    user.dailyUsed = quotaForm.value.dailyUsed
    user.monthlyUsed = quotaForm.value.monthlyUsed
    
    // 增加额外次数（加到限制上）
    if (quotaForm.value.addCredits > 0) {
      if (user.dailyLimit !== -1) {
        user.dailyLimit += quotaForm.value.addCredits
      }
      if (user.monthlyLimit !== -1) {
        user.monthlyLimit += quotaForm.value.addCredits
      }
    }
    
    saveUsers()
  }
  
  showQuotaModal.value = false
  editingUser.value = null
}

function resetDailyUsage(userId: string) {
  const user = users.value.find(u => u.id === userId)
  if (user) {
    user.dailyUsed = 0
    saveUsers()
  }
}

function deleteUser(userId: string) {
  if (confirm('确定要删除此用户吗？')) {
    users.value = users.value.filter(u => u.id !== userId)
    saveUsers()
  }
}

function formatQuota(limit: number, used: number): string {
  if (limit === -1) return '无限'
  return `${used}/${limit}`
}
</script>

<template>
  <div class="users-manage">
    <header class="page-header">
      <div>
        <h1>用户管理</h1>
        <p>查看和管理注册用户，修改计划和配额</p>
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
            <th>今日配额</th>
            <th>月度配额</th>
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
            <td>
              <span class="quota-text" :class="{ warning: user.dailyUsed >= user.dailyLimit && user.dailyLimit !== -1 }">
                {{ formatQuota(user.dailyLimit, user.dailyUsed) }}
              </span>
            </td>
            <td>
              <span class="quota-text" :class="{ warning: user.monthlyUsed >= user.monthlyLimit && user.monthlyLimit !== -1 }">
                {{ formatQuota(user.monthlyLimit, user.monthlyUsed) }}
              </span>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td class="actions-cell">
              <button class="action-btn" @click="openQuotaModal(user)" title="编辑配额">📊</button>
              <button class="action-btn" @click="resetDailyUsage(user.id)" title="重置今日用量">🔄</button>
              <button class="action-btn danger" @click="deleteUser(user.id)" title="删除用户">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="filteredUsers.length === 0" class="empty">暂无用户数据</div>
    </div>

    <!-- 配额编辑弹窗 -->
    <div v-if="showQuotaModal && editingUser" class="modal-overlay" @click.self="showQuotaModal = false">
      <div class="modal">
        <header class="modal-header">
          <h2>编辑配额: {{ editingUser.username }}</h2>
          <button class="close-btn" @click="showQuotaModal = false">×</button>
        </header>

        <div class="modal-body">
          <div class="form-section">
            <h3>配额限制</h3>
            <div class="form-grid">
              <div class="form-row">
                <label>每日限制 (-1为无限)</label>
                <input v-model.number="quotaForm.dailyLimit" type="number" min="-1" />
              </div>
              <div class="form-row">
                <label>每月限制 (-1为无限)</label>
                <input v-model.number="quotaForm.monthlyLimit" type="number" min="-1" />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>已使用量</h3>
            <div class="form-grid">
              <div class="form-row">
                <label>今日已用</label>
                <input v-model.number="quotaForm.dailyUsed" type="number" min="0" />
              </div>
              <div class="form-row">
                <label>本月已用</label>
                <input v-model.number="quotaForm.monthlyUsed" type="number" min="0" />
              </div>
            </div>
          </div>

          <div class="form-section highlight">
            <h3>🎁 赠送额度</h3>
            <div class="form-row">
              <label>增加次数（会加到每日和每月限制上）</label>
              <input v-model.number="quotaForm.addCredits" type="number" min="0" placeholder="输入要赠送的次数" />
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn-secondary" @click="showQuotaModal = false">取消</button>
          <button class="btn-primary" @click="saveQuota">保存</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-manage { @apply max-w-6xl; }
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

.users-table { @apply bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto; }
table { @apply w-full min-w-[800px]; }
th { @apply px-4 py-3 text-left text-sm font-medium text-stone-600 bg-stone-50 border-b whitespace-nowrap; }
td { @apply px-4 py-3 border-b border-stone-100; }

.user-cell { @apply flex items-center gap-3; }
.avatar { @apply w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-medium flex-shrink-0; }
.user-info { @apply flex flex-col min-w-0; }
.username { @apply font-medium text-stone-800 truncate; }
.email { @apply text-sm text-stone-500 truncate; }

.inline-select { @apply px-2 py-1 text-sm border border-stone-200 rounded bg-white; }

.quota-text { @apply text-sm font-mono; }
.quota-text.warning { @apply text-red-600 font-medium; }

.actions-cell { @apply flex gap-1; }
.action-btn { @apply p-1.5 rounded hover:bg-stone-100 transition-colors; }
.action-btn.danger:hover { @apply bg-red-50; }

.loading, .empty { @apply p-8 text-center text-stone-500; }

/* Modal */
.modal-overlay { @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4; }
.modal { @apply bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden; }
.modal-header { @apply flex items-center justify-between px-4 py-3 border-b; }
.modal-header h2 { @apply font-bold text-stone-800; }
.close-btn { @apply text-2xl text-stone-400 hover:text-stone-600; }
.modal-body { @apply px-4 py-4 space-y-4 max-h-[60vh] overflow-y-auto; }
.modal-footer { @apply flex justify-end gap-2 px-4 py-3 border-t bg-stone-50; }

.form-section { @apply space-y-3; }
.form-section h3 { @apply text-sm font-medium text-stone-700; }
.form-section.highlight { @apply bg-amber-50 -mx-4 px-4 py-3 rounded-lg; }

.form-row { @apply space-y-1; }
.form-row label { @apply block text-sm text-stone-600; }
.form-row input { @apply w-full px-3 py-2 border border-stone-300 rounded-lg; }

.form-grid { @apply grid grid-cols-2 gap-4; }

.btn-secondary { @apply px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50; }
.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }
</style>
