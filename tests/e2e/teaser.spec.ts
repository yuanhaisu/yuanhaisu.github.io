import { expect, test } from '@playwright/test'

const teaserPaths = [
  '/posts/dataprocess-plugin-architecture',
  '/posts/plugin-service-internals',
]

test('摘要文章只公开问题背景与设计方向', async ({ page }) => {
  const markers = [
    'gcc.RegisterGroup',
    'HandshakeConfig',
    'Pluginmap',
    'ConfMd5',
  ]

  for (const path of teaserPaths) {
    const response = await page.goto(path)
    expect(response?.status(), `${path} 应返回 200`).toBe(200)

    await expect(page.getByText('摘要 · 完整内容不公开')).toBeVisible()
    await expect(page.getByText('完整内容暂不公开')).toBeVisible()
    await expect(page.locator('#comments')).toHaveCount(0)

    const body = await page.locator('article').textContent()
    for (const marker of markers) {
      expect(body, `${path} 不应泄露完整实现细节：${marker}`).not.toContain(
        marker,
      )
    }
  }
})

test('摘要文章在列表与归档中带有摘要标记', async ({ page }) => {
  await page.goto('/archive')

  const entry = page
    .getByRole('link', { name: /把管道交给宿主/ })
    .first()
  await expect(entry).toContainText('摘要')
})

test('摘要文章仍输出 canonical 与文章 JSON-LD', async ({ page }) => {
  const path = teaserPaths[0]!
  await page.goto(path)

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://yuanhaisu.github.io${path}`,
  )

  const nodes = (
    await page.locator('script[type="application/ld+json"]').allTextContents()
  ).map((block) => JSON.parse(block) as Record<string, unknown>)

  expect(nodes.filter((node) => node['@type'] === 'BlogPosting')).toHaveLength(1)
})
