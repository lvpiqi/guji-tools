<script setup lang="ts">
/**
 * 注册活动管理
 * 设置某时间段内注册的用户自动分配指定计划
 */
import { ref, computed, onMounted } from 'vue'

interface Promotion {
  id: string
  name: string
  description: string
  startTime: string
  endTime: string
  targetPlan: 'free' | 'basic' | 'pro' | 'enterprise'
  bonusDaily: number      // 额外每日次数
  bonusMonthly: number    // 额外每月次数
  duration: number        // 计划有效期（天），0为永久
  enabled: boolean
  createdAt: string
}

const promotions = ref<Promotion[]>([])
const showModal = ref(false)
const editingPromotion = ref<Promotion | null>(null)
const isNew = ref(false)

const STORAGE_KEY = 'guji_promotions'

const planOptions = [
  { value: 'free', label: '免费版' },
  { value: 'basic', label: '基础版' },
  { value: 'pro', label: '专业版' },
  { value: 'enterprise', label: '企业版' },
]

onMounted(() => {
  loadPromotions()
})

function loadPromotions() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    promotions.value = JSON.parse(saved)
  } else {
    // 默认示例活动
    promotions.value = [
      {
        id: 'promo-001',
        name: '新年特惠',
        description: '2026年1月注册用户免费升级基础版30天',
        startTime: '2026-01-01T00:00:00',
        endTime: '2026-01-31T23:59:59',
        targetPlan: 'basic',
        bonusDaily: 20,
        bonusMonthly: 500,
        duration: 30,
        enabled: false,
        createdAt: new Date().toISOString(),
      }
    ]
    savePromotions()
  }
}

function savePromotions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(promotions.value))
}

// 当前生效的活动
const activePromotion = computed(() => {
  const now = new Date()
  return promotions.value.find(p => {
    if (!p.enabled) return false
    const start = new Date(p.startTime)
    const end = new Date(p.endTime)
    return now >= start && now <= end
  })
})

function openCreate() {
  isNew.value = true
  editingPromotion.value = {
    id: `promo-${Date.now()}`,
    name: '',
    description: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    targetPlan: 'basic',
    bonusDaily: 0,
    bonusMonthly: 0,
    duration: 30,
    enabled: false,
    createdAt: new Date().toISOString(),
  }
  showModal.value = true
}

function openEdit(promo: Promotion) {
  isNew.value = false
  editingPromotion.value = { ...promo }
  showModal.value = true
}

function savePromotion() {
  if (!editingPromotion.value || !editingPromotion.value.name) {
    alert('请填写活动名称')
    return
  }
  
  if (isNew.value) {
    promotions.value.push(editingPromotion.value)
  } else {
    const index = promotions.value.findIndex(p => p.id === editingPromotion.value!.id)
    if (index !== -1) {
      promotions.value[index] = editingPromotion.value
    }
  }
  
  savePromotions()
  showModal.value = false
  editingPromotion.value = null
}

function toggleEnabled(promo: Promotion) {
  promo.enabled = !promo.enabled
  savePromotions()
}

function deletePromotion(id: string) {
  if (confirm('确定要删除此活动吗？')) {
    promotions.value = promotions.value.filter(p => p.id !== id)
    savePromotions()
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusText(promo: Promotion): { text: string; class: string } {
  if (!promo.enabled) return { text: '已禁用', class: 'disabled' }
  
  const now = new Date()
  const start = new Date(promo.startTime)
  const end = new Date(promo.endTime)
  
  if (now < start) return { text: '未开始', class: 'pending' }
  if (now > end) return { text: '已结束', class: 'ended' }
  return { text: '进行中', class: 'active' }
}

function getPlanName(plan: string): string {
  return planOptions.find(p => p.value === plan)?.label || plan
}
</script>

<template>
  <div class="promotion-manage">
    <header class="page-header">
      <div>
        <h1>注册活动管理</h1>
        <p>设置特定时间段内注册用户的默认计划和额外配额</p>
      </div>
      <button class="btn-primary" @click="openCreate">+ 创建活动</button>
    </header>

    <!-- 当前生效活动提示 -->
    <div v-if="activePromotion" class="active-banner">
      <span class="banner-icon">🎉</span>
      <div class="banner-content">
        <strong>当前生效活动：{{ activePromotion.name }}</strong>
        <p>新注册用户将自动获得 {{ getPlanName(activePromotion.targetPlan) }} 
          <template v-if="activePromotion.duration > 0">（{{ activePromotion.duration }}天）</template>
          <template v-else>（永久）</template>
        </p>
      </div>
    </div>

    <!-- 活动列表 -->
    <div class="promotions-list">
      <div 
        v-for="promo in promotions" 
        :key="promo.id" 
        class="promo-card"
        :class="getStatusText(promo).class"
      >
        <div class="promo-header">
          <h3>{{ promo.name }}</h3>
          <span class="status-badge" :class="getStatusText(promo).class">
            {{ getStatusText(promo).text }}
          </span>
        </div>
        
        <p class="promo-desc">{{ promo.description }}</p>
        
        <div class="promo-details">
          <div class="detail-item">
            <span class="label">时间范围</span>
            <span class="value">{{ formatDateTime(promo.startTime) }} ~ {{ formatDateTime(promo.endTime) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">目标计划</span>
            <span class="value plan-badge">{{ getPlanName(promo.targetPlan) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">有效期</span>
            <span class="value">{{ promo.duration > 0 ? `${promo.duration}天` : '永久' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">额外配额</span>
            <span class="value">每日+{{ promo.bonusDaily }} / 每月+{{ promo.bonusMonthly }}</span>
          </div>
        </div>
        
        <div class="promo-actions">
          <button class="edit-btn" @click="openEdit(promo)">编辑</button>
          <button 
            class="toggle-btn" 
            :class="{ enabled: promo.enabled }"
            @click="toggleEnabled(promo)"
          >
            {{ promo.enabled ? '禁用' : '启用' }}
          </button>
          <button class="delete-btn" @click="deletePromotion(promo.id)">删除</button>
        </div>
      </div>

      <div v-if="promotions.length === 0" class="empty">
        暂无活动，点击上方按钮创建
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showModal && editingPromotion" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <header class="modal-header">
          <h2>{{ isNew ? '创建活动' : '编辑活动' }}</h2>
          <button class="close-btn" @click="showModal = false">×</button>
        </header>

        <div class="modal-body">
          <div class="form-row">
            <label>活动名称 *</label>
            <input v-model="editingPromotion.name" type="text" placeholder="如：新年特惠" />
          </div>
          
          <div class="form-row">
            <label>活动描述</label>
            <textarea v-model="editingPromotion.description" rows="2" placeholder="活动说明..."></textarea>
          </div>
          
          <div class="form-grid">
            <div class="form-row">
              <label>开始时间</label>
              <input v-model="editingPromotion.startTime" type="datetime-local" />
            </div>
            <div class="form-row">
              <label>结束时间</label>
              <input v-model="editingPromotion.endTime" type="datetime-local" />
            </div>
          </div>
          
          <div class="form-grid">
            <div class="form-row">
              <label>目标计划</label>
              <select v-model="editingPromotion.targetPlan">
                <option v-for="opt in planOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="form-row">
              <label>有效期（天，0为永久）</label>
              <input v-model.number="editingPromotion.duration" type="number" min="0" />
            </div>
          </div>
          
          <div class="form-section">
            <h4>额外配额奖励</h4>
            <div class="form-grid">
              <div class="form-row">
                <label>额外每日次数</label>
                <input v-model.number="editingPromotion.bonusDaily" type="number" min="0" />
              </div>
              <div class="form-row">
                <label>额外每月次数</label>
                <input v-model.number="editingPromotion.bonusMonthly" type="number" min="0" />
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="editingPromotion.enabled" />
              立即启用此活动
            </label>
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="savePromotion">保存</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.promotion-manage { @apply max-w-4xl; }

.page-header { @apply flex items-start justify-between mb-6; }
.page-header h1 { @apply text-2xl font-bold text-stone-800; }
.page-header p { @apply text-stone-500 mt-1; }

.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600; }

.active-banner {
  @apply flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl mb-6;
}
.banner-icon { @apply text-2xl; }
.banner-content strong { @apply text-green-800; }
.banner-content p { @apply text-sm text-green-600 mt-1; }

.promotions-list { @apply space-y-4; }

.promo-card {
  @apply bg-white rounded-xl p-4 shadow-sm border-l-4 border-stone-300;
}
.promo-card.active { @apply border-green-500; }
.promo-card.pending { @apply border-blue-500; }
.promo-card.ended { @apply border-stone-300 opacity-60; }
.promo-card.disabled { @apply border-red-300 opacity-60; }

.promo-header { @apply flex items-center justify-between mb-2; }
.promo-header h3 { @apply font-bold text-stone-800; }

.status-badge {
  @apply px-2 py-0.5 text-xs rounded-full;
}
.status-badge.active { @apply bg-green-100 text-green-700; }
.status-badge.pending { @apply bg-blue-100 text-blue-700; }
.status-badge.ended { @apply bg-stone-100 text-stone-600; }
.status-badge.disabled { @apply bg-red-100 text-red-600; }

.promo-desc { @apply text-sm text-stone-600 mb-3; }

.promo-details { @apply grid grid-cols-2 gap-2 mb-4; }
.detail-item { @apply flex flex-col; }
.detail-item .label { @apply text-xs text-stone-400; }
.detail-item .value { @apply text-sm text-stone-700; }
.plan-badge { @apply inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs; }

.promo-actions { @apply flex gap-2; }
.edit-btn { @apply px-3 py-1 text-sm text-amber-600 border border-amber-300 rounded hover:bg-amber-50; }
.toggle-btn { @apply px-3 py-1 text-sm rounded; }
.toggle-btn.enabled { @apply bg-red-100 text-red-600 hover:bg-red-200; }
.toggle-btn:not(.enabled) { @apply bg-green-100 text-green-600 hover:bg-green-200; }
.delete-btn { @apply px-3 py-1 text-sm text-red-600 hover:underline; }

.empty { @apply text-center py-12 text-stone-400; }

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
.form-row input,
.form-row select,
.form-row textarea { @apply w-full px-3 py-2 border border-stone-300 rounded-lg; }

.form-grid { @apply grid grid-cols-2 gap-4; }

.form-section { @apply bg-stone-50 -mx-4 px-4 py-3 space-y-3; }
.form-section h4 { @apply text-sm font-medium text-stone-700; }

.checkbox-label { @apply flex items-center gap-2 cursor-pointer; }
.checkbox-label input { @apply w-4 h-4; }

.btn-secondary { @apply px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50; }
</style>
