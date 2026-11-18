#!/usr/bin/env node
/**
 * Remove the previous static output before generating a new one.
 *
 * Nuxt copies `public/` into `.output/public` without deleting files that were
 * removed from `public/`, so stale assets can survive a rebuild. This matters
 * when a file was removed for privacy reasons: a manual deploy of a stale
 * `.output/public` would publish it again.
 */
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

await rm(resolve('.output/public'), { recursive: true, force: true })
