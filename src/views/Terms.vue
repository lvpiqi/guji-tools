<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  document.title = '\u670D\u52A1\u6761\u6B3E | \u53E4\u7C4D\u5DE5\u5177'
})

const lastUpdated = '2026年1月1日'
</script>

<template>
  <div class="legal-page">
    <h1>服务条款</h1>
    <p class="update-date">最后更新：{{ lastUpdated }}</p>

    <section>
      <h2>1. 服务说明</h2>
      <p>古籍工具（www.gujitools.com，以下简称"本平台"）是一个提供古籍数字化相关在线工具的网站。本平台提供的服务包括但不限于：图像处理、OCR识别、文字转换、格式导出等功能。</p>
    </section>

    <section>
      <h2>2. 用户协议</h2>
      <p>使用本平台服务即表示您同意以下条款：</p>
      <ul>
        <li>您必须年满18周岁或在监护人同意下使用本服务</li>
        <li>您同意提供真实、准确的注册信息（如需注册）</li>
        <li>您对使用本平台处理的内容拥有合法权利</li>
        <li>您不得将本平台用于任何违法或侵权目的</li>
      </ul>
    </section>

    <section>
      <h2>3. 知识产权</h2>
      <p>本平台的所有内容（包括但不限于界面设计、代码、图标、文字）均受知识产权法保护。用户上传处理的内容，其知识产权归原权利人所有。</p>
      <p>用户使用本平台工具处理的结果，用户可自由使用，本平台不主张任何权利。</p>
    </section>

    <section>
      <h2>4. 免费与付费服务</h2>
      <p>本平台提供免费基础服务和付费增值服务：</p>
      <ul>
        <li><strong>免费服务：</strong>每日有一定的使用次数限制，功能完整可用</li>
        <li><strong>付费服务：</strong>提供更高的使用额度和优先处理等增值功能</li>
      </ul>
      <p>付费服务的具体内容和价格以定价页面为准。</p>
    </section>

    <section>
      <h2>5. 服务变更与终止</h2>
      <p>本平台保留以下权利：</p>
      <ul>
        <li>随时修改、暂停或终止部分或全部服务</li>
        <li>对服务内容进行更新和调整</li>
        <li>在违反本条款时终止用户的使用权限</li>
      </ul>
    </section>

    <section>
      <h2>6. 免责声明</h2>
      <p>本平台按"现状"提供服务，不对以下情况承担责任：</p>
      <ul>
        <li>因网络、设备等原因导致的服务中断</li>
        <li>工具处理结果的准确性和完整性</li>
        <li>用户因使用本服务产生的任何直接或间接损失</li>
        <li>第三方对用户数据的非法获取</li>
      </ul>
    </section>

    <section>
      <h2>7. 条款修改</h2>
      <p>本平台保留随时修改本条款的权利。修改后的条款将在网站上公布，继续使用本服务即表示您接受修改后的条款。</p>
    </section>

    <section>
      <h2>8. 联系方式</h2>
      <p>如对本条款有任何疑问，请通过以下方式联系我们：</p>
      <p>网站：www.gujitools.com</p>
    </section>
  </div>
</template>

<style scoped>
.legal-page {
  @apply max-w-3xl mx-auto px-4 py-8;
}
.legal-page h1 {
  @apply text-2xl font-bold text-stone-800 mb-2;
}
.update-date {
  @apply text-sm text-stone-500 mb-8;
}
.legal-page section {
  @apply mb-6;
}
.legal-page h2 {
  @apply text-lg font-semibold text-stone-700 mb-3;
}
.legal-page p {
  @apply text-stone-600 leading-relaxed mb-2;
}
.legal-page ul {
  @apply list-disc list-inside text-stone-600 space-y-1 ml-2;
}
.legal-page li {
  @apply leading-relaxed;
}
</style>
