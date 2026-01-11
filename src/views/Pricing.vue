<script setup lang="ts">
/**
 * 定价页面
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_PLANS } from '@core/types/user'
import type { PlanType } from '@core/types/user'

const router = useRouter()
const authStore = useAuthStore()

const currentPlan = computed(() => authStore.currentPlan)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const plans = computed(() => {
  return DEFAULT_PLANS.filter(p => p.id !== 'enterprise').map(plan => ({
    ...plan,
    priceDisplay: plan.price === 0 ? '免费' : `¥${(plan.price / 100).toFixed(0)}/月`,
    yearlyDisplay: plan.yearlyPrice ? `¥${(plan.yearlyPrice / 100).toFixed(0)}/年` : null,
    isCurrent: plan.id === currentPlan.value,
  }))
})

function handleSelect(planId: PlanType) {
  if (!isAuthenticated.value) {
    router.push(`/auth/login?redirect=/pricing`)
    return
  }
  
  if (planId === currentPlan.value) return
  
  if (planId === 'free') {
    // 降级确认
    if (confirm('确定要降级到免费版吗？')) {
      authStore.upgradePlan(planId)
    }
  } else {
    // TODO: 跳转到支付页面
    alert('支付功能开发中，敬请期待！')
  }
}

function contactSales() {
  alert('请发送邮件至 sales@guji-tools.com 咨询企业版')
}
</script>

<template>
  <div class="pricing-page">
    <div class="container">
      <header class="page-header">
        <h1>选择适合你的计划</h1>
        <p>灵活的定价方案，满足不同需求</p>
      </header>

      <!-- 计划卡片 -->
      <div class="plans-grid">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="plan-card"
          :class="{ recommended: plan.recommended, current: plan.isCurrent }"
        >
          <div v-if="plan.recommended" class="recommended-badge">推荐</div>
          <div v-if="plan.isCurrent" class="current-badge">当前计划</div>
          
          <h2>{{ plan.name }}</h2>
          <p class="description">{{ plan.description }}</p>
          
          <div class="price">
            <span class="amount">{{ plan.priceDisplay }}</span>
            <span v-if="plan.yearlyDisplay" class="yearly">{{ plan.yearlyDisplay }}（年付8折）</span>
          </div>

          <ul class="features">
            <li v-for="feature in plan.features" :key="feature">
              <span class="check">✓</span>
              {{ feature }}
            </li>
          </ul>

          <button
            class="select-btn"
            :class="{ current: plan.isCurrent }"
            :disabled="plan.isCurrent"
            @click="handleSelect(plan.id)"
          >
            {{ plan.isCurrent ? '当前计划' : plan.price === 0 ? '免费使用' : '立即订阅' }}
          </button>
        </div>

        <!-- 企业版 -->
        <div class="plan-card enterprise">
          <h2>企业版</h2>
          <p class="description">团队和机构定制方案</p>
          
          <div class="price">
            <span class="amount">联系销售</span>
          </div>

          <ul class="features">
            <li><span class="check">✓</span> 无限使用次数</li>
            <li><span class="check">✓</span> 私有化部署</li>
            <li><span class="check">✓</span> 定制开发</li>
            <li><span class="check">✓</span> 专属客服</li>
            <li><span class="check">✓</span> SLA 保障</li>
          </ul>

          <button class="select-btn enterprise" @click="contactSales">
            联系我们
          </button>
        </div>
      </div>

      <!-- FAQ -->
      <section class="faq-section">
        <h2>常见问题</h2>
        <div class="faq-list">
          <div class="faq-item">
            <h3>可以随时取消订阅吗？</h3>
            <p>是的，您可以随时取消订阅。取消后，当前计费周期结束前仍可使用付费功能。</p>
          </div>
          <div class="faq-item">
            <h3>支持哪些支付方式？</h3>
            <p>支持微信支付、支付宝、银行卡等主流支付方式。</p>
          </div>
          <div class="faq-item">
            <h3>配额用完了怎么办？</h3>
            <p>您可以升级计划获得更多配额，或等待下个周期自动重置。</p>
          </div>
          <div class="faq-item">
            <h3>有发票吗？</h3>
            <p>支持开具增值税普通发票和专用发票，请在支付后联系客服。</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pricing-page { @apply min-h-screen bg-stone-100 py-8 md:py-12; }
.container { @apply max-w-5xl mx-auto px-4; }

.page-header { @apply text-center mb-8 md:mb-12; }
.page-header h1 { @apply text-2xl md:text-3xl font-bold text-stone-800; }
.page-header p { @apply text-stone-500 mt-2; }

.plans-grid { @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6; }

.plan-card { @apply relative bg-white rounded-2xl p-4 md:p-6 shadow-sm; }
.plan-card.recommended { @apply ring-2 ring-amber-500; }
.plan-card.current { @apply bg-amber-50; }

.recommended-badge { @apply absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs rounded-full; }
.current-badge { @apply absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs rounded-full; }

.plan-card h2 { @apply text-lg md:text-xl font-bold text-stone-800 mt-2; }
.description { @apply text-sm text-stone-500 mt-1; }

.price { @apply my-4 md:my-6; }
.amount { @apply text-2xl md:text-3xl font-bold text-stone-800; }
.yearly { @apply block text-xs md:text-sm text-stone-400 mt-1; }

.features { @apply space-y-2 mb-4 md:mb-6; }
.features li { @apply flex items-start gap-2 text-xs md:text-sm text-stone-600; }
.check { @apply text-green-500; }

.select-btn { @apply w-full py-2.5 md:py-3 bg-amber-500 text-white text-sm md:text-base rounded-lg hover:bg-amber-600 transition-colors; }
.select-btn.current { @apply bg-stone-300 cursor-not-allowed; }
.select-btn.enterprise { @apply bg-stone-800 hover:bg-stone-900; }

.plan-card.enterprise { @apply bg-stone-800 text-white; }
.plan-card.enterprise h2, .plan-card.enterprise .amount { @apply text-white; }
.plan-card.enterprise .description, .plan-card.enterprise .features li { @apply text-stone-300; }

.faq-section { @apply mt-12 md:mt-16; }
.faq-section h2 { @apply text-xl md:text-2xl font-bold text-stone-800 text-center mb-6 md:mb-8; }
.faq-list { @apply grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6; }
.faq-item { @apply bg-white rounded-xl p-4 md:p-6; }
.faq-item h3 { @apply font-medium text-stone-800 mb-2 text-sm md:text-base; }
.faq-item p { @apply text-xs md:text-sm text-stone-600; }
</style>
