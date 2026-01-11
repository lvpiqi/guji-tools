import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guards'

// 工具路由按场景分组，懒加载
const toolRoutes: RouteRecordRaw[] = [
  // 1. 输入场景
  {
    path: '/input',
    name: 'input',
    children: [
      { path: '', name: 'input-index', component: () => import('@/views/CategoryPage.vue'), meta: { title: '输入场景' } },
      { path: 'remove-finger', name: 'remove-finger', component: () => import('@tools/input/RemoveFinger.vue'), meta: { title: '去手指阴影', category: 'input' } },
      { path: 'deskew', name: 'deskew', component: () => import('@tools/input/Deskew.vue'), meta: { title: '自动纠偏', category: 'input' } },
      { path: 'ocr-vertical', name: 'ocr-vertical', component: () => import('@tools/input/OcrVertical.vue'), meta: { title: '竖排OCR', category: 'input' } },
      { path: 'punctuation', name: 'punctuation', component: () => import('@tools/input/Punctuation.vue'), meta: { title: '自动句读', category: 'input' } },
      { path: 'convert', name: 'convert', component: () => import('@tools/input/TraditionalSimplified.vue'), meta: { title: '繁简转换', category: 'input' } },
      { path: 'batch-rename', name: 'batch-rename', component: () => import('@tools/input/BatchRename.vue'), meta: { title: '批量重命名ZIP', category: 'input' } },
      { path: 'segmentation', name: 'segmentation', component: () => import('@tools/input/Segmentation.vue'), meta: { title: '古汉语分词', category: 'input' } },
      { path: 'pinyin', name: 'pinyin', component: () => import('@tools/input/PinyinAnnotation.vue'), meta: { title: '拼音注音', category: 'input' } },
    ],
  },
  // 2. 清理场景
  {
    path: '/clean',
    name: 'clean',
    children: [
      { path: '', name: 'clean-index', component: () => import('@/views/CategoryPage.vue'), meta: { title: '清理场景' } },
      { path: 'background-unify', name: 'background-unify', component: () => import('@tools/clean/BackgroundUnify.vue'), meta: { title: '背景统一/匀光', category: 'clean' } },
      { path: 'inpaint', name: 'inpaint', component: () => import('@tools/clean/Inpaint.vue'), meta: { title: '蠹鱼眼修复', category: 'clean' } },
      { path: 'super-resolution', name: 'super-resolution', component: () => import('@tools/clean/SuperResolution.vue'), meta: { title: 'AI超分', category: 'clean' } },
      { path: 'extract-seal', name: 'extract-seal', component: () => import('@tools/clean/ExtractSeal.vue'), meta: { title: '印章提取', category: 'clean' } },
      { path: 'spine-remove', name: 'spine-remove', component: () => import('@tools/clean/SpineRemove.vue'), meta: { title: '中缝阴影补偿', category: 'clean' } },
      { path: 'compress', name: 'image-compress', component: () => import('@tools/clean/ImageCompress.vue'), meta: { title: '视觉无损压缩', category: 'clean' } },
      { path: 'blank-detect', name: 'blank-detect', component: () => import('@tools/clean/BlankDetect.vue'), meta: { title: '空白/重复页检测', category: 'clean' } },
      { path: 'stain-remove', name: 'stain-remove', component: () => import('@tools/clean/StainRemove.vue'), meta: { title: '水渍/黄斑修复', category: 'clean' } },
    ],
  },
  // 3. 阅读场景
  {
    path: '/read',
    name: 'read',
    children: [
      { path: '', name: 'read-index', component: () => import('@/views/CategoryPage.vue'), meta: { title: '阅读场景' } },
      { path: 'vertical-horizontal', name: 'vertical-horizontal', component: () => import('@tools/read/VerticalHorizontal.vue'), meta: { title: '竖横排转换', category: 'read' } },
      { path: 'dictionary', name: 'dictionary', component: () => import('@tools/read/Dictionary.vue'), meta: { title: '划词释义', category: 'read' } },
      { path: 'tts', name: 'tts', component: () => import('@tools/read/TextToSpeech.vue'), meta: { title: '古文朗读', category: 'read' } },
      { path: 'translate', name: 'translate', component: () => import('@tools/read/Translate.vue'), meta: { title: '自动翻译', category: 'read' } },
    ],
  },
  // 4. 搜索场景
  {
    path: '/search',
    name: 'search',
    children: [
      { path: '', name: 'search-index', component: () => import('@/views/CategoryPage.vue'), meta: { title: '搜索场景' } },
      { path: 'variant-search', name: 'variant-search', component: () => import('@tools/search/VariantSearch.vue'), meta: { title: '异体字搜索', category: 'search' } },
      { path: 'diff-compare', name: 'diff-compare', component: () => import('@tools/search/DiffCompare.vue'), meta: { title: '版本对比', category: 'search' } },
    ],
  },
  // 5. 输出场景
  {
    path: '/export',
    name: 'export',
    children: [
      { path: '', name: 'export-index', component: () => import('@/views/CategoryPage.vue'), meta: { title: '输出场景' } },
      { path: 'dual-layer-pdf', name: 'dual-layer-pdf', component: () => import('@tools/export/DualLayerPdf.vue'), meta: { title: '双层PDF', category: 'export' } },
      { path: 'epub', name: 'epub', component: () => import('@tools/export/Epub.vue'), meta: { title: 'EPUB生成', category: 'export' } },
      { path: 'long-image', name: 'long-image', component: () => import('@tools/export/LongImage.vue'), meta: { title: '长图生成', category: 'export' } },
      { path: 'plain-text', name: 'plain-text', component: () => import('@tools/export/PlainTextExport.vue'), meta: { title: '纯文本导出', category: 'export' } },
    ],
  },
  // 6. 专业场景
  {
    path: '/pro',
    name: 'pro',
    children: [
      { path: '', name: 'pro-index', component: () => import('@/views/CategoryPage.vue'), meta: { title: '专业场景' } },
      { path: 'glyph-evolution', name: 'glyph-evolution', component: () => import('@tools/pro/GlyphEvolution.vue'), meta: { title: '字形演变', category: 'pro' } },
      { path: 'rhyme-check', name: 'rhyme-check', component: () => import('@tools/pro/RhymeCheck.vue'), meta: { title: '押韵检测', category: 'pro' } },
      { path: 'color-palette', name: 'color-palette', component: () => import('@tools/pro/ColorPalette.vue'), meta: { title: '古画色卡', category: 'pro' } },
      { path: 'summary', name: 'summary', component: () => import('@tools/pro/Summary.vue'), meta: { title: '自动摘要', category: 'pro' } },
    ],
  },
]

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/Home.vue') },
  
  // 认证相关
  {
    path: '/auth',
    children: [
      { path: 'login', name: 'login', component: () => import('@/views/auth/Login.vue'), meta: { title: '登录' } },
      { path: 'register', name: 'register', component: () => import('@/views/auth/Register.vue'), meta: { title: '注册' } },
      { path: 'forgot', name: 'forgot-password', component: () => import('@/views/auth/ForgotPassword.vue'), meta: { title: '找回密码' } },
    ],
  },
  
  // 用户中心
  {
    path: '/user',
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'user-center', component: () => import('@/views/user/UserCenter.vue'), meta: { title: '用户中心' } },
      { path: 'settings', name: 'user-settings', component: () => import('@/views/user/UserSettings.vue'), meta: { title: '账号设置' } },
    ],
  },
  
  // 定价页面
  { path: '/pricing', name: 'pricing', component: () => import('@/views/Pricing.vue'), meta: { title: '定价' } },
  
  // 法律页面
  { path: '/terms', name: 'terms', component: () => import('@/views/Terms.vue'), meta: { title: '服务条款' } },
  { path: '/privacy', name: 'privacy', component: () => import('@/views/Privacy.vue'), meta: { title: '隐私政策' } },
  
  // 汉字详情页 - SEO友好的独立页面
  { 
    path: '/char/:char', 
    name: 'char-detail', 
    component: () => import('@/views/CharacterDetail.vue'),
    meta: { title: '汉字详情' }
  },
  
  // 摘要详情页 - SEO友好的独立页面
  {
    path: '/summary/:id',
    name: 'summary-detail',
    component: () => import('@/views/SummaryDetail.vue'),
    meta: { title: '摘要详情' }
  },
  
  // 管理后台（需要管理员权限）
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/Dashboard.vue'), meta: { title: '管理后台' } },
      { path: 'seo', name: 'admin-seo', component: () => import('@/views/admin/SeoManage.vue'), meta: { title: 'SEO管理' } },
      { path: 'content', name: 'admin-content', component: () => import('@/views/admin/ContentManage.vue'), meta: { title: '内容管理' } },
      { path: 'api', name: 'admin-api', component: () => import('@/views/admin/ApiConfig.vue'), meta: { title: 'API配置' } },
      { path: 'export', name: 'admin-export', component: () => import('@/views/admin/DataExport.vue'), meta: { title: '数据导出' } },
      { path: 'tools', name: 'admin-tools', component: () => import('@/views/admin/ToolsManage.vue'), meta: { title: '工具管理' } },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/UsersManage.vue'), meta: { title: '用户管理' } },
      { path: 'plans', name: 'admin-plans', component: () => import('@/views/admin/PlansManage.vue'), meta: { title: '计划管理' } },
      { path: 'feedback', name: 'admin-feedback', component: () => import('@/views/admin/FeedbackManage.vue'), meta: { title: '用户反馈' } },
      { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/Settings.vue'), meta: { title: '系统设置' } },
    ]
  },
  ...toolRoutes,
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})

// 导出路由守卫设置函数
export { setupRouterGuards, toolRoutes }
