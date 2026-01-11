# SEO 自动构建设置指南

本文档说明如何设置自动化 SEO 页面生成。

## 方案选择

| 方案 | 难度 | 费用 | 推荐场景 |
|------|------|------|----------|
| GitHub Actions | ⭐ 简单 | 免费 | 推荐！适合大多数情况 |
| Netlify 定时函数 | ⭐⭐ 中等 | 需要 Pro 版 | 已使用 Netlify Pro |
| 服务器定时任务 | ⭐⭐⭐ 复杂 | 需要服务器 | 有自己的服务器 |

---

## 方案一：GitHub Actions（推荐）

### 步骤 1：设置 GitHub Secrets

1. 打开你的 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加以下 4 个密钥：

| Secret 名称 | 值 | 说明 |
|-------------|-----|------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase 匿名密钥 |
| `NETLIFY_AUTH_TOKEN` | `nfp_xxx` | Netlify 个人访问令牌 |
| `NETLIFY_SITE_ID` | `xxx-xxx-xxx` | Netlify 站点 ID |

### 步骤 2：获取 Netlify 密钥

**获取 NETLIFY_AUTH_TOKEN：**
1. 登录 [Netlify](https://app.netlify.com)
2. 点击右上角头像 → **User settings**
3. 点击 **Applications** → **Personal access tokens**
4. 点击 **New access token**，输入名称如 "GitHub Actions"
5. 复制生成的 token

**获取 NETLIFY_SITE_ID：**
1. 打开你的 Netlify 站点
2. 点击 **Site configuration** → **General**
3. 找到 **Site ID**，复制它

### 步骤 3：启用 GitHub Actions

1. 确保 `.github/workflows/incremental-seo.yml` 文件已提交到仓库
2. 打开 GitHub 仓库 → **Actions** 标签
3. 如果看到提示，点击 **I understand my workflows, go ahead and enable them**

### 步骤 4：测试

1. 在 **Actions** 标签页，点击 **Incremental SEO Build**
2. 点击 **Run workflow** → **Run workflow**
3. 等待运行完成，查看日志

### 运行频率

默认每小时运行一次。如需修改，编辑 `.github/workflows/incremental-seo.yml`：

```yaml
schedule:
  # 每小时
  - cron: '5 * * * *'
  
  # 每 6 小时
  # - cron: '0 */6 * * *'
  
  # 每天凌晨 2 点
  # - cron: '0 2 * * *'
```

---

## 方案二：Netlify 定时函数

需要 Netlify Pro 版本。

### 步骤 1：创建 Netlify Function

创建文件 `netlify/functions/scheduled-build.js`：

```javascript
const { schedule } = require('@netlify/functions')

exports.handler = schedule('0 * * * *', async (event) => {
  // 触发 Netlify 重新部署
  const response = await fetch(process.env.NETLIFY_BUILD_HOOK, {
    method: 'POST'
  })
  
  return {
    statusCode: 200,
    body: 'Build triggered'
  }
})
```

### 步骤 2：设置 Build Hook

1. Netlify 站点 → **Site configuration** → **Build & deploy**
2. 找到 **Build hooks** → **Add build hook**
3. 输入名称，复制生成的 URL
4. 在 **Environment variables** 中添加 `NETLIFY_BUILD_HOOK`

---

## 方案三：服务器定时任务（Cron）

如果你有自己的服务器（如阿里云、腾讯云）：

### 步骤 1：克隆项目到服务器

```bash
cd /var/www
git clone https://github.com/your-username/guji-tools.git
cd guji-tools
npm install
```

### 步骤 2：创建环境变量文件

```bash
cp .env.example .env
nano .env
# 填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
```

### 步骤 3：设置定时任务

```bash
crontab -e
```

添加以下行（每小时运行）：

```
0 * * * * cd /var/www/guji-tools && npm run build:incremental >> /var/log/seo-build.log 2>&1
```

### 步骤 4：同步到 CDN/服务器

构建完成后，需要将 `dist` 目录同步到你的 Web 服务器或 CDN。

---

## 验证 SEO 效果

### 1. 检查生成的页面

访问以下 URL 查看是否正常：
- `https://www.gujitools.com/char/学`
- `https://www.gujitools.com/summary/子曰学而时习之`

### 2. 检查 sitemap

访问 `https://www.gujitools.com/sitemap.xml`，确认包含新页面。

### 3. 提交到搜索引擎

- [Google Search Console](https://search.google.com/search-console)
- [百度站长平台](https://ziyuan.baidu.com/)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)

提交 sitemap URL：`https://www.gujitools.com/sitemap.xml`

---

## 常见问题

### Q: 为什么新页面没有生成？

检查：
1. 数据库中是否有新数据
2. GitHub Actions 是否运行成功
3. 查看 Actions 日志中的错误信息

### Q: 如何手动触发构建？

1. GitHub → Actions → Incremental SEO Build
2. 点击 **Run workflow**

### Q: 如何查看已生成的页面？

查看 `guji-tools/data/generated-pages.json` 文件。

### Q: 构建太频繁会有问题吗？

GitHub Actions 免费版每月有 2000 分钟限制，每小时构建约消耗 3-5 分钟，一个月约 2000-3600 分钟。如果超出，可以改为每 2-3 小时构建一次。
