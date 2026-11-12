<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug ?? '')

const { data: project } = await useAsyncData(`project:${slug}`, () =>
  fetchProjectByPath(`/projects/${slug}`),
)

if (!project.value) {
  throw createError({
    statusCode: 404,
    statusMessage: '项目不存在',
    fatal: true,
  })
}

const statusLabels: Record<string, string> = {
  active: '进行中',
  completed: '已完成',
  archived: '归档',
}

const statusLabel = computed(
  () => statusLabels[project.value?.status ?? ''] ?? project.value?.status ?? '',
)

const { data: allPosts } = await useAsyncData('project-related-posts', () =>
  queryPublishedPosts().all(),
)

const relatedPosts = computed(() => {
  const paths = project.value?.relatedPosts ?? []
  const posts = allPosts.value ?? []

  return paths
    .map((path) => posts.find((post) => post.path === path))
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
})

const { canonicalUrl } = usePageSeo({
  title: `${project.value.title} · ${SITE.name}`,
  description: project.value.description,
  path: route.path,
  ogTitle: project.value.title,
})

useJsonLd([
  {
    key: 'project-creativework',
    data: buildProjectJsonLd(project.value, canonicalUrl),
  },
  {
    key: 'project-breadcrumb',
    data: buildBreadcrumbListJsonLd([
      { name: '首页', url: absoluteUrl('/') },
      { name: '项目', url: absoluteUrl('/projects') },
      { name: project.value.title, url: canonicalUrl },
    ]),
  },
])
</script>

<template>
  <article v-if="project" class="project">
    <header class="post-header">
      <p class="eyebrow">项目档案</p>
      <div class="project-badges">
        <span class="project-badge">{{ project.type }}</span>
        <span class="project-badge project-badge-muted">{{ statusLabel }}</span>
        <span v-if="project.period" class="project-period">
          {{ project.period }}
        </span>
      </div>
      <h1>{{ project.title }}</h1>
      <p class="post-deck">{{ project.description }}</p>
      <p v-if="project.role" class="project-meta">
        <span>角色：{{ project.role }}</span>
      </p>
      <ul v-if="project.stack?.length" class="tag-list project-stack">
        <li v-for="item in project.stack" :key="item">
          <span>{{ item }}</span>
        </li>
      </ul>
      <p v-if="project.links?.github || project.links?.demo" class="project-links">
        <a
          v-if="project.links?.github"
          :href="project.links.github"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          v-if="project.links?.demo"
          :href="project.links.demo"
          rel="noopener noreferrer"
        >
          演示
        </a>
      </p>
    </header>

    <div class="post-body">
      <ContentRenderer :value="project" />
    </div>

    <nav
      v-if="relatedPosts.length"
      class="post-related"
      aria-labelledby="project-related-heading"
    >
      <h2 id="project-related-heading">相关文章</h2>
      <ul>
        <li v-for="related in relatedPosts" :key="related.path">
          <NuxtLink :to="related.path">{{ related.title }}</NuxtLink>
        </li>
      </ul>
    </nav>

    <footer class="post-license">
      <p>
        本页采用
        <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">
          CC BY 4.0
        </a>
        许可协议，转载请注明作者与原文链接。
      </p>
      <p>
        原文链接：<a :href="canonicalUrl">{{ canonicalUrl }}</a>
      </p>
    </footer>
  </article>
</template>
