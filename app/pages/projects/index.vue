<script setup lang="ts">
const route = useRoute()

const { data: projects } = await useAsyncData('projects', () => fetchProjects())

const statusGroups = [
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'archived', label: '归档' },
] as const

const groups = computed(() =>
  statusGroups
    .map((group) => ({
      ...group,
      projects: (projects.value ?? []).filter(
        (project) => project.status === group.key,
      ),
    }))
    .filter((group) => group.projects.length > 0),
)

usePageSeo({
  title: `项目 · ${SITE.name}`,
  description:
    '袁海粟的项目档案：开源工具、客户交付、个人产品与实验，记录问题、约束、架构、结果与可复核的证据。',
  path: route.path,
  ogTitle: '项目',
})
</script>

<template>
  <div class="projects">
    <header class="taxonomy-header">
      <p class="eyebrow">项目档案</p>
      <h1>项目</h1>
      <p class="taxonomy-description">
        长期维护的作品档案：问题、约束、架构、结果与可复核的证据。
      </p>
      <p class="taxonomy-count">共 {{ projects?.length ?? 0 }} 个项目</p>
    </header>

    <section
      v-for="group in groups"
      :key="group.key"
      class="project-group"
      :aria-labelledby="`projects-${group.key}`"
    >
      <h2 :id="`projects-${group.key}`">{{ group.label }}</h2>
      <ul class="post-list">
        <ProjectCard
          v-for="project in group.projects"
          :key="project.path"
          :project="project"
        />
      </ul>
    </section>

    <p v-if="!projects?.length" class="taxonomy-description">
      项目档案整理中，稍后回来看看。
    </p>
  </div>
</template>
