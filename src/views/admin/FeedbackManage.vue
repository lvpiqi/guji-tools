<script setup lang="ts">
/**
 * 后台 - 用户反馈管理
 */
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/core/services/supabase'

interface Feedback {
  id: string
  type: 'bug' | 'feature' | 'question' | 'other'
  content: string
  contact: string | null
  page_url: string
  user_id: string | null
  user_agent: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  admin_note: string | null
  created_at: string
}

const feedbacks = ref<Feedback[]>([])
const loading = ref(true)
const filter = ref<'all' | 'pending' | 'processing' | 'resolved'>('all')

const typeLabels: Record<string, string> = {
  bug: '🐛 问题',
  feature: '💡 建议',
  question: '❓ 疑问',
  other: '📝 其他'
}

const statusLabels: Record<string, { label: string; class: string }> = {
  pending: { label: '待处理', class: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '处理中', class: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', class: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', class: 'bg-stone-100 text-stone-600' }
}

const filteredFeedbacks = computed(() => {
  if (filter.value === 'all') return feedbacks.value
  return feedbacks.value.filter(f => f.status === filter.value)
})

const stats = computed(() => ({
  total: feedbacks.value.length,
  pending: feedbacks.value.filter(f => f.status === 'pending').length,
  processing: feedbacks.value.filter(f => f.status === 'processing').length,
  resolved: feedbacks.value.filter(f => f.status === 'resolved').length,
}))

async function loadFeedbacks() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    feedbacks.value = data || []
  } catch (e) {
    console.error('加载反馈失败:', e)
  } finally {
    loading.value = false
  }
}

async function updateStatus(id: string, status: string) {
  try {
    const { error } = await supabase
      .from('feedbacks')
      .update({ status })
      .eq('id', id)

    if (error) throw error
    
    const item = feedbacks.value.find(f => f.id === id)
    if (item) item.status = status as Feedback['status']
  } catch (e) {
    console.error('更新状态失败:', e)
    alert('更新失败')
  }
}

// 当前查看的反馈详情
const selectedFeedback = ref<Feedback | null>(null)
const adminNote = ref('')

function viewDetail(feedback: Feedback) {
  selectedFeedback.value = feedback
  adminNote.value = feedback.admin_note || ''
}

async function saveNote() {
  if (!selectedFeedback.value) return
  
  try {
    const { error } = await supabase
      .from('feedbacks')
      .update({ admin_note: adminNote.value })
      .eq('id', selectedFeedback.value.id)

    if (error) throw error
    
    selectedFeedback.value.admin_note = adminNote.value
    alert('备注已保存')
  } catch (e) {
    console.error('保存备注失败:', e)
    alert('保存失败')
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(loadFeedbacks)
</script>

<template>
  <div class="feedback-manage">
    <h1 class="page-title">用户反馈</h1>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">{{ stats.total }}</span>
        <span class="stat-label">总反馈</span>
      </div>
      <div class="stat-card warning">
        <span class="stat-value">{{ stats.pending }}</span>
        <span class="stat-label">待处理</span>
      </div>
      <div class="stat-card info">
        <span class="stat-value">{{ stats.processing }}</span>
        <span class="stat-label">处理中</span>
      </div>
      <div class="stat-card success">
        <span class="stat-value">{{ stats.resolved }}</span>
        <span class="stat-label">已解决</span>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <button 
        v-for="f in ['all', 'pending', 'processing', 'resolved']" 
        :key="f"
        class="filter-btn"
        :class="{ active: filter === f }"
        @click="filter = f as any"
      >
        {{ f === 'all' ? '全部' : statusLabels[f].label }}
      </button>
      <button class="refresh-btn" @click="loadFeedbacks" :disabled="loading">
        🔄 刷新
      </button>
    </div>

    <!-- 反馈列表 -->
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="filteredFeedbacks.length === 0" class="empty">
      暂无反馈
    </div>

    <div v-else class="feedback-list">
      <div 
        v-for="item in filteredFeedbacks" 
        :key="item.id" 
        class="feedback-item"
        @click="viewDetail(item)"
      >
        <div class="item-header">
          <span class="item-type">{{ typeLabels[item.type] }}</span>
          <span class="item-status" :class="statusLabels[item.status].class">
            {{ statusLabels[item.status].label }}
          </span>
        </div>
        <p class="item-content">{{ item.content }}</p>
        <div class="item-meta">
          <span>📍 {{ item.page_url }}</span>
          <span>🕐 {{ formatDate(item.created_at) }}</span>
          <span v-if="item.contact">📧 {{ item.contact }}</span>
        </div>
        <div class="item-actions" @click.stop>
          <select 
            :value="item.status" 
            @change="updateStatus(item.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <div v-if="selectedFeedback" class="detail-overlay" @click.self="selectedFeedback = null">
        <div class="detail-modal">
          <div class="detail-header">
            <h3>反馈详情</h3>
            <button @click="selectedFeedback = null">✕</button>
          </div>
          <div class="detail-body">
            <div class="detail-row">
              <label>类型</label>
              <span>{{ typeLabels[selectedFeedback.type] }}</span>
            </div>
            <div class="detail-row">
              <label>状态</label>
              <span :class="statusLabels[selectedFeedback.status].class" class="status-badge">
                {{ statusLabels[selectedFeedback.status].label }}
              </span>
            </div>
            <div class="detail-row">
              <label>内容</label>
              <p class="detail-content">{{ selectedFeedback.content }}</p>
            </div>
            <div class="detail-row">
              <label>页面</label>
              <span>{{ selectedFeedback.page_url }}</span>
            </div>
            <div class="detail-row">
              <label>联系方式</label>
              <span>{{ selectedFeedback.contact || '未填写' }}</span>
            </div>
            <div class="detail-row">
              <label>提交时间</label>
              <span>{{ formatDate(selectedFeedback.created_at) }}</span>
            </div>
            <div class="detail-row">
              <label>User Agent</label>
              <span class="text-xs text-stone-500 break-all">{{ selectedFeedback.user_agent }}</span>
            </div>
            <div class="detail-row">
              <label>管理员备注</label>
              <textarea v-model="adminNote" rows="3" placeholder="添加处理备注..."></textarea>
              <button class="save-note-btn" @click="saveNote">保存备注</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.feedback-manage {
  @apply p-6;
}
.page-title {
  @apply text-2xl font-bold text-stone-800 mb-6;
}

/* 统计卡片 */
.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4 mb-6;
}
.stat-card {
  @apply bg-white rounded-xl p-4 border border-stone-200 text-center;
}
.stat-card.warning { @apply border-yellow-300 bg-yellow-50; }
.stat-card.info { @apply border-blue-300 bg-blue-50; }
.stat-card.success { @apply border-green-300 bg-green-50; }
.stat-value {
  @apply block text-2xl font-bold text-stone-800;
}
.stat-label {
  @apply text-sm text-stone-500;
}

/* 筛选栏 */
.filter-bar {
  @apply flex flex-wrap gap-2 mb-4;
}
.filter-btn {
  @apply px-4 py-2 rounded-lg bg-stone-100 text-stone-600
         hover:bg-stone-200 transition-colors;
}
.filter-btn.active {
  @apply bg-amber-500 text-white;
}
.refresh-btn {
  @apply ml-auto px-4 py-2 rounded-lg bg-stone-100 text-stone-600
         hover:bg-stone-200 disabled:opacity-50;
}

/* 反馈列表 */
.loading, .empty {
  @apply text-center py-12 text-stone-500;
}
.feedback-list {
  @apply space-y-3;
}
.feedback-item {
  @apply bg-white rounded-xl p-4 border border-stone-200
         hover:border-amber-300 cursor-pointer transition-all;
}
.item-header {
  @apply flex items-center gap-2 mb-2;
}
.item-type {
  @apply text-sm font-medium;
}
.item-status {
  @apply px-2 py-0.5 rounded text-xs;
}
.item-content {
  @apply text-stone-700 mb-2 line-clamp-2;
}
.item-meta {
  @apply flex flex-wrap gap-4 text-xs text-stone-500 mb-2;
}
.item-actions select {
  @apply px-2 py-1 border border-stone-300 rounded text-sm;
}

/* 详情弹窗 */
.detail-overlay {
  @apply fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4;
}
.detail-modal {
  @apply bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto;
}
.detail-header {
  @apply flex items-center justify-between px-5 py-4 border-b border-stone-200;
}
.detail-header h3 {
  @apply text-lg font-bold;
}
.detail-header button {
  @apply w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center;
}
.detail-body {
  @apply px-5 py-4 space-y-4;
}
.detail-row {
  @apply space-y-1;
}
.detail-row label {
  @apply block text-sm font-medium text-stone-500;
}
.detail-content {
  @apply bg-stone-50 p-3 rounded-lg text-stone-700;
}
.status-badge {
  @apply inline-block px-2 py-1 rounded text-sm;
}
.detail-row textarea {
  @apply w-full px-3 py-2 border border-stone-300 rounded-lg text-sm;
}
.save-note-btn {
  @apply mt-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm
         hover:bg-amber-600;
}
</style>
