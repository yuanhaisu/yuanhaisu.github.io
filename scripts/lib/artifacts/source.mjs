import { access, readFile, readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { parseFrontmatter } from '../../../shared/frontmatter.mjs'
import { SITE_ORIGIN } from '../../../shared/site-config.mjs'
import { addFailure } from './context.mjs'

export { SITE_ORIGIN }

export const STATIC_ROUTES = ['/', '/projects', '/about', '/archive', '/privacy', '/search']
export const SITEMAP_STATIC_ROUTES = ['/', '/projects', '/about', '/archive', '/privacy']

export const REQUIRED_FILES = [
  'index.html',
  '404.html',
  'sitemap.xml',
  'feed.xml',
  'robots.txt',
  'llms.txt',
  'avatar.png',
  'pagefind/pagefind.js',
  'pagefind/pagefind-entry.json',
]

export async function pathExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function walk(directory, options = {}) {
  const files = []
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    if (options.skip?.includes(entry.name)) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(path, options)))
    } else if (entry.isFile()) {
      files.push(path)
    }
  }

  return files
}

export async function collectPublishedPosts(contentDir) {
  const postsDir = join(contentDir, 'posts')
  if (!(await pathExists(postsDir))) return []

  const posts = []
  for (const file of await walk(postsDir)) {
    if (!file.toLowerCase().endsWith('.md')) continue
    const parsed = parseFrontmatter(await readFile(file, 'utf8'))
    if (parsed.error) {
      addFailure(
        '内容源',
        `${relative(contentDir, file)} frontmatter 解析失败：${parsed.error}`,
      )
      continue
    }
    if (parsed.data?.draft === true) continue

    posts.push({
      slug: relative(postsDir, file)
        .replace(/\.md$/i, '')
        .split(sep)
        .join('/'),
      title: String(parsed.data?.title ?? ''),
      description: String(parsed.data?.description ?? ''),
      date: String(parsed.data?.date ?? ''),
      tags: Array.isArray(parsed.data?.tags)
        ? parsed.data.tags.map(String)
        : [],
      series: parsed.data?.series ? String(parsed.data.series) : undefined,
    })
  }

  return posts.sort((left, right) => left.slug.localeCompare(right.slug))
}

export async function collectPublishedProjects(contentDir) {
  const projectsDir = join(contentDir, 'projects')
  if (!(await pathExists(projectsDir))) return []

  const projects = []
  for (const file of await walk(projectsDir)) {
    if (!file.toLowerCase().endsWith('.md')) continue
    const parsed = parseFrontmatter(await readFile(file, 'utf8'))
    if (parsed.error) {
      addFailure(
        '内容源',
        `${relative(contentDir, file)} frontmatter 解析失败：${parsed.error}`,
      )
      continue
    }

    const slug = relative(projectsDir, file)
      .replace(/\.md$/i, '')
      .split(sep)
      .join('/')

    projects.push({
      slug,
      path: `/projects/${slug}`,
      title: String(parsed.data?.title ?? ''),
      description: String(parsed.data?.description ?? ''),
      type: String(parsed.data?.type ?? ''),
      status: String(parsed.data?.status ?? ''),
      updated: parsed.data?.updated ? String(parsed.data.updated) : undefined,
    })
  }

  return projects.sort((left, right) => left.slug.localeCompare(right.slug))
}

export function expectedRoutes(posts, projects = []) {
  const tags = [...new Set(posts.flatMap((post) => post.tags))]
  const series = [...new Set(posts.flatMap((post) => post.series ?? []))]

  return new Set([
    ...STATIC_ROUTES,
    ...posts.map((post) => `/posts/${post.slug}`),
    ...projects.map((project) => project.path),
    ...tags.map((tag) => `/tags/${tag}`),
    ...series.map((item) => `/series/${item}`),
  ])
}

/**
 * Encode each path segment for sitemap URLs. Filesystem routes keep raw
 * Unicode (tags/一人交付/index.html); only URLs percent-encode.
 */
export function encodeRoute(route) {
  return route
    .split('/')
    .map((segment) => (segment ? encodeURIComponent(segment) : ''))
    .join('/')
}

export function expectedSitemapUrls(posts, projects = []) {
  const tags = [...new Set(posts.flatMap((post) => post.tags))]
  const series = [...new Set(posts.flatMap((post) => post.series ?? []))]

  return new Set(
    [
      ...SITEMAP_STATIC_ROUTES,
      ...posts.map((post) => `/posts/${post.slug}`),
      ...projects.map((project) => project.path),
      ...tags.map((tag) => `/tags/${tag}`),
      ...series.map((item) => `/series/${item}`),
    ].map((route) => `${SITE_ORIGIN}${encodeRoute(route)}`),
  )
}

export function routeFromHtmlPath(rootDir, file) {
  const relativeDir = relative(rootDir, join(file, '..'))
    .split(sep)
    .join('/')
  return relativeDir ? `/${relativeDir}` : '/'
}

export async function collectHtmlRoutes(rootDir) {
  const files = await walk(rootDir, {
    skip: ['_nuxt', 'pagefind', '__nuxt_content'],
  })
  const routes = new Map()

  for (const file of files) {
    if (!file.toLowerCase().endsWith('.html')) continue
    const relativePath = relative(rootDir, file).split(sep).join('/')
    if (relativePath === '404.html' || relativePath === '200.html') continue
    if (!relativePath.endsWith('index.html')) {
      addFailure('路由', `未知 HTML 产物：${relativePath}`)
      continue
    }
    routes.set(routeFromHtmlPath(rootDir, file), file)
  }

  return routes
}
