import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import {
  getValidationState,
  resetValidationState,
} from '../../scripts/lib/artifacts/context.mjs'
import { validateHeaders } from '../../scripts/lib/artifacts/headers.mjs'
import { hostRedirect } from '../static-server.mjs'

test('归档的 Cloudflare 响应头配置仍然合法', async () => {
  resetValidationState()
  await validateHeaders(resolve('cloudflare'))

  expect(getValidationState().failures).toEqual([])
})

test('归档的 www 跳转声明仍然可执行，但不参与 GitHub Pages 上线', async () => {
  const config = JSON.parse(
    await readFile(resolve('cloudflare/www-redirect.json'), 'utf8'),
  ) as {
    status: string
    canonical_origin: string
  }

  expect(config.status).toBe('archived')
  expect(config.canonical_origin).toBe('https://yuanhaisu.com')

  expect(
    hostRedirect(config, 'www.yuanhaisu.com', '/posts/example?from=wechat'),
  ).toEqual({
    status: 301,
    location: 'https://yuanhaisu.com/posts/example?from=wechat',
  })
})

test('Cloudflare 专用 _headers 不再进入 GitHub Pages 构建源', async () => {
  await expect(access(resolve('public/_headers'))).rejects.toThrow()
})
