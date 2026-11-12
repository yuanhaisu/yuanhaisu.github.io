import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
}

async function fileStats(path) {
  try {
    return await stat(path)
  } catch {
    return null
  }
}

/**
 * Emulate a future Cloudflare Bulk Redirects entry locally. This is archived
 * configuration, not part of the GitHub Pages v1 deployment. The function is
 * kept so the archived `cloudflare/www-redirect.json` stays executable and
 * testable when the custom domain is reconnected.
 */
export function hostRedirect(config, hostHeader, requestUrl) {
  const rule = config?.www_redirect
  if (!rule || !rule.source_url || !rule.target_url) return null

  const source = new URL(
    /^https?:\/\//i.test(rule.source_url)
      ? rule.source_url
      : `https://${rule.source_url}`,
  )
  const host = (hostHeader ?? '').replace(/:\d+$/, '').toLowerCase()
  const hostMatches =
    host === source.hostname.toLowerCase() ||
    (rule.include_subdomains === true &&
      host.endsWith(`.${source.hostname.toLowerCase()}`))
  if (!hostMatches) return null

  const request = new URL(requestUrl, 'http://localhost')
  const sourcePath =
    source.pathname === '/' ? '' : source.pathname.replace(/\/+$/, '')
  let suffix = request.pathname

  if (sourcePath) {
    if (request.pathname === sourcePath) {
      suffix = ''
    } else if (
      rule.subpath_matching === true &&
      request.pathname.startsWith(`${sourcePath}/`)
    ) {
      suffix = request.pathname.slice(sourcePath.length)
    } else {
      return null
    }
  }

  const target = new URL(rule.target_url)
  let destinationPath = target.pathname

  if (rule.preserve_path_suffix === true && suffix) {
    destinationPath = `${destinationPath.replace(/\/+$/, '')}${suffix}`
  }
  if (!destinationPath.startsWith('/')) destinationPath = `/${destinationPath}`
  if (!destinationPath) destinationPath = '/'

  target.pathname = destinationPath
  if (rule.preserve_query_string === true) {
    target.search = request.search
  }

  return {
    status: Number(rule.status_code) || 301,
    location: target.href,
  }
}

/**
 * Parse a Cloudflare Pages `_headers` file into rules.
 * A rule is a non-indented path pattern followed by indented `Name: value`
 * lines. Lines starting with `#` are comments.
 *
 * GitHub Pages ignores `_headers`; this parser exists only so the archived
 * Cloudflare configuration can be checked before a future migration.
 */
export async function loadHeaderRules(filePath) {
  const source = await readFile(filePath, 'utf8')
  const rules = []
  let current = null

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    if (/^\s/.test(rawLine)) {
      if (!current) continue
      const separator = line.indexOf(':')
      if (separator === -1) continue
      current.headers.push([
        line.slice(0, separator).trim().toLowerCase(),
        line.slice(separator + 1).trim(),
      ])
      continue
    }

    current = { pattern: line, headers: [] }
    rules.push(current)
  }

  return rules.map((rule) => ({
    matcher: headerPatternToRegExp(rule.pattern),
    headers: rule.headers,
  }))
}

function headerPatternToRegExp(pattern) {
  let pathname = pattern
  if (/^https?:\/\//.test(pathname)) {
    pathname = new URL(pathname).pathname
  }
  const escaped = pathname.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replace(/\*/g, '.*')}$`)
}

/**
 * Serve the generated static site the way GitHub Pages does: files are served
 * from the artifact root, directory routes use `index.html`, and unknown paths
 * return the generated `404.html` with status 404.
 *
 * Response headers are intentionally not emulated: GitHub Pages does not
 * support custom headers, so `cloudflare/_headers` is not applied here.
 */
export function createStaticServer(root) {
  const resolvedRoot = resolve(root)

  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url ?? '/', 'http://localhost').pathname,
      )
      let filePath = resolve(join(resolvedRoot, pathname))

      if (
        filePath !== resolvedRoot &&
        !filePath.startsWith(resolvedRoot + sep)
      ) {
        res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('Forbidden')
        return
      }

      let info = await fileStats(filePath)
      if (!info || info.isDirectory()) {
        const indexPath = join(filePath, 'index.html')
        const indexInfo = await fileStats(indexPath)
        if (!indexInfo || indexInfo.isDirectory()) {
          const notFoundPath = join(resolvedRoot, '404.html')
          const notFoundInfo = await fileStats(notFoundPath)
          if (notFoundInfo && !notFoundInfo.isDirectory()) {
            const notFoundBody = await readFile(notFoundPath)
            res.writeHead(404, {
              'content-type': contentTypes['.html'],
              'content-length': notFoundInfo.size,
            })
            res.end(notFoundBody)
            return
          }

          res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
          res.end('Not found')
          return
        }
        filePath = indexPath
        info = indexInfo
      }

      const body = await readFile(filePath)
      res.writeHead(200, {
        'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
        'content-length': info.size,
      })
      res.end(body)
    } catch {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Internal server error')
    }
  })
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))

if (isEntrypoint) {
  const root = resolve(process.argv[2] ?? '.output/public')
  const port = Number(process.env.PORT ?? 4173)
  const server = createStaticServer(root)

  server.listen(port, '127.0.0.1', () => {
    console.log(`Serving ${root} at http://127.0.0.1:${port}`)
  })
}
