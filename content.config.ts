import { defineCollection, defineContentConfig } from '@nuxt/content'
import {
  postFrontmatterSchema,
  projectFrontmatterSchema,
  seriesFrontmatterSchema,
} from './shared/content-schema.mjs'
import { draftPostExcludes } from './shared/content-source.mjs'

export default defineContentConfig({
  collections: {
    posts: defineCollection({
      type: 'page',
      source: {
        include: 'posts/**/*.md',
        exclude: draftPostExcludes(),
      },
      schema: postFrontmatterSchema,
    }),
    series: defineCollection({
      type: 'page',
      source: 'series/**/*.md',
      schema: seriesFrontmatterSchema,
    }),
    projects: defineCollection({
      type: 'page',
      source: 'projects/**/*.md',
      schema: projectFrontmatterSchema,
    }),
  },
})
