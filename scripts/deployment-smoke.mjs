#!/usr/bin/env node
/**
 * Deployment smoke test for the static blog on GitHub Pages.
 *
 * Local mode (default):
 *   - verifies the generated deployment artifacts in .output/public
 *   - serves them through the GitHub Pages emulator in tests/static-server.mjs
 *   - checks GET / and a public route for 200, and an unknown path for 404
 *   - confirms Cloudflare-only `_headers` is not shipped
 *
 * Live mode (SMOKE_BASE_URL=https://yuanhaisu.github.io):
 *   - requires HTTPS
 *   - checks 200 and the canonical origin in the served HTML
 *   - checks http:// -> https:// redirect
 *
 * GitHub Pages response headers are controlled by GitHub, not this repository:
 * there is no custom CSP/HSTS seam here. See docs/deployment.md. This script
 * never reads or prints credentials.
 */
import { access } from 'node:fs/promises'
import { request as httpRequest } from 'node:http'
import { resolve } from 'node:path'
import { SITE_ORIGIN } from '../shared/site-config.mjs'
import { createStaticServer } from '../tests/static-server.mjs'

const root = resolve('.output/public')
const failures = []

function check(condition, message, detail = '') {
  if (condition) {
    console.log(`  ok   ${message}`)
    return
  }
  const suffix = detail ? ` (${detail})` : ''
  console.log(`  FAIL ${message}${suffix}`)
  failures.push(message)
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function request(baseURL, path) {
  const url = new URL(baseURL)
  return new Promise((resolvePromise, reject) => {
    const req = httpRequest(
      {
        hostname: url.hostname,
        port: url.port,
        path,
        timeout: 10_000,
      },
      (response) => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () =>
          resolvePromise({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body,
          }),
        )
      },
    )
    req.on('timeout', () => req.destroy(new Error('request timed out')))
    req.on('error', reject)
    req.end()
  })
}

async function checkLocalArtifacts() {
  console.log('Local build artifacts')

  const required = [
    'index.html',
    '404.html',
    'sitemap.xml',
    'feed.xml',
    'robots.txt',
    'llms.txt',
    'pagefind/pagefind.js',
  ]
  for (const file of required) {
    check(await exists(resolve(root, file)), `.output/public/${file} exists`)
  }
  check(
    !(await exists(resolve(root, '_headers'))),
    'Cloudflare-only _headers is not shipped to GitHub Pages',
  )

  const server = createStaticServer(root)
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolvePromise)
  })
  const { port } = server.address()
  const baseURL = `http://127.0.0.1:${port}`

  try {
    const home = await request(baseURL, '/')
    check(home.status === 200, 'GET / -> 200')
    check(
      home.body.includes(`rel="canonical" href="${SITE_ORIGIN}/"`),
      'GET / carries the GitHub Pages canonical',
    )

    const about = await request(baseURL, '/about')
    check(about.status === 200, 'GET /about -> 200')

    const missing = await request(baseURL, '/__smoke-missing-page')
    check(missing.status === 404, 'unknown path -> 404')
  } finally {
    await new Promise((resolvePromise) => server.close(resolvePromise))
  }
}

async function checkLive(baseURL) {
  console.log(`Live deployment: ${baseURL}`)

  if (!baseURL.startsWith('https://')) {
    check(false, 'SMOKE_BASE_URL must be an HTTPS URL')
    return
  }

  let response
  try {
    response = await fetch(`${baseURL}/`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    check(false, `GET ${baseURL}/ is reachable`, error.message)
    return
  }

  check(response.status === 200, `GET ${baseURL}/ -> 200`, `got ${response.status}`)

  const html = await response.text()
  check(
    html.includes(`rel="canonical" href="${SITE_ORIGIN}/"`),
    `canonical points at ${SITE_ORIGIN}/`,
  )

  try {
    const httpResponse = await fetch(`http://${new URL(baseURL).host}/`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    })
    const location = httpResponse.headers.get('location') ?? ''
    check(
      [301, 302, 307, 308].includes(httpResponse.status) &&
        location.startsWith(`https://${new URL(baseURL).host}/`),
      'http:// requests redirect to https://',
      `got ${httpResponse.status} ${location}`,
    )
  } catch (error) {
    check(false, 'http:// requests redirect to https://', error.message)
  }

  const missing = await fetch(`${baseURL}/__smoke-missing-page`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000),
  })
  check(
    missing.status === 404,
    'unknown path -> 404',
    `got ${missing.status}`,
  )
}

await checkLocalArtifacts()

const liveBaseURL = process.env.SMOKE_BASE_URL?.replace(/\/+$/, '')
if (liveBaseURL) {
  await checkLive(liveBaseURL)
}

if (failures.length) {
  console.error(`\nFAIL: ${failures.length} deployment check(s) failed.`)
  process.exitCode = 1
} else {
  console.log(
    '\nPASS: local deployment artifacts are valid.' +
      (liveBaseURL ? ' Live deployment checks passed.' : ''),
  )
  console.log(
    'GitHub Pages handles HTTPS and custom-domain settings in repository ' +
      'settings; response headers are GitHub-managed. See docs/deployment.md.',
  )
}
