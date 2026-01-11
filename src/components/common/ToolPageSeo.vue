<script setup lang="ts">
/**
 * SEO 优化的工具页面布局组件 v2.0
 * 
 * 功能：
 * - 完整的 Meta 标签（title, description, keywords, robots, author）
 * - Open Graph & Twitter Cards（支持 PNG 图片）
 * - 结构化数据 JSON-LD（SoftwareApplication, FAQPage, HowTo, BreadcrumbList）
 * - 语义化 HTML（article, header, section, nav）
 * - 面包屑导航
 * - 功能特点、使用步骤、详细介绍、FAQ
 * - 相关工具推荐（带内部链接）
 * - 响应式设计
 * 
 * 使用方式：
 * <ToolPageSeo :config="seoConfig">
 *   <!-- 工具主体内容 -->
 * </ToolPageSeo>
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import RelatedTools from './RelatedTools.vue'

// ==================== 类型定义 ====================

export interface FaqItem {
  question: string
  answer: string
}

export interface ToolSeoConfig {
  // 基础信息
  name: string           // 工具名称
  path: string           // 路由路径，如 /input/remove-finger
  category: string       // 分类名称：输入处理、图像清理、阅读辅助、搜索工具、导出工具、专业工具
  categoryPath: string   // 分类路径，如 /input
  
  // SEO Meta
  title: string          // 页面标题（可选，默认用 name）
  description: string    // Meta description (150-160字符最佳)
  keywords: string[]     // 关键词数组
  ogImage?: string       // Open Graph 图片路径（建议 PNG 1200x630，相对于 public 目录）
  
  // 可选 Meta
  author?: string        // 作者，默认 "古籍工具"
  publishedTime?: string // 发布时间 ISO 格式
  modifiedTime?: string  // 修改时间 ISO 格式
  
  // 内容
  shortDesc: string      // 简短描述（显示在标题下，1-2句话）
  features: string[]     // 功能特点列表（4-8条）
  introduction: string   // 详细介绍（支持多段，用\n\n分隔）
  howToUse: string[]     // 使用步骤（3-6步）
  faq: FaqItem[]         // 常见问题（5-10条）
  
  // 技术信息
  supportedFormats?: string[]  // 支持的格式，如 ['JPG', 'PNG', 'WebP']
  maxFileSize?: number         // 最大文件大小(MB)
  isOffline?: boolean          // 是否离线处理（本地运行）
  isFree?: boolean             // 是否免费（默认 true）
}

// ==================== Props ====================

const props = defineProps<{
  config: ToolSeoConfig
}>()

const route = useRoute()

// ==================== 常量 ====================

const BASE_URL = 'https://www.gujitools.com'
const SITE_NAME = '\u53E4\u7C4D\u5DE5\u5177' // 古籍工具
const DEFAULT_AUTHOR = '\u53E4\u7C4D\u5DE5\u5177'

// ==================== 计算属性 ====================

// 完整 URL
const fullUrl = computed(() => `${BASE_URL}${props.config.path}`)

// OG 图片 URL（优先 PNG，回退到默认）
const ogImageUrl = computed(() => {
  if (props.config.ogImage) {
    return `${BASE_URL}${props.config.ogImage}`
  }
  return `${BASE_URL}/og-images/default.png`
})

// 页面标题
const pageTitle = computed(() => `${props.config.name} | ${SITE_NAME}`)

// 介绍段落（解析内部链接）
const introductionParagraphs = computed(() => {
  return props.config.introduction.split('\n\n').filter(p => p.trim())
})

// 生成结构化数据 JSON-LD
const structuredData = computed(() => {
  const now = new Date().toISOString()
  
  return {
    '@context': 'https://schema.org',
    '@graph': [
      // WebPage
      {
        '@type': 'WebPage',
        '@id': `${fullUrl.value}#webpage`,
        'url': fullUrl.value,
        'name': pageTitle.value,
        'description': props.config.description,
        'isPartOf': { '@id': `${BASE_URL}#website` },
        'datePublished': props.config.publishedTime || now,
        'dateModified': props.config.modifiedTime || now,
        'breadcrumb': { '@id': `${fullUrl.value}#breadcrumb` }
      },
      // WebSite
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}#website`,
        'url': BASE_URL,
        'name': SITE_NAME,
        'description': '\u514D\u8D39\u5728\u7EBF\u53E4\u7C4D\u6570\u5B57\u5316\u5DE5\u5177\u5E73\u53F0',
        'publisher': { '@id': `${BASE_URL}#organization` }
      },
      // Organization
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}#organization`,
        'name': SITE_NAME,
        'url': BASE_URL,
        'logo': {
          '@type': 'ImageObject',
          'url': `${BASE_URL}/logo.png`
        }
      },
      // SoftwareApplication
      {
        '@type': 'SoftwareApplication',
        '@id': `${fullUrl.value}#software`,
        'name': props.config.name,
        'description': props.config.description,
        'url': fullUrl.value,
        'applicationCategory': 'UtilitiesApplication',
        'operatingSystem': 'Web Browser',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'CNY'
        },
        'featureList': props.config.features,
        'screenshot': ogImageUrl.value
      },
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        '@id': `${fullUrl.value}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': '\u9996\u9875',
            'item': BASE_URL
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': props.config.category,
            'item': `${BASE_URL}${props.config.categoryPath}`
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': props.config.name,
            'item': fullUrl.value
          }
        ]
      },
      // FAQPage
      props.config.faq.length > 0 ? {
        '@type': 'FAQPage',
        '@id': `${fullUrl.value}#faq`,
        'mainEntity': props.config.faq.map(item => ({
          '@type': 'Question',
          'name': item.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.answer
          }
        }))
      } : null,
      // HowTo
      props.config.howToUse.length > 0 ? {
        '@type': 'HowTo',
        '@id': `${fullUrl.value}#howto`,
        'name': `\u5982\u4F55\u4F7F\u7528${props.config.name}`,
        'description': props.config.shortDesc,
        'step': props.config.howToUse.map((step, i) => ({
          '@type': 'HowToStep',
          'position': i + 1,
          'name': `\u6B65\u9AA4 ${i + 1}`,
          'text': step
        })),
        'tool': {
          '@type': 'HowToTool',
          'name': '\u6D4F\u89C8\u5668'
        }
      } : null
    ].filter(Boolean)
  }
})

// ==================== Meta 标签管理 ====================

// 存储创建的元素，用于清理
const createdElements: Element[] = []

function setMeta(nameOrProperty: string, content: string) {
  const isProperty = nameOrProperty.startsWith('og:') || 
                     nameOrProperty.startsWith('twitter:') ||
                     nameOrProperty.startsWith('article:')
  
  const selector = isProperty 
    ? `meta[property="${nameOrProperty}"]`
    : `meta[name="${nameOrProperty}"]`
  
  let meta = document.querySelector(selector)
  
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(isProperty ? 'property' : 'name', nameOrProperty)
    document.head.appendChild(meta)
    createdElements.push(meta)
  }
  
  meta.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement
  
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    document.head.appendChild(link)
    createdElements.push(link)
  }
  
  link.href = href
}

function updateMeta() {
  const now = new Date().toISOString()
  
  // Title
  document.title = pageTitle.value
  
  // Canonical
  setLink('canonical', fullUrl.value)
  
  // Basic Meta
  setMeta('description', props.config.description)
  setMeta('keywords', props.config.keywords.join(','))
  setMeta('author', props.config.author || DEFAULT_AUTHOR)
  setMeta('robots', 'index, follow, max-image-preview:large')
  
  // Open Graph
  setMeta('og:title', pageTitle.value)
  setMeta('og:description', props.config.description)
  setMeta('og:type', 'website')
  setMeta('og:url', fullUrl.value)
  setMeta('og:image', ogImageUrl.value)
  setMeta('og:image:width', '1200')
  setMeta('og:image:height', '630')
  setMeta('og:image:type', 'image/png')
  setMeta('og:site_name', SITE_NAME)
  setMeta('og:locale', 'zh_CN')
  
  // Article (for time tracking)
  setMeta('article:published_time', props.config.publishedTime || now)
  setMeta('article:modified_time', props.config.modifiedTime || now)
  setMeta('article:author', props.config.author || DEFAULT_AUTHOR)
  
  // Twitter Cards
  setMeta('twitter:card', 'summary_large_image')
  setMeta('twitter:title', pageTitle.value)
  setMeta('twitter:description', props.config.description)
  setMeta('twitter:image', ogImageUrl.value)
  setMeta('twitter:image:alt', `${props.config.name} - ${SITE_NAME}`)
  
  // Structured Data
  let scriptTag = document.querySelector('script[data-type="tool-structured-data"]')
  if (!scriptTag) {
    scriptTag = document.createElement('script')
    scriptTag.setAttribute('type', 'application/ld+json')
    scriptTag.setAttribute('data-type', 'tool-structured-data')
    document.head.appendChild(scriptTag)
    createdElements.push(scriptTag)
  }
  scriptTag.textContent = JSON.stringify(structuredData.value)
}

// 清理创建的元素
function cleanupMeta() {
  createdElements.forEach(el => el.remove())
  createdElements.length = 0
}

// ==================== FAQ 交互 ====================

const expandedFaq = ref<number[]>([0])

function toggleFaq(index: number) {
  const idx = expandedFaq.value.indexOf(index)
  if (idx > -1) {
    expandedFaq.value.splice(idx, 1)
  } else {
    expandedFaq.value.push(index)
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  updateMeta()
})

onUnmounted(() => {
  cleanupMeta()
})

watch(() => props.config, () => {
  updateMeta()
}, { deep: true })
</script>

<template>
  <article 
    class="tool-page-seo" 
    itemscope 
    itemtype="https://schema.org/SoftwareApplication"
    :aria-label="config.name"
  >
    <!-- 隐藏的 SEO 信息 -->
    <meta itemprop="applicationCategory" content="UtilitiesApplication" />
    <meta itemprop="operatingSystem" content="Web Browser" />
    <link itemprop="url" :href="`https://www.gujitools.com${config.path}`" />
    
    <!-- 面包屑导航 -->
    <nav class="breadcrumb" aria-label="面包屑导航">
      <ol class="breadcrumb-list" itemscope itemtype="https://schema.org/BreadcrumbList">
        <li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <router-link to="/" itemprop="item">
            <span itemprop="name">首页</span>
          </router-link>
          <meta itemprop="position" content="1" />
        </li>
        <li class="breadcrumb-separator" aria-hidden="true">/</li>
        <li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <router-link :to="config.categoryPath" itemprop="item">
            <span itemprop="name">{{ config.category }}</span>
          </router-link>
          <meta itemprop="position" content="2" />
        </li>
        <li class="breadcrumb-separator" aria-hidden="true">/</li>
        <li class="breadcrumb-item current" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <span itemprop="name" aria-current="page">{{ config.name }}</span>
          <meta itemprop="position" content="3" />
        </li>
      </ol>
    </nav>

    <!-- 页面标题区 -->
    <header class="tool-header">
      <h1 class="tool-title" itemprop="name">{{ config.name }}</h1>
      <p class="tool-short-desc" itemprop="description">{{ config.shortDesc }}</p>
      
      <!-- 特性标签 -->
      <div class="tool-badges" role="list" aria-label="工具特性">
        <span v-if="config.isFree !== false" class="badge badge-free" role="listitem">
          <span aria-hidden="true">🆓</span> 免费使用
        </span>
        <span v-if="config.isOffline" class="badge badge-offline" role="listitem">
          <span aria-hidden="true">🔒</span> 本地处理
        </span>
        <span v-if="config.maxFileSize" class="badge badge-size" role="listitem">
          <span aria-hidden="true">📦</span> 最大 {{ config.maxFileSize }}MB
        </span>
        <span v-if="config.supportedFormats?.length" class="badge badge-format" role="listitem">
          <span aria-hidden="true">📄</span> {{ config.supportedFormats.join(' / ') }}
        </span>
      </div>
    </header>

    <!-- 工具主体区域（slot） -->
    <section class="tool-main" aria-label="工具操作区">
      <slot></slot>
    </section>

    <!-- 功能特点 -->
    <section class="tool-features" v-if="config.features.length" aria-labelledby="features-title">
      <h2 id="features-title" class="section-title">
        <span aria-hidden="true">✨</span> 功能特点
      </h2>
      <ul class="features-list" itemprop="featureList">
        <li v-for="(feature, i) in config.features" :key="i" class="feature-item">
          <span class="feature-icon" aria-hidden="true">✓</span>
          <span>{{ feature }}</span>
        </li>
      </ul>
    </section>

    <!-- 使用步骤 -->
    <section class="tool-howto" v-if="config.howToUse.length" aria-labelledby="howto-title">
      <h2 id="howto-title" class="section-title">
        <span aria-hidden="true">📖</span> 使用方法
      </h2>
      <ol class="howto-list">
        <li v-for="(step, i) in config.howToUse" :key="i" class="howto-step">
          <span class="step-number" aria-hidden="true">{{ i + 1 }}</span>
          <span class="step-text">{{ step }}</span>
        </li>
      </ol>
    </section>

    <!-- 详细介绍 -->
    <section class="tool-introduction" v-if="config.introduction" aria-labelledby="intro-title">
      <h2 id="intro-title" class="section-title">
        <span aria-hidden="true">📝</span> 详细介绍
      </h2>
      <div class="introduction-content">
        <p v-for="(para, i) in introductionParagraphs" :key="i">{{ para }}</p>
      </div>
    </section>

    <!-- FAQ 常见问题 -->
    <section class="tool-faq" v-if="config.faq.length" aria-labelledby="faq-title">
      <h2 id="faq-title" class="section-title">
        <span aria-hidden="true">❓</span> 常见问题
      </h2>
      <div class="faq-list" role="list">
        <div 
          v-for="(item, i) in config.faq" 
          :key="i" 
          class="faq-item"
          :class="{ expanded: expandedFaq.includes(i) }"
          role="listitem"
        >
          <button 
            class="faq-question"
            @click="toggleFaq(i)"
            :aria-expanded="expandedFaq.includes(i)"
            :aria-controls="`faq-answer-${i}`"
          >
            <span class="faq-q" aria-hidden="true">Q</span>
            <span class="faq-text">{{ item.question }}</span>
            <span class="faq-toggle" aria-hidden="true">{{ expandedFaq.includes(i) ? '−' : '+' }}</span>
          </button>
          <div 
            :id="`faq-answer-${i}`"
            class="faq-answer"
            v-show="expandedFaq.includes(i)"
            role="region"
            :aria-labelledby="`faq-question-${i}`"
          >
            <span class="faq-a" aria-hidden="true">A</span>
            <p>{{ item.answer }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 相关工具推荐 -->
    <RelatedTools />
  </article>
</template>

<style scoped>
.tool-page-seo {
  @apply max-w-6xl mx-auto;
}

/* 面包屑 */
.breadcrumb {
  @apply mb-4;
}
.breadcrumb-list {
  @apply flex items-center text-sm text-stone-500 flex-wrap;
}
.breadcrumb-item a {
  @apply hover:text-amber-600 transition-colors;
}
.breadcrumb-item.current {
  @apply text-stone-700 font-medium;
}
.breadcrumb-separator {
  @apply mx-2 text-stone-300;
}

/* 标题区 */
.tool-header {
  @apply mb-6;
}
.tool-title {
  @apply text-2xl md:text-3xl font-bold text-stone-800 mb-2;
}
.tool-short-desc {
  @apply text-stone-600 text-lg mb-3;
}
.tool-badges {
  @apply flex flex-wrap gap-2;
}
.badge {
  @apply px-2 py-1 text-xs rounded-full;
}
.badge-free {
  @apply bg-green-100 text-green-700;
}
.badge-offline {
  @apply bg-blue-100 text-blue-700;
}
.badge-size {
  @apply bg-stone-100 text-stone-600;
}
.badge-format {
  @apply bg-amber-100 text-amber-700;
}

/* 工具主体 */
.tool-main {
  @apply mb-6;
}

/* 通用 section 标题 */
.section-title {
  @apply text-xl font-bold text-stone-800 mb-4 pb-2 border-b border-stone-200;
}

/* 功能特点 */
.tool-features {
  @apply bg-white rounded-xl border border-stone-200 p-6 mb-6;
}
.features-list {
  @apply grid grid-cols-1 md:grid-cols-2 gap-3;
}
.feature-item {
  @apply flex items-start gap-2;
}
.feature-icon {
  @apply text-green-500 font-bold mt-0.5;
}

/* 使用步骤 */
.tool-howto {
  @apply bg-amber-50 rounded-xl p-6 mb-6;
}
.howto-list {
  @apply space-y-3;
}
.howto-step {
  @apply flex items-start gap-3;
}
.step-number {
  @apply w-7 h-7 rounded-full bg-amber-500 text-white text-sm font-bold
         flex items-center justify-center flex-shrink-0;
}
.step-text {
  @apply text-stone-700 pt-0.5;
}

/* 详细介绍 */
.tool-introduction {
  @apply bg-white rounded-xl border border-stone-200 p-6 mb-6;
}
.introduction-content {
  @apply space-y-4 text-stone-600 leading-relaxed;
}
.introduction-content p {
  @apply text-justify;
}

/* FAQ */
.tool-faq {
  @apply bg-white rounded-xl border border-stone-200 p-6 mb-6;
}
.faq-list {
  @apply space-y-3;
}
.faq-item {
  @apply border border-stone-200 rounded-lg overflow-hidden;
}
.faq-item.expanded {
  @apply border-amber-300;
}
.faq-question {
  @apply w-full flex items-center gap-3 px-4 py-3 text-left bg-stone-50
         hover:bg-stone-100 transition-colors;
}
.faq-item.expanded .faq-question {
  @apply bg-amber-50;
}
.faq-q {
  @apply w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold
         flex items-center justify-center flex-shrink-0;
}
.faq-text {
  @apply flex-1 font-medium text-stone-800;
}
.faq-toggle {
  @apply w-6 h-6 rounded-full bg-stone-200 text-stone-600 text-lg
         flex items-center justify-center;
}
.faq-answer {
  @apply flex gap-3 px-4 py-3 bg-white border-t border-stone-100;
}
.faq-a {
  @apply w-6 h-6 rounded-full bg-stone-200 text-stone-600 text-xs font-bold
         flex items-center justify-center flex-shrink-0;
}
.faq-answer p {
  @apply text-stone-600 leading-relaxed;
}
</style>
