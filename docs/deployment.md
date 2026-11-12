# 部署与加固

状态（2026-11-12）：

- **当前托管**：GitHub Pages 用户站，地址 <https://yuanhaisu.github.io>；仓库 `yuanhaisu/yuanhaisu.github.io`，发布源为 **GitHub Actions**。
- **构建**：`.github/workflows/deploy.yml` 在推送 `main` 时运行 `npm run validate:content` → `npm run clean:fixtures` → `npm run check:secrets` → `npm run build`，只发布 `content/` 中的正式内容。
- **规范 URL**：`https://yuanhaisu.github.io`；`yuanhaisu.com` 保留为未来自定义域。
- **已归档**：Cloudflare Pages 项目 `yuanhaisu-blog`、`cloudflare/_headers`、`cloudflare/www-redirect.json` 不再参与上线，只保留为未来迁移参考。
- **已知限制**：GitHub Pages 不支持自定义响应头（无 CSP/HSTS）；目录式 URL 可能由 GitHub 301 到带尾斜杠的地址，而 canonical 不带尾斜杠；`github.io` 在中国大陆的直连稳定性不如商业 CDN。

## 当前部署

| 项 | 值 |
| --- | --- |
| 站点 | <https://yuanhaisu.github.io> |
| 仓库 | `yuanhaisu/yuanhaisu.github.io` |
| Pages Source | GitHub Actions |
| 发布工作流 | `.github/workflows/deploy.yml` |
| 构建命令 | `npm run build` |
| 输出目录 | `.output/public` |
| 规范 URL 配置 | `shared/site-config.mjs`，默认 `https://yuanhaisu.github.io`，可用 `NUXT_PUBLIC_SITE_ORIGIN` 覆盖 |

## 发布流程

1. 在 `content/posts/`、`content/series/` 写正式内容；草稿放 `content/posts/drafts/`（被忽略）或私有仓库。
2. 本地运行 `npm run ci`；测试夹具只在测试构建中出现，`npm run build` 不包含它们。
3. 提交并推送 `main`。
4. GitHub Actions 构建生产站点，上传 Pages artifact，`actions/deploy-pages` 发布。
5. 用 `SMOKE_BASE_URL=https://yuanhaisu.github.io npm run smoke:deployment` 复验。

部署工作流会先 `validate:content`（staged 夹具用于完整护栏），随后 `clean:fixtures`，再执行生产构建；不会把测试夹具发布到线上。

## 环境变量

在仓库 **Settings → Secrets and variables → Actions → Variables** 配置；工作流通过 `vars.*` 注入构建。所有 `NUXT_PUBLIC_*` 都是公开值，不是密钥。

| 变量 | 作用 | 未设置时 |
| --- | --- | --- |
| `NUXT_PUBLIC_SITE_ORIGIN` | 切换 canonical/JSON-LD/sitemap/RSS 的源 | `https://yuanhaisu.github.io` |
| `NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` | Cloudflare Web Analytics | 占位 token，统计不生效 |
| `NUXT_PUBLIC_BAIDU_ANALYTICS_ID` | 百度统计 | 占位 ID，统计不生效 |
| `NUXT_PUBLIC_GISCUS_*` | 覆盖 Giscus 仓库/分类 | `yuanhaisu/yuanhaisu.github.io` + Announcements 的真实 ID |
| `NUXT_PUBLIC_ZHIHU_URL` | 知乎主页，进入 About 与 `sameAs` | 显示占位，不进入 `sameAs` |
| `NUXT_PUBLIC_WECHAT_MP_URL` | 公众号入口，进入 About 与 `sameAs` | 显示占位，不进入 `sameAs` |

真实统计 ID 与平台 URL 未配置时构建仍会成功，但对应功能不完整。

## 本地验证

```bash
npm run ci                   # 内容、密钥、测试构建、产物、内链、Playwright、部署冒烟
npm run build                # 生产构建（只含 3 篇正式文章）
npm run validate:artifacts   # JSON-LD、sitemap、RSS、robots、llms.txt、Pagefind
npm run check:links          # 公开路由 200、未知路由 404、草稿隔离
npm run smoke:deployment     # 本地构建产物：200、404、canonical、无 _headers
npm run check:secrets        # 仓库密钥扫描
```

在线冒烟：

```bash
SMOKE_BASE_URL=https://yuanhaisu.github.io npm run smoke:deployment
```

检查 HTTPS、200、canonical 指向当前源、未知路径 404、`http://` 跳转到 `https://`。

## GitHub Pages 的限制

- **自定义响应头不可用**：GitHub Pages 不解析 `_headers`，也不允许设置 CSP/HSTS。`cloudflare/_headers` 已移到 `cloudflare/`，不进入构建产物；如果未来安全头成为硬要求，需要切回 Cloudflare Pages 或在前面加代理。
- **目录 URL 尾斜杠**：GitHub Pages 对 `posts/foo/index.html` 通常会把 `/posts/foo` 301 到 `/posts/foo/`，而 canonical 是不带尾斜杠的地址。v1 接受这一跳转；如果后续要统一，可把 canonical 改为尾斜杠并同步站内链接。
- **国内访问**：`github.io` 的连通性不稳定；国内触达继续依赖知乎/微信公众号，国内镜像在 v2 评估。
- **构建配额**：GitHub Actions 免费额度足够当前更新频率；Pagefind 索引在构建期生成，不依赖服务端。

## 未来接回 `yuanhaisu.com`

域名与 Cloudflare 配置已保留，迁移步骤：

1. 在 Cloudflare 添加 `yuanhaisu.com` 站点，把 HiChina 的 NS 换成 Cloudflare 分配的两条，等待 zone Active。
2. 重新启用 Cloudflare Pages 项目（或把 GitHub Pages 放在 Cloudflare 代理后），把 `cloudflare/_headers` 复制回 `public/_headers`。
3. 在仓库 Variables 设置 `NUXT_PUBLIC_SITE_ORIGIN=https://yuanhaisu.com`，重新构建；所有 canonical、JSON-LD `@id`、sitemap、RSS、llms.txt 会一起切换。
4. 为 `www` 创建 Proxied DNS + Bulk Redirect，条目与 `cloudflare/www-redirect.json` 一致，并启用 Always Use HTTPS。
5. 更新平台稿、GitHub Profile、About 与 `sameAs` 中的 URL；对旧 github.io 地址做 301 或在平台侧改链。
6. 迁移后运行 `SMOKE_BASE_URL=https://yuanhaisu.com npm run smoke:deployment`，并重新提交 sitemap 到搜索引擎。

`cloudflare/www-redirect.json` 的状态是 `archived`，本地测试仍会校验它的 `www` 301 行为，但它不参与当前 GitHub Pages 上线。

## 归档文件

| 文件 | 作用 |
| --- | --- |
| `cloudflare/_headers` | 未来 Cloudflare Pages 的 HSTS、CSP、安全头与 `_nuxt` 缓存配置；当前不部署 |
| `cloudflare/www-redirect.json` | 未来 `www` → apex 301 的 Bulk Redirect 声明；当前不生效 |
| `scripts/deployment-smoke.mjs` | 本地/在线冒烟；当前检查 GitHub Pages 行为 |
| `tests/static-server.mjs` | 本地静态服务器，模拟 GitHub Pages 的目录 index 与 404；不应用自定义头 |
| `tests/guardrails/cloudflare-fallback.spec.ts` | 校验归档的 Cloudflare 配置仍然合法 |

## 密钥与日志

- 仓库不保存 Cloudflare、GitHub、百度统计等凭据；`.env` 与 `.env.*` 已被 `.gitignore` 忽略（`.env.example` 除外）。
- Pages 构建不需要密钥；`NUXT_PUBLIC_*` 是公开配置，仍建议通过仓库 Variables 管理，不写进源码。
- 冒烟脚本只请求公开 URL，不读取、不打印任何凭据。
- 提交前运行 `npm run check:secrets`；CI 执行同一脚本。
