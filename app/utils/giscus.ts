// Giscus 配置不是密钥，会出现在公开页面的 HTML 与脚本属性中。
// 默认值对应 yuanhaisu/yuanhaisu.github.io 仓库的 Announcements 分类；
// 仍可用 NUXT_PUBLIC_GISCUS_* 环境变量覆盖。
export const GISCUS_DEFAULTS = {
  repo: 'yuanhaisu/yuanhaisu.github.io',
  repoId: 'R_kgDOVkEuGw',
  category: 'Announcements',
  categoryId: 'DIC_kwDOVkEuG84DK8F_',
} as const

export type GiscusTheme = 'light' | 'dark'
