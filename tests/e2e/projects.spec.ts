import { expect, test } from '@playwright/test'

const projectPath = '/projects/nurture-planet'

test('项目索引页列出项目档案', async ({ page }) => {
  const response = await page.goto('/projects')

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('项目')
  await expect(
    page.getByRole('link', { name: /养成星球/ }).first(),
  ).toHaveAttribute('href', projectPath)
})

test('项目详情页展示状态、类型、技术栈与相关文章', async ({ page }) => {
  const response = await page.goto(projectPath)

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('养成星球')
  await expect(page.locator('article')).toContainText('客户交付')
  await expect(page.locator('article')).toContainText('已完成')
  await expect(page.locator('article')).toContainText('Go')
  await expect(
    page.getByRole('link', { name: /一人交付实验 #1/ }),
  ).toHaveAttribute('href', '/posts/one-person-delivery-experiment-01-multi-agent-saas')
})

test('项目详情页输出 CreativeWork、BreadcrumbList 与 canonical', async ({
  page,
}) => {
  await page.goto(projectPath)

  const nodes = (
    await page.locator('script[type="application/ld+json"]').allTextContents()
  ).map((block) => JSON.parse(block) as Record<string, unknown>)

  const project = nodes.find((node) => node['@type'] === 'CreativeWork')
  expect(project).toMatchObject({
    name: '养成星球',
    genre: '客户交付',
    creativeWorkStatus: 'completed',
  })
  expect(nodes.filter((node) => node['@type'] === 'BreadcrumbList')).toHaveLength(
    1,
  )

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://yuanhaisu.github.io${projectPath}`,
  )
})

test('未知项目返回 404', async ({ page }) => {
  const response = await page.goto('/projects/__missing-project')

  expect(response?.status()).toBe(404)
})
