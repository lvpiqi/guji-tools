<script setup lang="ts">
/**
 * 管理后台 - 内容管理
 */
import { ref, computed, onMounted } from 'vue'
import { getAllCachedCharacters, exportAllData, type CharacterData } from '@core/services/aiContent'

const allData = ref<Record<string, CharacterData>>({})
const searchQuery = ref('')
const selectedChar = ref<string | null>(null)
const editMode = ref(false)
const editData = ref<CharacterData | null>(null)

// 筛选条件
const filterSource = ref<'all' | 'ai' | 'local'>('all')
const filterHasEvolution = ref(false)
const filterHasRhyme = ref(false)

onMounted(() => {
  loadData()
})

function loadData() {
  allData.value = exportAllData()
}

const filteredChars = computed(() => {
  let chars = Object.entries(allData.value)
  
  // 搜索
  if (searchQuery.value) {
    chars = chars.filter(([char]) => char.includes(searchQuery.value))
  }
  
  // 来源筛选
  if (filterSource.value !== 'all') {
    chars = chars.filter(([, data]) => data.source === filterSource.value)
  }
  
  // 字形演变筛选
  if (filterHasEvolution.value) {
    chars = chars.filter(([, data]) => data.evolution)
  }
  
  // 韵部筛选
  if (filterHasRhyme.value) {
    chars = chars.filter(([, data]) => data.rhyme)
  }
  
  return chars.sort((a, b) => (b[1].generatedAt || 0) - (a[1].generatedAt || 0))
})

function selectChar(char: string) {
  selectedChar.value = char
  editMode.value = false
}

function startEdit() {
  if (selectedChar.value && allData.value[selectedChar.value]) {
    editData.value = JSON.parse(JSON.stringify(allData.value[selectedChar.value]))
    editMode.value = true
  }
}

function saveEdit() {
  if (!editData.value || !selectedChar.value) return
  
  editData.value.generatedAt = Date.now()
  const key = `guji_ai_${encodeURIComponent(selectedChar.value)}`
  localStorage.setItem(key, JSON.stringify(editData.value))
  
  loadData()
  editMode.value = false
}

function cancelEdit() {
  editMode.value = false
  editData.value = null
}

function deleteChar(char: string) {
  if (!confirm(`确定要删除「${char}」的数据吗？`)) return
  
  const key = `guji_ai_${encodeURIComponent(char)}`
  localStorage.removeItem(key)
  
  if (selectedChar.value === char) {
    selectedChar.value = null
  }
  loadData()
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString()
}
</script>

<template>
  <div class="content-manage">
    <header class="page-header">
      <h1>内容管理</h1>
      <p>查看和编辑已收录的汉字数据</p>
    </header>

    <div class="manage-layout">
      <!-- 左侧：列表 -->
      <div class="list-panel">
        <!-- 搜索和筛选 -->
        <div class="filters">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索汉字..."
            class="search-input"
          />
          <select v-model="filterSource" class="filter-select">
            <option value="all">全部来源</option>
            <option value="ai">AI生成</option>
            <option value="local">本地数据</option>
          </select>
        </div>
        
        <div class="filter-checks">
          <label>
            <input type="checkbox" v-model="filterHasEvolution" />
            有字形演变
          </label>
          <label>
            <input type="checkbox" v-model="filterHasRhyme" />
            有韵部信息
          </label>
        </div>

        <!-- 汉字列表 -->
        <div class="char-list">
          <div
            v-for="[char, data] in filteredChars"
            :key="char"
            class="char-item"
            :class="{ active: selectedChar === char }"
            @click="selectChar(char)"
          >
            <span class="char-text">{{ char }}</span>
            <span class="char-meta">
              <span v-if="data.source === 'ai'" class="badge ai">AI</span>
              <span v-else class="badge local">本地</span>
            </span>
          </div>
          <div v-if="filteredChars.length === 0" class="empty-list">
            暂无数据
          </div>
        </div>
        
        <div class="list-footer">
          共 {{ filteredChars.length }} 条
        </div>
      </div>

      <!-- 右侧：详情/编辑 -->
      <div class="detail-panel">
        <template v-if="selectedChar && allData[selectedChar]">
          <div class="detail-header">
            <h2>{{ selectedChar }}</h2>
            <div class="detail-actions">
              <button v-if="!editMode" class="btn-edit" @click="startEdit">编辑</button>
              <button class="btn-delete" @click="deleteChar(selectedChar)">删除</button>
            </div>
          </div>

          <!-- 查看模式 -->
          <div v-if="!editMode" class="detail-content">
            <div class="detail-section">
              <h3>基本信息</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">来源</span>
                  <span>{{ allData[selectedChar].source === 'ai' ? 'AI生成' : '本地数据' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">生成时间</span>
                  <span>{{ formatDate(allData[selectedChar].generatedAt) }}</span>
                </div>
              </div>
            </div>

            <div v-if="allData[selectedChar].definition" class="detail-section">
              <h3>释义</h3>
              <p><strong>基本义：</strong>{{ allData[selectedChar].definition?.basic }}</p>
              <p v-if="allData[selectedChar].definition?.classical"><strong>古义：</strong>{{ allData[selectedChar].definition?.classical }}</p>
              <p v-if="allData[selectedChar].definition?.english"><strong>English：</strong>{{ allData[selectedChar].definition?.english }}</p>
            </div>

            <div v-if="allData[selectedChar].variants?.length" class="detail-section">
              <h3>异体字</h3>
              <div class="variant-list">
                <span v-for="v in allData[selectedChar].variants" :key="v" class="variant-item">{{ v }}</span>
              </div>
            </div>

            <div v-if="allData[selectedChar].evolution" class="detail-section">
              <h3>字形演变</h3>
              <div class="evolution-list">
                <p v-if="allData[selectedChar].evolution?.oracle"><strong>甲骨文：</strong>{{ allData[selectedChar].evolution?.oracle }}</p>
                <p v-if="allData[selectedChar].evolution?.bronze"><strong>金文：</strong>{{ allData[selectedChar].evolution?.bronze }}</p>
                <p v-if="allData[selectedChar].evolution?.seal"><strong>篆书：</strong>{{ allData[selectedChar].evolution?.seal }}</p>
                <p v-if="allData[selectedChar].evolution?.clerical"><strong>隶书：</strong>{{ allData[selectedChar].evolution?.clerical }}</p>
                <p v-if="allData[selectedChar].evolution?.regular"><strong>楷书：</strong>{{ allData[selectedChar].evolution?.regular }}</p>
                <p v-if="allData[selectedChar].evolution?.description" class="evo-desc">{{ allData[selectedChar].evolution?.description }}</p>
              </div>
            </div>

            <div v-if="allData[selectedChar].rhyme" class="detail-section">
              <h3>韵部信息</h3>
              <div class="rhyme-info">
                <span class="rhyme-item">{{ allData[selectedChar].rhyme?.pingshui }}</span>
                <span class="rhyme-item">{{ allData[selectedChar].rhyme?.tone }}声</span>
                <span v-if="allData[selectedChar].rhyme?.fanqie" class="rhyme-item">{{ allData[selectedChar].rhyme?.fanqie }}</span>
              </div>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-else class="edit-content">
            <div class="edit-section">
              <h3>释义</h3>
              <div class="edit-field">
                <label>基本义</label>
                <input v-model="editData!.definition!.basic" type="text" />
              </div>
              <div class="edit-field">
                <label>古义</label>
                <input v-model="editData!.definition!.classical" type="text" />
              </div>
              <div class="edit-field">
                <label>English</label>
                <input v-model="editData!.definition!.english" type="text" />
              </div>
            </div>

            <div class="edit-section">
              <h3>异体字（逗号分隔）</h3>
              <input 
                :value="editData?.variants?.join(',')" 
                @input="editData!.variants = ($event.target as HTMLInputElement).value.split(',').filter(v => v.trim())"
                type="text" 
              />
            </div>

            <div class="edit-actions">
              <button class="btn-save" @click="saveEdit">保存</button>
              <button class="btn-cancel" @click="cancelEdit">取消</button>
            </div>
          </div>
        </template>
        
        <div v-else class="empty-detail">
          <p>选择左侧汉字查看详情</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-manage { @apply max-w-6xl; }
.page-header { @apply mb-6; }
.page-header h1 { @apply text-2xl font-bold text-stone-800; }
.page-header p { @apply text-stone-500 mt-1; }

.manage-layout { @apply flex gap-6; }

.list-panel { @apply w-72 bg-white rounded-xl shadow-sm flex flex-col; }
.filters { @apply p-3 border-b border-stone-100 flex gap-2; }
.search-input { @apply flex-1 px-3 py-2 border border-stone-200 rounded text-sm; }
.filter-select { @apply px-2 py-2 border border-stone-200 rounded text-sm; }
.filter-checks { @apply px-3 py-2 border-b border-stone-100 flex gap-4 text-xs text-stone-500; }
.filter-checks label { @apply flex items-center gap-1 cursor-pointer; }

.char-list { @apply flex-1 overflow-auto max-h-[500px]; }
.char-item { @apply flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-stone-50 border-b border-stone-50; }
.char-item.active { @apply bg-amber-50; }
.char-text { @apply text-xl; }
.char-meta { @apply flex gap-1; }
.badge { @apply text-xs px-1.5 py-0.5 rounded; }
.badge.ai { @apply bg-blue-100 text-blue-700; }
.badge.local { @apply bg-stone-100 text-stone-600; }
.empty-list { @apply p-4 text-center text-stone-400 text-sm; }
.list-footer { @apply p-3 border-t border-stone-100 text-xs text-stone-400 text-center; }

.detail-panel { @apply flex-1 bg-white rounded-xl shadow-sm p-6; }
.detail-header { @apply flex justify-between items-center mb-6 pb-4 border-b border-stone-100; }
.detail-header h2 { @apply text-4xl; }
.detail-actions { @apply flex gap-2; }
.btn-edit { @apply px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm; }
.btn-delete { @apply px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm; }

.detail-content { @apply space-y-6; }
.detail-section { @apply pb-4 border-b border-stone-100; }
.detail-section:last-child { @apply border-b-0; }
.detail-section h3 { @apply text-sm font-medium text-stone-500 mb-2; }
.detail-section p { @apply text-stone-700 text-sm mb-1; }

.info-grid { @apply grid grid-cols-2 gap-4; }
.info-item { @apply flex flex-col; }
.info-label { @apply text-xs text-stone-400; }

.variant-list { @apply flex gap-2; }
.variant-item { @apply w-10 h-10 flex items-center justify-center text-xl bg-stone-100 rounded; }

.evo-desc { @apply mt-2 p-2 bg-stone-50 rounded text-stone-600; }

.rhyme-info { @apply flex gap-2; }
.rhyme-item { @apply px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm; }

.empty-detail { @apply flex items-center justify-center h-64 text-stone-400; }

.edit-content { @apply space-y-4; }
.edit-section { @apply space-y-2; }
.edit-section h3 { @apply text-sm font-medium text-stone-500; }
.edit-field { @apply space-y-1; }
.edit-field label { @apply text-xs text-stone-400; }
.edit-field input, .edit-section > input { @apply w-full px-3 py-2 border border-stone-200 rounded; }
.edit-actions { @apply flex gap-3 pt-4; }
.btn-save { @apply px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600; }
.btn-cancel { @apply px-4 py-2 bg-stone-200 text-stone-700 rounded hover:bg-stone-300; }
</style>
