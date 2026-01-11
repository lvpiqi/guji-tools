<script setup lang="ts">
const currentYear = new Date().getFullYear()

const links = {
  tools: [
    { name: '竖排OCR', path: '/input/ocr-vertical' },
    { name: '自动句读', path: '/input/punctuation' },
    { name: '繁简转换', path: '/input/convert' },
    { name: '字形演变', path: '/pro/glyph-evolution' },
  ],
  categories: [
    { name: '输入处理', path: '/input' },
    { name: '图像清理', path: '/clean' },
    { name: '阅读辅助', path: '/read' },
    { name: '导出工具', path: '/export' },
  ],
  about: [
    { name: '服务条款', path: '/terms' },
    { name: '隐私政策', path: '/privacy' },
    { name: '定价方案', path: '/pricing' },
  ]
}
</script>

<template>
  <footer class="app-footer">
    <div class="footer-content">
      <!-- 品牌区 -->
      <div class="footer-brand">
        <router-link to="/" class="brand-logo">古籍工具</router-link>
        <p class="brand-desc">专业的古籍数字化在线工具平台</p>
        <p class="brand-slogan">从纸质到电子，从模糊到清晰</p>
      </div>

      <!-- 链接区 -->
      <div class="footer-links">
        <div class="link-group">
          <h4>热门工具</h4>
          <ul>
            <li v-for="link in links.tools" :key="link.path">
              <router-link :to="link.path">{{ link.name }}</router-link>
            </li>
          </ul>
        </div>

        <div class="link-group">
          <h4>工具分类</h4>
          <ul>
            <li v-for="link in links.categories" :key="link.path">
              <router-link :to="link.path">{{ link.name }}</router-link>
            </li>
          </ul>
        </div>

        <div class="link-group">
          <h4>关于我们</h4>
          <ul>
            <li v-for="link in links.about" :key="link.path">
              <router-link :to="link.path">{{ link.name }}</router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="footer-bottom">
      <p>&copy; {{ currentYear }} 古籍工具 (www.gujitools.com) 保留所有权利</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  @apply bg-stone-100 border-t border-stone-200 mt-auto;
}

.footer-content {
  @apply max-w-6xl mx-auto px-4 py-8
         grid grid-cols-1 md:grid-cols-4 gap-8;
}

.footer-brand {
  @apply md:col-span-1;
}
.brand-logo {
  @apply text-xl font-bold text-stone-800 hover:text-amber-600 transition-colors;
}
.brand-desc {
  @apply text-sm text-stone-600 mt-2;
}
.brand-slogan {
  @apply text-xs text-stone-500 mt-1;
}

.footer-links {
  @apply md:col-span-3 grid grid-cols-3 gap-4;
}

.link-group h4 {
  @apply text-sm font-semibold text-stone-700 mb-3;
}
.link-group ul {
  @apply space-y-2;
}
.link-group a {
  @apply text-sm text-stone-500 hover:text-amber-600 transition-colors;
}

.footer-bottom {
  @apply border-t border-stone-200 py-4 text-center;
}
.footer-bottom p {
  @apply text-xs text-stone-500;
}
</style>
