<script setup lang="ts">
defineProps<{
  project: {
    path: string
    title: string
    description: string
    type: string
    status: string
    period?: string
    stack?: string[]
  }
}>()

const statusLabels: Record<string, string> = {
  active: '进行中',
  completed: '已完成',
  archived: '归档',
}

function statusLabel(status: string) {
  return statusLabels[status] ?? status
}
</script>

<template>
  <li class="project-card">
    <NuxtLink :to="project.path" class="project-card-link">
      <span class="project-card-head">
        <span class="project-badge">{{ project.type }}</span>
        <span class="project-badge project-badge-muted">
          {{ statusLabel(project.status) }}
        </span>
        <span v-if="project.period" class="project-card-period">
          {{ project.period }}
        </span>
      </span>
      <span class="project-card-title">{{ project.title }}</span>
      <span class="project-card-description">{{ project.description }}</span>
      <span v-if="project.stack?.length" class="project-card-stack">
        {{ project.stack.join(' · ') }}
      </span>
    </NuxtLink>
  </li>
</template>
