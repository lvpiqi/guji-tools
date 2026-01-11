<script setup lang="ts">
/**
 * 工具权限管理
 * 配置每个工具的访问策略
 */
import { ref, computed, onMounted } from 'vue'
import { useToolPolicyStore } from '@/stores/toolPolicy'
import type { ToolAccessPolicy, PlanType } from '@core/types/user'

const toolPolicyStore = useToolPolicyStore()

const selectedCategory = ref<string>('all')
const searchQuery = ref('')
const editingTool = ref<ToolAccessPolicy | null>(null)
const showEditModal = ref(false)

// 分类名称映射
const categoryNames: Record<string, string> = {
  input: '输入场景',
  clean: '清理场景',
  read: '阅读场景',
  search: '搜索场景',
  export: '输出场景',
  pro: '专业场景',
}

const planOptions: { value: PlanType; label: string }[] = [
  { value: 'free', label: '免费版' },
  { value: 'basic', label: '基础版' },
  { value: 'pro', label: '专业版' },
  { value: 'enterprise', label: '企业版' },
]

onMounted(() => {
  toolPolicyStore.init()
})

const categories = computed(() => {
  return ['all', ...Object.keys(toolPolicyStore.toolsByCategory)]
})

const filteredTools = computed(() => {
  let tools = toolPolicyStore.allTools
  
  if (selectedCategory.value !== 'all') {
    tools = tools.filter(t => t.category === selectedCategory.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    tools = tools.filter(t => 
      t.toolName.toLowerCase().includes(query) ||
      t.toolId.toLowerCase().includes(query)
    )
  }
  
  return tools
})

function openEditModal(tool: ToolAccessPolicy) {
  editingTool.value = { ...tool }
  showEditModal.value = true
}

function saveToolPolicy() {
  if (editingTool.value) {
    toolPolicyStore.updatePolicy(editingTool.value.toolId, editingTool.value)
    showEditModal.value = false
    editingTool.value = null
  }
}

function toggleEnabled(tool: ToolAccessPolicy) {
  toolPolicyStore.updatePolicy(tool.toolId, { enabled: !tool.enabled })
}

function resetAll() {
  if (confirm('确定要重置所有工具策略为默认值吗？')) {
    toolPolicyStore.resetToDefault()
  }
}

function exportConfig() {
  const json = toolPolicyStore.exportConfig()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tool-policies.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="tools-manage">
    <header class="page-header">
      <div>
        <h1>工具权限管理</h1>
        <p>配置每个工具的访问策略和使用限制</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportConfig">导出配置</button>
        <button class="btn-secondary" @click="resetAll">重置默认</button>
      </div>
    </header>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat"
          class="tab"
          :class="{ active: selectedCategory === cat }"
          @click="selectedCategory = cat"
        >
          {{ cat === 'all' ? '全部' : categoryNames[cat] || cat }}
        </button>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索工具..."
        class="search-input"
      />
    </div>

    <!-- 工具列表 -->
    <div class="tools-table">
      <table>
        <thead>
          <tr>
            <th>工具名称</th>
            <th>分类</th>
            <th>游客可用</th>
            <th>免费次数</th>
            <th>最低计划</th>
            <th>积分消耗</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tool in filteredTools" :key="tool.toolId">
            <td class="tool-name">
              <span class="name">{{ tool.toolName }}</span>
              <span class="id">{{ tool.toolId }}</span>
            </td>
            <td>
              <span class="category-badge">{{ categoryNames[tool.category] || tool.category }}</span>
            </td>
            <td>
              <span :class="tool.guestAllowed ? 'yes' : 'no'">
                {{ tool.guestAllowed ? '是' : '否' }}
              </span>
            </td>
            <td>{{ tool.guestFreeCount }}</td>
            <td>
              <span class="plan-badge" :class="tool.minPlan">
                {{ planOptions.find(p => p.value === tool.minPlan)?.label }}
              </span>
            </td>
            <td>{{ tool.creditCost }}</td>
            <td>
              <button
                class="status-toggle"
                :class="{ enabled: tool.enabled }"
                @click="toggleEnabled(tool)"
              >
                {{ tool.enabled ? '启用' : '禁用' }}
              </button>
            </td>
            <td>
              <button class="edit-btn" @click="openEditModal(tool)">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditModal && editingTool" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <header class="modal-header">
          <h2>编辑工具策略</h2>
          <button class="close-btn" @click="showEditModal = false">×</button>
        </header>

        <div class="modal-body">
          <div class="form-row">
            <label>工具名称</label>
            <input type="text" :value="editingTool.toolName" disabled />
          </div>

          <div class="form-row">
            <label>
              <input type="checkbox" v-model="editingTool.enabled" />
              启用此工具
            </label>
          </div>

          <div class="form-row">
            <label>
              <input type="checkbox" v-model="editingTool.guestAllowed" />
              允许游客使用
            </label>
          </div>

          <div class="form-row">
            <label>游客免费次数</label>
            <input type="number" v-model.number="editingTool.guestFreeCount" min="0" max="100" />
          </div>

          <div class="form-row">
            <label>
              <input type="checkbox" v-model="editingTool.loginRequired" />
              强制要求登录
            </label>
          </div>

          <div class="form-row">
            <label>最低订阅计划</label>
            <select v-model="editingTool.minPlan">
              <option v-for="plan in planOptions" :key="plan.value" :value="plan.value">
                {{ plan.label }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <label>每次消耗积分</label>
            <input type="number" v-model.number="editingTool.creditCost" min="0" max="100" />
          </div>

          <div class="form-row">
            <label>每日限制（留空使用计划默认值）</label>
            <input type="number" v-model.number="editingTool.dailyLimit" min="0" placeholder="不限制" />
          </div>

          <div class="form-row">
            <label>频率限制（每分钟次数）</label>
            <input type="number" v-model.number="editingTool.rateLimit" min="0" placeholder="不限制" />
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn-secondary" @click="showEditModal = false">取消</button>
          <button class="btn-primary" @click="saveToolPolicy">保存</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tools-manage {
  @apply max-w-6xl;
}

.page-header {
  @apply flex items-start justify-between mb-6;
}

.page-header h1 {
  @apply text-2xl font-bold text-stone-800;
}

.page-header p {
  @apply text-stone-500 mt-1;
}

.header-actions {
  @apply flex gap-2;
}

.btn-secondary {
  @apply px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50;
}

.btn-primary {
  @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600;
}

.filter-bar {
  @apply flex items-center justify-between mb-4 gap-4;
}

.category-tabs {
  @apply flex gap-1 flex-wrap;
}

.tab {
  @apply px-3 py-1.5 text-sm rounded-lg text-stone-600 hover:bg-stone-100;
}

.tab.active {
  @apply bg-amber-500 text-white;
}

.search-input {
  @apply px-4 py-2 border border-stone-300 rounded-lg w-64;
}

.tools-table {
  @apply bg-white rounded-xl shadow-sm overflow-hidden;
}

table {
  @apply w-full;
}

th {
  @apply px-4 py-3 text-left text-sm font-medium text-stone-600 bg-stone-50 border-b;
}

td {
  @apply px-4 py-3 border-b border-stone-100;
}

.tool-name .name {
  @apply block font-medium text-stone-800;
}

.tool-name .id {
  @apply text-xs text-stone-400;
}

.category-badge {
  @apply px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded;
}

.yes { @apply text-green-600; }
.no { @apply text-stone-400; }

.plan-badge {
  @apply px-2 py-0.5 text-xs rounded;
}

.plan-badge.free { @apply bg-stone-100 text-stone-600; }
.plan-badge.basic { @apply bg-blue-100 text-blue-600; }
.plan-badge.pro { @apply bg-purple-100 text-purple-600; }
.plan-badge.enterprise { @apply bg-amber-100 text-amber-600; }

.status-toggle {
  @apply px-2 py-1 text-xs rounded;
}

.status-toggle.enabled {
  @apply bg-green-100 text-green-700;
}

.status-toggle:not(.enabled) {
  @apply bg-red-100 text-red-700;
}

.edit-btn {
  @apply text-sm text-amber-600 hover:underline;
}

/* Modal */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.modal {
  @apply bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden;
}

.modal-header {
  @apply flex items-center justify-between px-6 py-4 border-b;
}

.modal-header h2 {
  @apply font-bold text-stone-800;
}

.close-btn {
  @apply text-2xl text-stone-400 hover:text-stone-600;
}

.modal-body {
  @apply px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto;
}

.form-row {
  @apply space-y-1;
}

.form-row label {
  @apply block text-sm text-stone-700;
}

.form-row input[type="text"],
.form-row input[type="number"],
.form-row select {
  @apply w-full px-3 py-2 border border-stone-300 rounded-lg disabled:bg-stone-100;
}

.form-row input[type="checkbox"] {
  @apply mr-2;
}

.modal-footer {
  @apply flex justify-end gap-2 px-6 py-4 border-t bg-stone-50;
}
</style>
