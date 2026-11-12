/**
 * Project archive queries.
 *
 * Projects are evergreen pages, not dated posts. They are ordered by the
 * optional `order` field and never enter the RSS feed or post archive.
 */
export async function fetchProjects() {
  const projects = await queryCollection('projects').all()

  return [...projects].sort((left, right) => {
    const leftOrder =
      typeof left.order === 'number' ? left.order : Number.POSITIVE_INFINITY
    const rightOrder =
      typeof right.order === 'number' ? right.order : Number.POSITIVE_INFINITY

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return left.title.localeCompare(right.title, 'zh-Hans-CN')
  })
}

export async function fetchFeaturedProjects() {
  const projects = await fetchProjects()
  return projects.filter((project) => project.featured === true)
}

export async function fetchProjectByPath(path: string) {
  return queryCollection('projects').path(path).first()
}
