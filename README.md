# 一人交付笔记

`https://yuanhaisu.github.io` 的设计与实施文档。`yuanhaisu.com` 保留为未来自定义域。

- 作者：袁海粟（Yuan Haisu / yuanhaisu）
- 定位：一人公司的 AI 交付实验
- 读者：独立开发者 / 一人公司
- 成功标准：GEO（实体认知、内容引用、机器可读、信任传递）

## 策略

GitHub 内容源 → GitHub Actions → GitHub Pages → `https://yuanhaisu.github.io`；中文 canonical；国外 GEO 优先、英文 v1.1；国内通过知乎 + 微信公众号分发。v1 不做 ICP、不买国内服务器；国内镜像 v2 再评估。`yuanhaisu.com` 保留，未来可切回（改 `NUXT_PUBLIC_SITE_ORIGIN` 即可）。

## 文档

- [实施总案](docs/plan.md)
- [上线验收清单](docs/launch-checklist.md)
- [首发内容提纲](docs/content-outlines.md)
- 平台稿：[知乎草稿](docs/platform-posts/zhihu.md) · [公众号草稿](docs/platform-posts/wechat.md)
- [术语表](GLOSSARY.md)
- Agent 配置：[issue tracker](docs/agents/issue-tracker.md) · [triage labels](docs/agents/triage-labels.md) · [domain docs](docs/agents/domain.md)
- ADR
  - [0001 定位与成功标准](docs/adr/0001-positioning-and-success-criteria.md)
  - [0002 托管与合规（v1 已由 0007 取代）](docs/adr/0002-hosting-and-compliance.md)
  - [0003 身份与定位](docs/adr/0003-identity-and-positioning.md)
  - [0004 技术栈与内容](docs/adr/0004-tech-stack-and-content.md)
  - [0005 v1 范围与上线门槛（v1 已由 0007 取代）](docs/adr/0005-v1-scope-and-launch-gate.md)
  - [0006 GEO 与授权](docs/adr/0006-geo-and-licensing.md)
  - [0007 GitHub 优先与分发策略](docs/adr/0007-github-first-and-distribution.md)
  - [0008 GitHub Pages 作为 v1 托管](docs/adr/0008-github-pages-v1.md)

## 本地开发

需要 Node 22.22.3+ 或 24.15+（Nuxt 4.6 的引擎要求；`.nvmrc` 固定为 `22.22.3`）与 npm。

```bash
npm install            # 安装依赖
npm run dev            # 生产内容（当前 4 篇正式文章）
npm run dev:fixtures   # 带测试夹具的本地开发
npm run build          # 生产构建，不包含测试夹具
npm run build:test     # 测试构建：先 stage tests/fixtures/content/，再构建
npm run clean:fixtures # 清理 staged 夹具
npm run preview        # 预览静态产物
npm run test:e2e       # 需先 npm run build:test
npm run ci             # 内容护栏、密钥扫描、测试构建、产物、内链、Playwright、部署冒烟
```

生产内容在 `content/posts/` 与 `content/series/`；测试夹具在 `tests/fixtures/content/`。`npm run build` 只构建生产内容，`npm run build:test` 会先把夹具 stage 进被忽略的 `content/` 路径，供护栏、产物校验、内链检查与 Playwright 使用；`npm run ci` 结束时自动清理。

`npm run test:e2e` 会先由测试配置里的静态服务器提供 `.output/public`，再用 Playwright 访问；先运行 `npm run build:test` 生成带夹具的产物。本地 Windows 环境使用已安装的 Microsoft Edge（`channel: 'msedge'`）；CI 设置 `CI=true` 后使用已安装的 Chromium。

## 统计配置

Cloudflare Web Analytics 不使用 Cookie，所有公开页面都会立即加载它，脚本不阻塞正文渲染。百度统计会写入 Cookie，因此默认**不加载**：页面底部显示一个小型同意条，读者点击「允许百度统计」后才动态插入 `hm.js`，选择保存在 `localStorage` 的 `analytics-consent` 中；选择「仅使用无 Cookie 统计」后不会再询问，也不会发出百度请求。隐私说明页同步描述这一行为，`tests/e2e/analytics-privacy.spec.ts` 覆盖允许、拒绝、刷新后保持三种状态。

站点 ID 不是密钥，但不要把真实账号信息写进仓库：

```bash
# 未设置时使用 app/utils/analytics.ts 中的占位值（000...000）
NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=<cloudflare-beacon-token>
NUXT_PUBLIC_BAIDU_ANALYTICS_ID=<baidu-hm-site-id>
npm run build
```

在 GitHub 仓库的 **Settings → Secrets and variables → Actions → Variables** 中设置同名的 `NUXT_PUBLIC_*` 变量，部署工作流会注入构建。`.env.example` 列出了这些变量。

## 评论配置（Giscus）

文章页的评论基于 Giscus 与 GitHub Discussions，评论内容不进入本站仓库，也没有评论数据库或用户系统。评论只在评论区进入视口或读者点击「加载评论」后才加载；主题跟随站点当前的 `<html data-theme>`（即主题切换按钮与 `localStorage` 的选择，未设置时回退到 `prefers-color-scheme`），并通过 `MutationObserver` 在主题变化后重新加载 iframe。国内读者会看到知乎/公众号讨论入口。禁用 JavaScript 时页面显示 `<noscript>` 说明与 GitHub Discussions 链接。

Giscus 配置不是密钥。仓库 `yuanhaisu/yuanhaisu.github.io` 已启用 Discussions，并创建了 **Announcements** 分类；`app/utils/giscus.ts` 中已写入真实值。需要覆盖时使用：

```bash
NUXT_PUBLIC_GISCUS_REPO=yuanhaisu/yuanhaisu.github.io
NUXT_PUBLIC_GISCUS_REPO_ID=R_kgDOVkEuGw
NUXT_PUBLIC_GISCUS_CATEGORY=Announcements
NUXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDOVkEuG84DK8F_
npm run build
```

默认值已指向 `yuanhaisu/yuanhaisu.github.io` 仓库的 **Announcements** 分类，`repoId` 与 `categoryId` 也是真实值；仍可用 `NUXT_PUBLIC_GISCUS_*` 覆盖。GitHub Pages 不支持自定义响应头，`cloudflare/_headers` 仅作为未来 Cloudflare 迁移的归档配置，不进入构建产物。

## 知乎 / 微信公众号入口

身份链接只有一处配置：`shared/site-config.mjs` 的 `PROFILE_DEFINITIONS` 与 `resolveProfiles()`。默认值故意留空，About 页显示「账号准备中」占位，`sameAs` 只包含 GitHub 与 RSS，不会编造知乎或公众号 URL。账号建立后通过环境变量提供真实地址：

```bash
NUXT_PUBLIC_ZHIHU_URL=https://www.zhihu.com/people/<id>
NUXT_PUBLIC_WECHAT_MP_URL=https://mp.weixin.qq.com/s/<article-or-profile>
```

只有 `http(s)` 地址会被接受并进入 `sameAs`；未配置时相关入口保持占位。配置后需重新构建并运行 `npm run validate:artifacts`，确认 JSON-LD 与 About 页同步更新。

## 内容、草稿与上线护栏

- 真实草稿放在 `content/posts/drafts/`，该目录被 `.gitignore` 忽略，不会被提交。草稿仍会被内容护栏读取并验证 frontmatter，但不会进入路由、sitemap、RSS、llms.txt 或 Pagefind。
- **所有测试夹具**（文章、专题、草稿）存放在 `tests/fixtures/content/`，由 `scripts/stage-content-fixtures.mjs` 在 `npm run build:test` / `npm run validate:content` / CI 前复制到被忽略的 `content/posts/`、`content/posts/drafts/`、`content/series/`；`npm run clean:fixtures` 会按 manifest 只删除 staged 文件，不会碰真实内容。生产构建 `npm run build` 不 stage 夹具；`content/` 里现在有 4 篇正式文章初稿。
- 首发文章在 frontmatter 写 `launch: true`。内容护栏会要求至少 3 个不同的站内链接和至少 1 张站内原创配图，并允许链接到由已发布文章生成动态 `/tags/...`、`/series/...` 路由。测试夹具与未到发布阶段的文章不写该字段，因此不受约束。

## 项目档案

非文章型的长期项目放在 `content/projects/<slug>.md`，渲染为 `/projects` 与 `/projects/<slug>`。项目页不进入 RSS 与 Pagefind，但会进入 sitemap、llms.txt，并输出 `CreativeWork` JSON-LD。

```yaml
title: 项目名
description: 一句话说明
status: active | completed | archived
type: 开源 | 客户交付 | 个人产品 | 实验
period: 约 2.5 个月
role: 独立开发（后端 / 前端）
stack: [Go, Vue 3]
links:
  github: https://github.com/...
  demo: https://...
featured: true
order: 1
updated: 2026-11-12
relatedPosts:
  - /posts/...
```

`order` 控制 `/projects` 与首页「项目」区的排序；`updated` 用作 sitemap lastmod；`relatedPosts` 接受已发布文章的路径。示例见 `content/projects/nurture-planet.md`。

## 图片

Markdown 文章中的图片由 `shared/rehype-lazy-images.mjs` 统一加上 `loading="lazy"` 与 `decoding="async"`，避免长文首屏加载全部配图；作者若在原始 HTML 中显式设置这两个属性，则以作者设置为准。图片应放在 `public/` 下并以站内绝对路径引用（如 `/avatar.png`），上线文章的原创配图也由内容护栏检查。

仓库暂不内置图片格式转换流水线。发布前请自行把位图导出为 **WebP 或 AVIF**（两者都支持时优先 AVIF，兼容性要求高时用 WebP），并保留合理尺寸；需要同时提供回退格式时，在 Markdown 中直接写 `<picture>`：

```html
<picture>
  <source srcset="/images/diagram.avif" type="image/avif" />
  <source srcset="/images/diagram.webp" type="image/webp" />
  <img src="/images/diagram.png" alt="架构示意" loading="lazy" decoding="async" />
</picture>
```

## 部署（GitHub Pages）

- 站点地址：`https://yuanhaisu.github.io`
- 仓库：`yuanhaisu/yuanhaisu.github.io`（用户站根路径）
- 构建命令：`npm run build`
- 构建输出目录：`.output/public`
- 发布方式：`.github/workflows/deploy.yml` 在推送 `main` 时通过 GitHub Actions 构建并发布；Pages 的 Source 为 **GitHub Actions**
- 构建期变量：在仓库 **Settings → Secrets and variables → Actions → Variables** 配置 `NUXT_PUBLIC_*`，工作流会注入

`npm run build` 只构建 `content/` 中的正式内容；测试夹具只在 `npm run build:test` / CI 中 staged，部署工作流不会包含它们。

部署细节与未来接回 `yuanhaisu.com` 的迁移路径见[部署与加固](docs/deployment.md)。上线内容、账号侧待办与验收状态见[上线验收清单](docs/launch-checklist.md)。仓库侧可先运行：

```bash
npm run smoke:deployment   # 检查构建产物、200、404 与 canonical（本地模拟）
npm run check:secrets      # 检查仓库不含凭据与 .env
```

GitHub Pages 不支持自定义响应头，因此 v1 不承诺 CSP/HSTS；`cloudflare/_headers` 与 `cloudflare/www-redirect.json` 是未来迁移用的归档配置，不参与当前上线。

## 当前状态

站点已从 Cloudflare Pages 预览迁移到 GitHub Pages 并完成首次部署：**<https://yuanhaisu.github.io>**。仓库重命名为 `yuanhaisu/yuanhaisu.github.io`，Pages 构建源切换为 GitHub Actions，canonical/JSON-LD/sitemap/RSS/llms.txt 全部指向新地址。生产内容有 **4 篇正式文章**、**1 个项目档案**（养成星球），7 篇测试夹具只在测试/CI 时 staged；2 篇平台稿草稿已写。Giscus 已指向真实仓库与 Announcements 分类；统计 ID、平台 URL 与平台稿发布仍待账号侧完成。详见[上线验收清单](docs/launch-checklist.md)。

## 关键约束

- 每周 5–10 小时；v1 约 85–105 小时，2.5–3.5 个月
- 域名 `yuanhaisu.com` 保留；v1 站点 `https://yuanhaisu.github.io`；站名「一人交付笔记」；GitHub `github.com/yuanhaisu`
- Nuxt 4.6 + Nuxt Content 3.16，Markdown + Git，GitHub Pages
- v1 中文 canonical；英文 v1.1 在上线后 3 个月内完成
- 首发 3 篇中文博客 + 2 篇中文平台文章
- 评论 Giscus；统计 Cloudflare Web Analytics + 百度统计；搜索 Pagefind；Newsletter 公众号
- `kindergarten` 保持私有；公开案例仓库 `nurture-planet-case-study`
