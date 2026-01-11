import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router, { setupRouterGuards } from './router'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 设置路由守卫
setupRouterGuards(router)

// 初始化认证状态
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
authStore.init()

app.mount('#app')
