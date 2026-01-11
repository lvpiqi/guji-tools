<template>
  <div class="not-found">
    <span class="icon">📜</span>
    <h1>404 - 此卷已佚</h1>
    <p>您寻找的工具尚未收录</p>
    <router-link to="/" class="back-link">返回首页</router-link>
  </div>
</template>

<style scoped>
.not-found {
  @apply flex flex-col items-center justify-center min-h-[60vh] text-center;
}
.icon {
  @apply text-6xl mb-4;
}
h1 {
  @apply text-2xl font-bold text-stone-800 mb-2;
}
p {
  @apply text-stone-600 mb-6;
}
.back-link {
  @apply px-4 py-2 bg-amber-500 text-white rounded-lg
         hover:bg-amber-600 transition-colors;
}
</style>
