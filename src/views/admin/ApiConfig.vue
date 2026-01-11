<script setup lang="ts">
/**
 * 管理后台 - API 配置
 */
import { ref, onMounted } from 'vue'

const deepseekKey = ref('')
const showKey = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const testing = ref(false)

onMounted(() => {
  deepseekKey.value = localStorage.getItem('deepseek_api_key') || ''
})

function saveKey() {
  localStorage.setItem('deepseek_api_key', deepseekKey.value)
  testResult.value = { success: true, message: 'API Key 已保存' }
}

function clearKey() {
  if (!confirm('确定要清除 API Key 吗？')) return
  localStorage.removeItem('deepseek_api_key')
  deepseekKey.value = ''
  testResult.value = { success: true, message: 'API Key 已清除' }
}

async function testKey() {
  if (!deepseekKey.value) {
    testResult.value = { success: false, message: '请先输入 API Key' }
    return
  }
  
  testing.value = true
  testResult.value = null
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey.value}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: '你好' }],
        max_tokens: 10
      })
    })
    
    if (response.ok) {
      testResult.value = { success: true, message: '✓ API Key 有效，连接成功！' }
    } else {
      const data = await response.json()
      testResult.value = { success: false, message: `API 错误: ${data.error?.message || response.status}` }
    }
  } catch (e) {
    testResult.value = { success: false, message: `连接失败: ${e instanceof Error ? e.message : '未知错误'}` }
  } finally {
    testing.value = false
  }
}

const maskedKey = (key: string) => {
  if (!key) return ''
  if (key.length <= 8) return '****'
  return key.slice(0, 4) + '****' + key.slice(-4)
}
</script>

<template>
  <div class="api-config">
    <header class="page-header">
      <h1>API 配置</h1>
      <p>管理 AI 服务的 API Key</p>
    </header>

    <!-- DeepSeek API -->
    <div class="config-section">
      <div class="section-header">
        <h2>🤖 DeepSeek API</h2>
        <a href="https://platform.deepseek.com/" target="_blank" class="help-link">获取 API Key →</a>
      </div>
      
      <p class="section-desc">
        DeepSeek 用于动态生成汉字的释义、字形演变、韵部等信息。
        配置后，用户查询任意汉字都能获得 AI 生成的内容。
      </p>

      <div class="key-input-group">
        <div class="key-input-wrapper">
          <input
            v-model="deepseekKey"
            :type="showKey ? 'text' : 'password'"
            placeholder="sk-..."
            class="key-input"
          />
          <button class="toggle-btn" @click="showKey = !showKey">
            {{ showKey ? '隐藏' : '显示' }}
          </button>
        </div>
        
        <div class="key-actions">
          <button class="btn-primary" @click="saveKey" :disabled="!deepseekKey">
            保存
          </button>
          <button class="btn-secondary" @click="testKey" :disabled="!deepseekKey || testing">
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
          <button class="btn-danger" @click="clearKey" :disabled="!deepseekKey">
            清除
          </button>
        </div>
      </div>

      <!-- 测试结果 -->
      <div v-if="testResult" class="test-result" :class="{ success: testResult.success, error: !testResult.success }">
        {{ testResult.message }}
      </div>

      <!-- 当前状态 -->
      <div class="current-status">
        <span class="status-label">当前状态：</span>
        <span v-if="deepseekKey" class="status-value configured">
          已配置 ({{ maskedKey(deepseekKey) }})
        </span>
        <span v-else class="status-value not-configured">
          未配置
        </span>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="info-section">
      <h3>💡 使用说明</h3>
      <ul>
        <li>API Key 存储在浏览器本地，不会上传到服务器</li>
        <li>每次 AI 查询会消耗少量 token（约 500-1000 tokens/字）</li>
        <li>DeepSeek API 价格较低，适合大量查询</li>
        <li>生成的数据会缓存到本地，相同汉字不会重复调用</li>
      </ul>
    </div>

    <!-- 费用估算 -->
    <div class="cost-section">
      <h3>💰 费用估算</h3>
      <table class="cost-table">
        <thead>
          <tr>
            <th>查询量</th>
            <th>预估 Token</th>
            <th>预估费用</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>100 字</td>
            <td>~80,000</td>
            <td>~¥0.08</td>
          </tr>
          <tr>
            <td>1,000 字</td>
            <td>~800,000</td>
            <td>~¥0.8</td>
          </tr>
          <tr>
            <td>10,000 字</td>
            <td>~8,000,000</td>
            <td>~¥8</td>
          </tr>
        </tbody>
      </table>
      <p class="cost-note">* 基于 DeepSeek Chat 模型定价，实际费用可能有所不同</p>
    </div>
  </div>
</template>

<style scoped>
.api-config { @apply max-w-3xl; }
.page-header { @apply mb-6; }
.page-header h1 { @apply text-2xl font-bold text-stone-800; }
.page-header p { @apply text-stone-500 mt-1; }

.config-section { @apply bg-white rounded-xl p-6 shadow-sm mb-6; }
.section-header { @apply flex justify-between items-center mb-2; }
.section-header h2 { @apply text-lg font-medium text-stone-800; }
.help-link { @apply text-sm text-amber-600 hover:underline; }
.section-desc { @apply text-sm text-stone-500 mb-4; }

.key-input-group { @apply space-y-3; }
.key-input-wrapper { @apply flex gap-2; }
.key-input { @apply flex-1 px-4 py-3 border border-stone-200 rounded-lg font-mono text-sm; }
.toggle-btn { @apply px-3 py-2 text-sm text-stone-500 hover:text-stone-700; }

.key-actions { @apply flex gap-3; }
.btn-primary { @apply px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50; }
.btn-secondary { @apply px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 disabled:opacity-50; }
.btn-danger { @apply px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50; }

.test-result { @apply mt-4 p-3 rounded-lg text-sm; }
.test-result.success { @apply bg-green-50 text-green-700; }
.test-result.error { @apply bg-red-50 text-red-700; }

.current-status { @apply mt-4 pt-4 border-t border-stone-100 flex items-center gap-2; }
.status-label { @apply text-sm text-stone-500; }
.status-value { @apply text-sm font-medium; }
.status-value.configured { @apply text-green-600; }
.status-value.not-configured { @apply text-stone-400; }

.info-section { @apply bg-blue-50 rounded-xl p-6 mb-6; }
.info-section h3 { @apply font-medium text-blue-800 mb-3; }
.info-section ul { @apply space-y-2 text-sm text-blue-700; }
.info-section li { @apply flex items-start gap-2; }
.info-section li::before { @apply content-['•'] text-blue-400; }

.cost-section { @apply bg-white rounded-xl p-6 shadow-sm; }
.cost-section h3 { @apply font-medium text-stone-800 mb-4; }
.cost-table { @apply w-full text-sm; }
.cost-table th { @apply text-left py-2 px-3 bg-stone-50 text-stone-600 font-medium; }
.cost-table td { @apply py-2 px-3 border-b border-stone-100; }
.cost-note { @apply mt-3 text-xs text-stone-400; }
</style>
