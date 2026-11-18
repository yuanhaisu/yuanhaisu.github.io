# 摘要文章与私有全文

有些文章只适合公开方向，不适合公开完整实现。本站用 `visibility: teaser` 处理这类内容。

## 公开页面

- frontmatter 写 `visibility: teaser`，`launch: false`。
- `content/posts/<slug>.md` 只保留标题、描述、日期、标签，以及问题背景与设计方向。
- 文章页会显示「摘要 · 完整内容不公开」，正文后出现「完整内容暂不公开」提示，评论区不渲染。
- 首页、归档、标签与专题列表会在标题旁显示「摘要」标记。
- 摘要页仍进入 sitemap、llms.txt、RSS 摘要与 Pagefind；完整正文不会进入构建产物。

## 私有全文

完整正文放在仓库根目录的 `private/posts/`，该目录被 `.gitignore` 忽略，不会提交或部署：

```text
private/posts/
├── dataprocess-plugin-architecture.full.md
└── plugin-service-internals.full.md
```

注意：

- `private/` 只存在于当前机器；`git clean -fdx`、换机或磁盘损坏都会丢失。请另外备份到私有仓库、加密盘或密码管理器。
- 不要在公开仓库的 Issue、PR、Actions 日志或评论里粘贴全文。
- 如果想在浏览器里读全文，建议放到私有 GitHub 仓库；GitHub Pages 是纯静态公开托管，不能安全地做“仅作者可见”的页面级权限。

## 2026-11-18 的历史清理

这两篇文章最初以全文提交到公开仓库。2026-11-18 已用 `git filter-branch` 从 `main` 历史中移除全文，并强制推送；当前 `main` 只包含摘要版本。

仍需要注意：

- GitHub 可能继续通过旧 commit SHA 提供孤立提交。仓库所有者应向 GitHub Support 提交“移除敏感数据”请求，附上旧 commit SHA。
- 搜索引擎、AI 爬虫、RSS 阅读器可能已经缓存旧页面；重新部署只能保证新访问看到摘要，历史缓存需要向对应平台提交更新/删除请求。
- 旧 Actions 部署产物可能仍保留完整 HTML；必要时删除对应 workflow run 或联系 GitHub Support。

## 新增摘要文章的步骤

1. 在 `content/posts/<slug>.md` 写摘要版本，frontmatter 加 `visibility: teaser`，`launch: false`。
2. 把完整版本放到 `private/posts/<slug>.full.md`。
3. 运行 `npm run ci`，确认摘要页不包含完整正文标记。
4. 提交并推送；完整版本不要 `git add`。
