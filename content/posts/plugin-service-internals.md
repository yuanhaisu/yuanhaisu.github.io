---
title: "宿主如何拉起、路由和热更新插件：插件服务的实现拆解"
description: 从插件目录扫描、go-plugin 握手、命令路由，到配置 MD5 同步和热更新——拆开宿主侧那一千三百行。
date: 2026-11-13
tags:
  - 插件化
  - 架构设计
  - Go
  - go-plugin
  - 热更新
  - 数据处理
draft: false
featured: false
launch: false
visibility: teaser
lang: zh
license: CC BY 4.0
---

上篇[《把管道交给宿主，把业务留给插件》](/posts/dataprocess-plugin-architecture)讲的是为什么拆、买到了什么、代价是什么。这篇只讲宿主侧怎么实现：一个插件从目录里被发现，到被拉起、被调用、被热替换，中间发生了什么。

公开部分只保留问题边界与设计方向：

- 插件如何被发现、加载并进入就绪状态；
- 配置变化如何同步到已经运行的插件；
- 多个版本如何并存，热更新失败时如何回滚。

具体的状态表、握手配置、命令路由与热更新实现暂不公开。
