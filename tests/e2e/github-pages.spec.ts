import { access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { expect, test } from '@playwright/test'

const outputDir = resolve(process.cwd(), '.output/public')
const siteOrigin = 'https://yuanhaisu.github.io'

test('GitHub Pages 产物提供首页与站点标题', async ({ page }) => {
  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('一人交付笔记')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    '一人交付笔记',
  )
})

test('未知路径返回生成的 404 页面', async ({ page }) => {
  const response = await page.goto('/__github-pages-missing-page')

  expect(response?.status()).toBe(404)
  await expect(page.locator('body')).toContainText('404')
})

test('canonical 与站内绝对链接指向 GitHub Pages 源', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${siteOrigin}/`,
  )

  const html = await page.content()
  expect(html).not.toContain('https://yuanhaisu.com')
})

test('产物包含 GitHub Pages 使用的 404.html', async () => {
  await expect(access(join(outputDir, '404.html'))).resolves.toBeUndefined()
})

test('产物不包含仅 Cloudflare 使用的 _headers', async () => {
  await expect(access(join(outputDir, '_headers'))).rejects.toThrow()
})
