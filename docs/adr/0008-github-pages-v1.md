# ADR-0008：GitHub Pages 作为 v1 托管

日期：2026-11-12

## 状态

已接受。取代 ADR-0004 第 5 项与 ADR-0007 中「Cloudflare Pages + `yuanhaisu.com` 规范 URL」的托管部分。

## 背景

原计划把 `yuanhaisu.com` 作为 v1 规范域名，托管在 Cloudflare Pages。Cloudflare Pages 项目与构建产物已经就绪，但 `yuanhaisu.com` 的 DNS 仍由 HiChina 托管，站点没有加入 Cloudflare zone，apex 自定义域一直是 `pending`。

2026-11-12，作者决定 v1 先不使用 `yuanhaisu.com`，改用 GitHub Pages 上线；域名保留，未来仍可能接回。

## 决策

1. **规范 URL**：`https://yuanhaisu.github.io`。所有 canonical、JSON-LD `@id`、OG/Twitter、sitemap、RSS、robots.txt 与 llms.txt 都指向这个源。
2. **仓库与站点地址**：把 `yuanhaisu/blog` 重命名为 `yuanhaisu.github.io`，使用 GitHub Pages 用户站根路径，避免 `/blog/` 基路径给站内绝对链接、配图与发现产物带来的额外迁移成本。旧仓库 URL 由 GitHub 自动跳转。
3. **部署**：`.github/workflows/deploy.yml` 在推送 `main` 时构建生产内容（不含测试夹具），通过 `actions/upload-pages-artifact` 与 `actions/deploy-pages` 发布；Pages 的构建源设为 GitHub Actions。
4. **可切换的 origin**：`shared/site-config.mjs` 的 `SITE_ORIGIN` 默认值为 `https://yuanhaisu.github.io`，可用构建期环境变量 `NUXT_PUBLIC_SITE_ORIGIN` 覆盖。未来接回 `yuanhaisu.com` 时只改这一处，并重新生成全部静态产物。
5. **响应头**：GitHub Pages 不支持自定义响应头。v1 不再承诺 CSP/HSTS；`cloudflare/_headers` 与 `cloudflare/www-redirect.json` 保留为归档配置，不进入构建产物，也不作为上线门禁。
6. **测试夹具隔离**：部署工作流只构建 `content/` 中的正式内容；测试夹具仍只在 `npm run build:test` / CI 中 staged。

## 后果

- 上线不再依赖 DNS 迁移或 Cloudflare 账号配置，仓库推送即可发布。
- `yuanhaisu.com` 暂时不解析；平台稿、站点身份与 `sameAs` 必须使用 github.io 地址，不能继续指向旧域名。
- GitHub Pages 不提供 CSP、HSTS 等自定义安全头；这是 v1 接受的取舍。未来若安全头成为硬要求，可切回 Cloudflare Pages 或在前方加一层代理。
- `github.io` 在中国大陆的直连稳定性不如商业 CDN；国内触达继续依赖知乎与微信公众号，国内镜像仍在 v2 评估。
- 未来接回自定义域时，需要处理 canonical 迁移、平台稿链接更新与旧地址 301；`SITE_ORIGIN` 的单点配置降低代码侧成本，但外部链接与搜索引擎收录仍需迁移计划。
- `hi@yuanhaisu.com` 目前没有 MX 记录，公开联系方式已改为 GitHub；域名邮箱开通后可再加回。
