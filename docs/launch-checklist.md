# 上线验收清单

状态日期：2026-11-12（GitHub Pages 迁移后）

本清单只区分三种状态：

- **通过**：仓库内代码与构建产物当前已通过，可在本地或 GitHub Actions 复现。
- **待完成（内容）**：需要写作或发布的内容工作。
- **阻塞（账号侧）**：需要登录 GitHub、百度统计、知乎、公众号等外部账号，仓库与 CI 无法代做。

> 当前结论：**代码/仓库侧门禁通过；GitHub Pages 已部署并复验；3 篇博客与 2 篇平台稿初稿已写。** 统计 ID、平台 URL 与平台稿发布仍未完成，因此还不能把 v1 标记为全部完成。

## 1. 代码 / 仓库侧：通过

### 1.1 一条命令跑完全部门禁

```bash
npm run ci
```

执行顺序：

```text
validate:content → check:secrets → build:test → validate:artifacts
→ check:links → test:e2e → smoke:deployment → clean:fixtures
```

CI 工作流 `.github/workflows/ci.yml` 在 Pull Request、推送到 `main` / `feat/blog-v1`、以及手动触发时执行同一组命令（Node 版本来自 `.nvmrc`，Playwright 使用 CI 安装的 Chromium，本地仍使用 Microsoft Edge）。

### 1.2 分项结果

| 检查 | 命令 | 当前结果 | 覆盖内容 |
| --- | --- | --- | --- |
| 内容护栏 | `npm run validate:content` | 通过：3 篇正式 + 7 篇测试夹具，1 篇草稿 | frontmatter schema、草稿隔离、正文内链目标、敏感字符串 |
| 密钥扫描 | `npm run check:secrets` | 通过 | 只扫描 Git 跟踪文件；只输出路径与模式名，不输出匹配值 |
| 静态构建（测试夹具） | `npm run build:test` | 通过：10 篇（3 正式 + 7 夹具），35 条路由 | 先 stage 测试夹具，再 `nuxt generate` + Pagefind 中文索引 |
| 产物验收 | `npm run validate:artifacts` | 通过：9 组检查；35 条路由、10 篇文章 | 必需文件、路由清单、JSON-LD、canonical/OG/Twitter、无 JS 正文、sitemap、RSS、robots、llms.txt、Pagefind、草稿隔离 |
| 站内链接 | `npm run check:links` | 通过：4 组检查；35 个 HTML 页面、1052 个站内链接 | 所有公开路由 200、站内 href/src 200、未知路由 404、草稿路由 404 |
| Playwright 全套 | `npm run test:e2e` | 通过（119 个测试） | 路由、404、无 JS、JSON-LD、SEO/GEO、RSS/sitemap/robots/llms、Pagefind 中文搜索、Giscus、统计同意门控、图片懒加载、GitHub Pages 产物、无障碍与响应式 |
| 部署冒烟 | `npm run smoke:deployment` | 通过（本地构建产物） | 必需产物、200、404、canonical、无 Cloudflare `_headers` |

### 1.3 已确认的上线不变量

- 每个公开路由（`/`、文章、标签、专题、`/about`、`/archive`、`/privacy`、`/search`）返回 200；未知路径返回 `404.html` 与 404 状态。
- 禁用 JavaScript 时，文章标题、日期、作者、正文仍在服务端 HTML 中；正文容器带 `data-pagefind-body`。
- 每页只有一个 canonical、一个 Person、一个 WebSite；文章额外有 BlogPosting 与 BreadcrumbList；JSON-LD 可解析且 `@id` 唯一。
- canonical、JSON-LD `@id`、OG/Twitter、sitemap、RSS、robots、llms.txt 全部指向 `https://yuanhaisu.github.io`。
- `sitemap.xml` 只收录真实存在的公开路由，含 lastmod，排除 `/search`、草稿与 404；RSS 2.0 `feed.xml` 条目数与已发布文章一致。
- `robots.txt` 允许全站抓取并列出 AI 爬虫与 sitemap；`llms.txt` 索引全部已发布文章，包含身份、授权与联系方式。
- Pagefind 生成 `zh-cn` 索引，已发布文章全部可检索；中文查询有 Playwright 断言。
- Giscus 默认配置指向 `yuanhaisu/yuanhaisu.github.io` 的 **Announcements** 分类，repoId/categoryId 为真实值；评论只在进入视口或点击后加载。
- 草稿不出现在路由、sitemap、RSS、llms.txt、Pagefind 索引或内容数据库转储中；测试夹具由 `scripts/stage-content-fixtures.mjs` 在测试构建前复制。
- 页脚与 404 页均展示 CC BY 4.0 授权链接；文章页脚同样展示。
- 所有 Markdown 文章图片带 `loading="lazy"` 与 `decoding="async"`；首发文章通过 `launch: true` 接受至少 3 个站内链接与 1 张站内原创配图检查。
- Cloudflare Web Analytics 无 Cookie、立即加载；百度统计默认不加载，仅在读者明确同意后插入脚本。
- GitHub Pages 不支持自定义响应头，因此 v1 不承诺 CSP/HSTS；`cloudflare/_headers` 与 `cloudflare/www-redirect.json` 是归档配置，不进入构建产物。
- `SITE_ORIGIN` 默认 `https://yuanhaisu.github.io`，可用 `NUXT_PUBLIC_SITE_ORIGIN` 覆盖；未来接回 `yuanhaisu.com` 时无需改代码。

## 2. 上线内容：3 篇博客 + 2 篇平台稿初稿已写

### 2.1 3 篇中文博客（已写，待发布）

| # | 工作标题 | 状态 |
| --- | --- | --- |
| 1 | 《我为什么开始「一人交付笔记」》 | 已写并扩写，待审阅/发布 |
| 2 | 《一人交付实验 #1：一个人 + 多 agent，2.5 个月交付 14 万行 SaaS》 | 已写并扩写，待审阅/发布 |
| 3 | 《一人交付实验 #2：AI 工程落地的三层栈》 | 已写并扩写，接近目标长度，待审阅/发布 |

第 2、3 篇的 frontmatter 日期分别是 2026-11-17 与 2026-11-24；如果希望上线当天三篇都算已发布，需要把日期调到今天或更早；如果按周连载，保持现状。

### 2.2 2 篇平台文章（草稿，待发布）

| # | 平台 | 工作标题 | 状态 |
| --- | --- | --- | --- |
| 4 | 知乎 | 《一个人如何用 AI agent 交付一套多租户 SaaS？》 | 已写草稿，canonical 已改为 github.io，待发布 |
| 5 | 微信公众号 | 《一人公司的 AI 交付实验：第一期复盘》 | 已写草稿，canonical 已改为 github.io，待发布 |

平台稿发布后，把真实 URL 写入 `NUXT_PUBLIC_ZHIHU_URL` / `NUXT_PUBLIC_WECHAT_MP_URL`，重新构建并确认 About 与 JSON-LD `sameAs` 同步。

## 3. 外部账号步骤

### 3.1 GitHub Pages

| 项目 | 当前状态 | 剩余项 |
| --- | --- | --- |
| 仓库 | 已重命名为 `yuanhaisu/yuanhaisu.github.io`；旧链接自动跳转 | 无 |
| Pages Source | 已设为 **GitHub Actions** | 无 |
| 发布工作流 | `.github/workflows/deploy.yml` 已添加；推送 `main` 后 CI 与 Deploy 均为 success | 无 |
| 站点地址 | `https://yuanhaisu.github.io` 已上线，首页/文章/sitemap/RSS/robots/llms.txt/Pagefind 均 200 | 无 |
| HTTPS | 已强制；`http://` 301 到 `https://` | 无 |
| 404 | 未知路径返回 404 与生成的 `404.html` | 无 |
| 文章 URL | `/posts/slug` 301 到 `/posts/slug/` 后 200；canonical 不带尾斜杠 | v1 接受；后续可统一尾斜杠 |

部署后运行：

```bash
SMOKE_BASE_URL=https://yuanhaisu.github.io npm run smoke:deployment
```

检查 200、canonical、`http://` → `https://`、未知路径 404。已知限制：GitHub Pages 不支持自定义响应头；目录 URL 可能 301 到带尾斜杠地址，而 canonical 不带尾斜杠。

### 3.2 真实统计 ID

当前 `app/utils/analytics.ts` 使用可安全提交的占位值；构建仍输出 Cloudflare 统计脚本，但不会产生真实数据。百度统计只有在读者同意后才会加载。

| 服务 | 环境变量 | 阻塞项 |
| --- | --- | --- |
| Cloudflare Web Analytics | `NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` | 在 Cloudflare Dashboard 创建 Web Analytics 站点并取得 token |
| 百度统计 | `NUXT_PUBLIC_BAIDU_ANALYTICS_ID` | 在百度统计创建站点并取得 hm.js site id |

真实值通过 GitHub 仓库 **Settings → Secrets and variables → Actions → Variables** 注入；不要提交到仓库，也不要在日志中打印。

### 3.3 Giscus

已完成：

- 仓库 Discussions 已启用。
- 默认分类为 **Announcements**。
- `app/utils/giscus.ts` 的真实值：`repo=yuanhaisu/yuanhaisu.github.io`、`repoId=R_kgDOVkEuGw`、`categoryId=DIC_kwDOVkEuG84DK8F_`。
- 仍可用 `NUXT_PUBLIC_GISCUS_*` 覆盖。

部署后用一个真实浏览器打开文章页，确认评论 iframe 能加载并跟随主题。

### 3.4 知乎 / 微信公众号 URL

| 项目 | 仓库侧现状 | 阻塞项 |
| --- | --- | --- |
| 知乎主页 | `resolveProfiles()` 默认返回空 `href`，About 显示占位；`sameAs` 不包含知乎 | 账号未建立/URL 未确认；建立后通过 `NUXT_PUBLIC_ZHIHU_URL` 提供 |
| 微信公众号入口 | 同上，默认占位；`sameAs` 不包含公众号 | 公众号未建立；建立后通过 `NUXT_PUBLIC_WECHAT_MP_URL` 提供 |
| 平台文章 URL | 两篇平台稿草稿已写 | 发布后把真实 URL 写入对应变量并重新构建 |

### 3.5 域名邮箱

`hi@yuanhaisu.com` 当前没有 MX 记录，邮件会退信。上线前二选一：

- 开通阿里云企业邮箱免费版，在域名 DNS 添加 MX/SPF/DKIM；或
- 在 About、`llms.txt`、JSON-LD 中暂时改用 GitHub 作为公开联系方式。

`yuanhaisu.com` 本身保留，不影响 GitHub Pages 站点。

### 3.6 上线后外部复验

- `SMOKE_BASE_URL=https://yuanhaisu.github.io npm run smoke:deployment`。
- Google Search Console、Bing Webmaster、百度站长：提交 `https://yuanhaisu.github.io/sitemap.xml`，验证站点所有权。
- 用真实浏览器复验 Giscus 加载与主题跟随、Cloudflare 无 Cookie 统计、百度统计在点击同意后才发起请求、Pagefind 中文搜索与移动端布局。
- 百度统计的同意条在无 Cookie 状态下不应自动创建 `hm.baidu.com` 请求；拒绝后刷新页面不再出现同意条。

## 4. 上线判定

只有以下三项同时满足，才能把 v1 标记为已上线：

- [x] 仓库侧 `npm run ci` 通过。
- [ ] 3 篇中文博客 + 2 篇平台文章完成并发布（3 篇博客已发布到站点，平台稿 0/2 发布）。
- [ ] 统计 ID、平台 URL 与域名邮箱完成并复验（GitHub Pages 与 Giscus 已完成）。

GitHub Pages 站点已经可访问，但 v1 的「上线」仍以平台稿发布与统计/联系方式完成为准；在此之前不要对外宣布全部完成。
