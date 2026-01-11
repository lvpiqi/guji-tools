# 古籍工具集 (Guji Tools)

> 130+ 古籍数字化在线工具，打开即用，无需安装

## 技术栈

- **框架**: Vue 3 + TypeScript + Vite
- **样式**: TailwindCSS
- **状态**: Pinia
- **路由**: Vue Router (懒加载)
- **图像处理**: Canvas API + WASM (OpenCV, LaMa, Real-ESRGAN)
- **文档处理**: PDF-lib, JSZip, epub.js
- **部署**: Vercel / Cloudflare Pages

## 项目结构

```
guji-tools/
├── src/
│   ├── core/                 # 核心共享模块
│   │   ├── types/            # TypeScript 类型定义
│   │   ├── wasm/             # WASM 模块加载器
│   │   └── composables/      # 组合式 API
│   │       ├── useImageProcessor.ts   # 图像处理
│   │       └── useQuota.ts            # 配额管理
│   │
│   ├── components/           # 共享组件
│   │   ├── common/           # 通用组件
│   │   │   ├── FileDropzone.vue      # 文件拖放
│   │   │   ├── ImageCompare.vue      # 前后对比
│   │   │   └── ProgressBar.vue       # 进度条
│   │   └── layout/           # 布局组件
│   │
│   ├── tools/                # 工具页面 (按场景分组)
│   │   ├── input/            # 输入场景
│   │   ├── clean/            # 清理场景
│   │   ├── read/             # 阅读场景
│   │   ├── search/           # 搜索场景
│   │   ├── export/           # 输出场景
│   │   └── pro/              # 专业场景
│   │
│   ├── views/                # 页面视图
│   ├── router/               # 路由配置
│   └── styles/               # 全局样式
│
└── public/
    └── wasm/                 # WASM 模块文件
```

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 开发一年路线图

### Q1: 基础设施 + 高频工具 (1-3月)

**基础设施**
- [x] 项目架构搭建
- [ ] WASM 模块加载器完善
- [ ] 配额系统 + 支付集成
- [ ] 用户系统 (可选)

**首批工具 (5个)**
- [ ] 去手指阴影 (MediaPipe + LaMa)
- [ ] 自动纠偏裁边 (OpenCV)
- [ ] 竖排 OCR (天若模型)
- [ ] 蠹鱼眼修复 (LaMa inpainting)
- [ ] 双层 PDF 导出 (PDF-lib)

### Q2: 阅读体验 + OCR增强 (4-6月)

**OCR 增强**
- [ ] 异体字纠错面板
- [ ] 自动句读 (吾与点 API)
- [ ] 繁简转换 (OpenCC)

**阅读工具**
- [ ] 竖横排转换
- [ ] 划词释义 (汉典 API)
- [ ] 流式 EPUB 生成

### Q3: 搜索 + 专业工具 (7-9月)

**搜索功能**
- [ ] 异体字扩展搜索
- [ ] 版本对比高亮
- [ ] 自动目录生成

**专业工具**
- [ ] 字形演变动画
- [ ] 押韵检测
- [ ] 古画色卡提取

### Q4: AI增强 + 商业化 (10-12月)

**AI 功能**
- [ ] 自动摘要 (古文 BERT)
- [ ] 文言翻译
- [ ] 智能标引

**商业化**
- [ ] Pro 会员体系
- [ ] API 开放
- [ ] 机构版本

## 添加新工具

1. 在 `src/tools/{category}/` 下创建 Vue 组件
2. 在 `src/router/index.ts` 添加路由
3. 在 `src/components/layout/AppSidebar.vue` 添加导航
4. 使用 `useImageProcessor` 等共享 composable

参考 `src/tools/input/RemoveFinger.vue` 作为模板。

## 变现模式

| 功能 | 免费 | Pro |
|------|------|-----|
| 每日处理次数 | 20 | 无限 |
| 单文件大小 | 10MB | 100MB |
| 高清导出 | ✗ | ✓ |
| 批量打包 | ✗ | ✓ |
| API 调用 | ✗ | ✓ |

## License

MIT
