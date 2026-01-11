<script setup lang="ts">
/**
 * 计划管理页面
 */
import { ref, onMounted } from 'vue'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  yearlyPrice: number
  dailyQuota: number
  monthlyQuota: number
  features: string[]
  recommended: boolean
  enabled: boolean
}

const plans = ref<Plan[]>([])
const editingPlan = ref<Plan | null>(null)
const showModal = ref(false)

const STORAGE_KEY = 'guji_plans'

onMounted(() => {
  loadPlans()
})

function loadPlans() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    plans.value = JSON.parse(saved)
  } else {
    // 默认计划
    plans.value = [
      {
        id: 'free',
        name: '免费版',
        description: '基础功能体验',
        price: 0,
        yearlyPrice: 0,
        dailyQuota: 10,
        monthlyQuota: 200,
        features: ['每日10次工具使用', '基础工具访问', '社区支持'],
        recommended: false,
        enabled: true,
      },
      {
        id: 'basic',
        name: '基础版',
        description: '个人用户首选',
        price: 19,
        yearlyPrice: 190,
        dailyQuota: 50,
        monthlyQuota: 1000,
        features: ['每日50次工具使用', '全部工具访问', '优先处理', '邮件支持'],
        recommended: true,
        enabled: true,
      },
      {
        id: 'pro',
        name: '专业版',
        description: '专业研究者',
        price: 49,
        yearlyPrice: 490,
        dailyQuota: 200,
        monthlyQuota: 5000,
        features: ['每日200次工具使用', '全部工具访问', 'API访问', '批量处理', '专属支持'],
        recommended: false,
        enabled: true,
      },
      {
        id: 'enterprise',
        name: '企业版',
        description: '团队和机构',
        price: 0,
        yearlyPrice: 0,
        dailyQuota: -1,
        monthlyQuota: -1,
        features: ['无限使用', '私有部署', '定制开发', '专属客服', 'SLA保障'],
        recommended: false,
        enabled: true,
      },
    ]
    savePlans()
  }
}

function savePlans() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans.value))
}

function openEdit(plan: Plan) {
  editingPlan.value = { ...plan, features: [...plan.features] }
  showModal.value = true
}

function savePlan() {
  if (!editingPlan.value) return
  
  const index = plans.value.findIndex(p => p.id === editingPlan.value!.id)
  if (index !== -1) {
    plans.value[index] = editingPlan.value
  }
  savePlans()
  showModal.value = false
  editingPlan.value = null
}

function toggleEnabled(plan: Plan) {
  plan.enabled = !plan.enabled
  savePlans()
}

function addFeature() {
  if (editingPlan.value) {
    editingPlan.value.features.push('')
  }
}

function removeFeature(index: number) {
  if (editingPlan.value) {
    editingPlan.value.features.splice(index, 1)
  }
}
</script>

<template>
  <div class="plans-manage">
    <header class="page-header">
      <h1>计划管理</h1>
      <p>配置订阅计划和定价</p>
    </header>

    <!-- 计划列表 -->
    <div class="plans-grid">
      <div 
        v-for="plan in plans" 
        :key="plan.id" 
        class="plan-card"
        :class="{ disabled: !plan.enabled, recommended: plan.recommended }"
      >
        <div v-if="plan.recommended" class="recommended-badge">推荐</div>
        
        <h3>{{ plan.name }}</h3>
        <p class="desc">{{ plan.description }}</p>
        
        <div class="price">
          <span v-if="plan.price === 0" class="amount">免费</span>
          <span v-else class="amount">¥{{ plan.price }}<small>/月</small></span>
        </div>
        
        <div class="quota">
          <span>每日: {{ plan.dailyQuota === -1 ? '无限' : plan.dailyQuota }}</span>
          <span>每月: {{ plan.monthlyQuota === -1 ? '无限' : plan.monthlyQuota }}</span>
        </div>
        
        <ul class="features">
          <li v-for="(f, i) in plan.features" :key="i">{{ f }}</li>
        </ul>
        
        <div class="actions">
          <button class="edit-btn" @click="openEdit(plan)">编辑</button>
          <button 
            class="toggle-btn" 
            :class="{ enabled: plan.enabled }"
            @click="toggleEnabled(plan)"
          >
            {{ plan.enabled ? '启用中' : '已禁用' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showModal && editingPlan" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <header class="modal-header">
          <h2>编辑计划: {{ editingPlan.name }}</h2>
          <button class="close-btn" @click="showModal = false">×</button>
        </header>

        <div class="modal-body">
          <div class="form-row">
            <label>计划名称</label>
            <input v-model="editingPlan.name" type="text" />
          </div>
          
          <div class="form-row">
            <label>描述</label>
            <input v-model="editingPlan.description" type="text" />
          </div>
          
          <div class="form-grid">
            <div class="form-row">
              <label>月价格 (元)</label>
              <input v-model.number="editingPlan.price" type="number" min="0" />
            </div>
            <div class="form-row">
              <label>年价格 (元)</label>
              <input v-model.number="editingPlan.yearlyPrice" type="number" min="0" />
            </div>
          </div>
          
          <div class="form-grid">
            <div class="form-row">
              <label>每日配额 (-1为无限)</label>
              <input v-model.number="editingPlan.dailyQuota" type="number" min="-1" />
            </div>
            <div class="form-row">
              <label>每月配额 (-1为无限)</label>
              <input v-model.number="editingPlan.monthlyQuota" type="number" min="-1" />
            </div>
          </div>
          
          <div class="form-row">
            <label>
              <input type="checkbox" v-model="editingPlan.recommended" />
              设为推荐计划
            </label>
          </div>
          
          <div class="form-row">
            <label>功能特性</label>
            <div class="features-edit">
              <div v-for="(f, i) in editingPlan.features" :key="i" class="feature-item">
                <input v-model="editingPlan.features[i]" type="text" />
                <button class="remove-btn" @click="removeFeature(i)">×</button>
              </div>
              <button class="add-btn" @click="addFeature">+ 添加特性</button>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="savePlan">保存</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plans-manage { @apply max-w-5xl; }
.page-header { @apply mb-6; }
.page-header h1 { @apply text-2xl font-bold text-stone-800; }
.page-header p { @apply text-stone-500 mt-1; }

.plans-grid { @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4; }

.plan-card { 
  @apply relative bg-white rounded-xl p-4 shadow-sm border-2 border-transparent;
}
.plan-card.recommended { @apply border-amber-500; }
.plan-card.disabled { @apply opacity-50; }

.recommended-badge { 
  @apply absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full;
}

.plan-card h3 { @apply font-bold text-stone-800 mt-2; }
.desc { @apply text-sm text-stone-500; }

.price { @apply my-3; }
.amount { @apply text-2xl font-bold text-stone-800; }
.amount small { @apply text-sm font-normal text-stone-500; }

.quota { @apply flex gap-4 text-xs text-stone-500 mb-3; }

.features { @apply text-sm text-stone-600 space-y-1 mb-4; }
.features li::before { content: '✓ '; @apply text-green-500; }

.actions { @apply flex gap-2; }
.edit-btn { @apply flex-1 py-1.5 text-sm text-amber-600 border border-amber-300 rounded hover:bg-amber-50; }
.toggle-btn { @apply flex-1 py-1.5 text-sm rounded; }
.toggle-btn.enabled { @apply bg-green-100 text-green-700; }
.toggle-btn:not(.enabled) { @apply bg-red-100 text-red-700; }

/* Modal */
.modal-overlay { @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4; }
.modal { @apply bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden; }
.modal-header { @apply flex items-center justify-between px-4 py-3 border-b; }
.modal-header h2 { @apply font-bold text-stone-800; }
.close-btn { @apply text-2xl text-stone-400 hover:text-stone-600; }
.modal-body { @apply px-4 py-4 space-y-4 max-h-[60vh] overflow-y-auto; }
.modal-footer { @apply flex justify-end gap-2 px-4 py-3 border-t bg-stone-50; }

.form-row { @apply space-y-1; }
.form-row label { @apply block text-sm text-stone-700; }
.form-row input[type="text"],
.form-row input[type="number"] { @apply w-full px-3 py-2 border border-stone-300 rounded-lg; }
.form-row input[type="checkbox"] { @apply mr-2; }

.form-grid { @apply grid grid-cols-2 gap-4; }

.features-edit { @apply space-y-2; }
.feature-item { @apply flex gap-2; }
.feature-item input { @apply flex-1; }
.remove-btn { @apply px-2 text-red-500 hover:bg-red-50 rounded; }
.add-btn { @apply text-sm text-amber-600 hover:underline; }

.btn-secondary { @apply px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50; }
.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }
</style>
