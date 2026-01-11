<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  document.title = '\u9690\u79C1\u653F\u7B56 | \u53E4\u7C4D\u5DE5\u5177'
})

const lastUpdated = '2026年1月1日'
</script>

<template>
  <div class="legal-page">
    <h1>隐私政策</h1>
    <p class="update-date">最后更新：{{ lastUpdated }}</p>

    <section>
      <h2>1. 概述</h2>
      <p>古籍工具（www.gujitools.com，以下简称"本平台"）非常重视用户隐私保护。本隐私政策说明我们如何收集、使用、存储和保护您的个人信息。</p>
    </section>

    <section>
      <h2>2. 信息收集</h2>
      <h3>2.1 您主动提供的信息</h3>
      <ul>
        <li>注册账户时提供的邮箱地址</li>
        <li>使用付费服务时的支付信息</li>
        <li>联系我们时提供的信息</li>
      </ul>
      
      <h3>2.2 自动收集的信息</h3>
      <ul>
        <li>设备信息（浏览器类型、操作系统）</li>
        <li>访问日志（IP地址、访问时间、页面浏览记录）</li>
        <li>Cookies和类似技术收集的信息</li>
      </ul>

      <h3>2.3 我们不收集的信息</h3>
      <p class="highlight">重要：本平台大部分工具在您的浏览器本地运行，您上传处理的图片和文档不会上传到我们的服务器。我们不收集、不存储您处理的古籍图片或文本内容。</p>
    </section>

    <section>
      <h2>3. 信息使用</h2>
      <p>我们收集的信息用于以下目的：</p>
      <ul>
        <li>提供、维护和改进我们的服务</li>
        <li>处理您的账户注册和管理</li>
        <li>处理付费订阅和交易</li>
        <li>发送服务相关通知</li>
        <li>分析使用情况以改进用户体验</li>
        <li>防止欺诈和滥用行为</li>
      </ul>
    </section>

    <section>
      <h2>4. 信息存储与安全</h2>
      <p>我们采取以下措施保护您的信息：</p>
      <ul>
        <li>使用 HTTPS 加密传输数据</li>
        <li>对敏感信息进行加密存储</li>
        <li>限制员工对用户数据的访问权限</li>
        <li>定期进行安全审计</li>
      </ul>
      <p>您的数据存储在安全的云服务器上，我们会按照法律要求的期限保留数据。</p>
    </section>

    <section>
      <h2>5. 信息共享</h2>
      <p>我们不会出售您的个人信息。仅在以下情况下可能共享信息：</p>
      <ul>
        <li>获得您的明确同意</li>
        <li>与提供服务的合作伙伴共享（如支付处理商）</li>
        <li>法律要求或政府机关依法要求</li>
        <li>保护本平台或用户的权利和安全</li>
      </ul>
    </section>

    <section>
      <h2>6. Cookies 使用</h2>
      <p>本平台使用 Cookies 和类似技术用于：</p>
      <ul>
        <li>保持您的登录状态</li>
        <li>记住您的偏好设置</li>
        <li>分析网站流量和使用情况</li>
      </ul>
      <p>您可以通过浏览器设置管理或禁用 Cookies，但这可能影响部分功能的使用。</p>
    </section>

    <section>
      <h2>7. 您的权利</h2>
      <p>您对个人信息享有以下权利：</p>
      <ul>
        <li><strong>访问权：</strong>查看我们持有的您的个人信息</li>
        <li><strong>更正权：</strong>更正不准确的个人信息</li>
        <li><strong>删除权：</strong>要求删除您的个人信息</li>
        <li><strong>导出权：</strong>获取您的数据副本</li>
        <li><strong>撤回同意：</strong>撤回之前给予的同意</li>
      </ul>
      <p>如需行使上述权利，请通过网站联系我们。</p>
    </section>

    <section>
      <h2>8. 未成年人保护</h2>
      <p>本平台不面向18周岁以下的未成年人。如果我们发现无意中收集了未成年人的个人信息，将立即删除。</p>
    </section>

    <section>
      <h2>9. 政策更新</h2>
      <p>我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，重大变更时我们会通过网站通知或邮件告知您。</p>
    </section>

    <section>
      <h2>10. 联系我们</h2>
      <p>如对本隐私政策有任何疑问或需要行使您的权利，请联系我们：</p>
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
.legal-page h3 {
  @apply text-base font-medium text-stone-600 mt-3 mb-2;
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
.highlight {
  @apply bg-green-50 border-l-4 border-green-500 p-3 text-green-800;
}
</style>
