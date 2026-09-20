# akrobot.cn — 个人主页

一个静态个人主页：**纯静态输出 + 浏览器后台 + 构建期预渲染**。
没有前端框架，没有数据库，内容以 Markdown 存在仓库里。

- 后台在 `/admin/`，浏览器里就能写文章、加作品、发动态、上传下载包
- 保存后自动重新构建、自动上线（GitHub Actions）
- 自动跟随系统深浅色，右上角按钮可手动切换（跟随系统 → 浅色 → 深色）
- 滚动动画、导航高亮、邮箱一键复制
- 响应式，手机端可用
- 深海军蓝 + 青色配色

## 当前部署状态

| 项 | 值 |
|---|---|
| GitHub 账号 | `qgle88-prog` |
| 仓库 | `qgle88-prog/qgle88-prog.github.io` |
| 分支 | `main` |
| 发布方式 | GitHub Actions（构建产物 `_site/`） |
| 自定义域名 | `akrobot.cn`（已绑定，HTTPS 已开启） |
| 默认地址 | https://qgle88-prog.github.io/ |
| DNS 服务商 | 阿里云（万网，NS = `dns1/dns2.hichina.com`） |

## 文件结构

```
.
├── index.html              首页模板（含 BUILD: 注入标记，不要手写卡片）
├── 404.html                404 页面
│
├── content/                ★ 内容都在这里，全部是 Markdown
│   ├── articles/           文章（长文）
│   ├── works/              作品（工具 / 项目）
│   ├── notes/              动态（短更新）
│   └── downloads/          下载（脚本 / 软件 / 模板 / 数据集）
│
├── admin/
│   ├── index.html          后台页面（Sveltia CMS）
│   └── config.yml          后台字段配置 ← 想改字段改这里
│
├── build/
│   ├── build.mjs           构建脚本：Markdown → 静态 HTML
│   └── serve.mjs           本地预览服务器
│
├── assets/
│   ├── style.css           样式（配色变量在文件顶部）
│   ├── main.js             主题切换、滚动动画、复制按钮
│   └── uploads/            ★ 下载包放这里
│
├── .github/workflows/
│   └── deploy.yml          推送后自动构建 + 发布
│
├── CNAME                   自定义域名（内容为 akrobot.cn）
├── deploy.sh               本地手动发布（备用）
├── watch.sh                本地改动自动同步（备用）
├── robots.txt
└── .nojekyll
```

## 本地预览

```bash
npm install          # 只需第一次
npm run build        # 生成 _site/
npm run serve        # 起本地服务器，默认 8899 端口
```

打开 http://127.0.0.1:8899 。

改内容时另开一个终端跑 `npm run dev`，它会在构建后自动起服务器。

> ⚠️ **不要直接双击 `index.html` 看效果。** 首页里有 `<!-- BUILD:WORKS -->`
> 这类占位标记，必须经过构建脚本替换才是完整页面。直接打开会看到空白的卡片区。

## 怎么改内容

### 方式一：浏览器后台（推荐）

访问 **https://akrobot.cn/admin/**

首次使用需要生成一个 GitHub 访问令牌：

1. 打开 https://github.com/settings/personal-access-tokens/new
2. **Token name** 随便填，比如 `akrobot-cms`
3. **Expiration** 建议选 90 天或更长（到期后重新生成一个即可）
4. **Repository access** → 选 `Only select repositories` → 勾 `qgle88-prog.github.io`
5. **Permissions** → `Repository permissions` →
   **Contents** 设为 `Read and write`（其他都不用给）
6. 点 `Generate token`，把 `github_pat_...` 开头的字符串**复制下来**
   （只显示一次，关掉页面就没了）
7. 回到 `/admin/`，点 `Sign in with Token`，粘贴进去

> 令牌存在浏览器本地，**不要在公司电脑或公共电脑上登录**。
> 换电脑要重新生成一次。

登录后左侧有四块：**文章 / 作品 / 下载 / 动态**，点进去就能新建、编辑、删除。
写完后点 `Publish`（或 `Save`），右下角会提示提交成功，
大约 1 分钟后线上就更新了。

### 方式二：直接改 Markdown

`content/` 下面的 `.md` 文件都是「前置元数据 + 正文」的格式：

```markdown
---
title: 文章标题
slug: my-article
date: 2026-09-20
summary: 一句话摘要，会显示在列表页
tags: [自动化, Python]
draft: false
---

正文从这里开始，用 Markdown 写。
```

加一篇新文章，就往 `content/articles/` 里加一个 `.md` 文件。
`slug` 决定网址（`/articles/<slug>/`），改它会让旧链接失效。

### 方式三：改样式和页面骨架

| 想改什么 | 找哪里 |
|---|---|
| 配色、间距、圆角 | `assets/style.css` 顶部的 CSS 变量 |
| 首页的自我介绍、技能标签、事实条 | `index.html` 的 `<section class="hero">` |
| 首页版块标题和说明文字 | `index.html` 对应 `<section>` 里的 `.section-head` |
| 关于我、联系方式 | `index.html` 的 `<section id="about">` / `<section id="contact">` |
| 子页面的排版与文案 | `build/build.mjs` 里对应的 `layout()` 调用 |
| 导航项 | `build/build.mjs` 的 `NAV` 数组 + `index.html` 的 `<nav>` |

**不要**在 `index.html` 里手写作品卡片或下载卡片。
首页的「在做的事」「可以下载的」「最近写的」三个区块都是构建时注入的，
标记分别是 `<!-- BUILD:WORKS -->`、`<!-- BUILD:DOWNLOADS -->`、`<!-- BUILD:LATEST -->`。

## 下载区怎么用

下载区支持两种来源，**优先用打包文件**：

| 情况 | 怎么做 |
|---|---|
| 文件小（建议 ≤ 20 MB） | 后台里「打包文件」直接上传，走站内直链 |
| 文件大（几十 MB 以上） | 传到 GitHub Releases，把链接填进「外部下载地址」 |

卡片上的**文件大小是构建时自动算的**，不用手填——只要你上传的是真实文件。
外链的情况不显示大小。

> 大文件不要直接塞进仓库：Git 会把每个历史版本都存下来，
> 仓库会越滚越大，而且克隆会变得很慢。

下载包里建议放一个 `README.md` 写清用法和已知边界。

## 内容是怎么上线的（两个来源，别搞混）

这个站点有**两个可以改内容的地方**，它们的同步方向是相反的：

```
① 浏览器后台 /admin/  ──点 Publish──►  GitHub 仓库  ──自动──►  网站更新（约 1 分钟）
                                        ▲
② 本地这个文件夹  ──────./deploy.sh─────┘        网站更新（约 1 分钟）

   但反向不成立：
   GitHub 上的改动  ──✕──►  本地文件夹不会自动更新（要 git pull）
```

**① 后台（推荐日常用）** — 完全自动

打开 https://akrobot.cn/admin/ 改内容 → 点 `Publish` → 完事。
不需要开电脑、不需要跑命令，手机浏览器也能发布。

背后的链路：CMS 用你的令牌把 Markdown 提交到仓库 → GitHub Actions 被自动触发 →
`npm install` + `npm run build` → 部署到 Pages。**约 1 分钟**线上生效，
进度看仓库的 **Actions** 标签。

> ⚠️ 必须点 `Publish`（保存）才会提交。只打字不点保存 = 什么都没发生。
> 另外打了「草稿」标记的内容不会发布。

**② 本地文件夹** — 不会自动上线

本地改完必须跑 `./deploy.sh`（或让 `./watch.sh` 常驻后台自动推）。
改的是样式、构建脚本、页面结构这些后台管不了的东西时才需要走这条路。

### 两边都改过怎么办

`deploy.sh` 会**先自动和远端同步再推送**，所以不用怕：

```
  ==> 与远端同步
    ! 远端有 2 个新提交（多半是你在后台发布的）
    ! 正在把本地 1 个提交挪到远端之上…
    ✓ 已同步到远端最新，本地改动保留在上方
```

反过来，本地想拿到后台发布的内容，手动拉一次：

```bash
git pull
```

**建议**：日常内容更新全部用后台；只有在改代码/样式时才动本地，
动之前先 `git pull` 一次。这样两边几乎不会撞车。

## 重新部署

### 自动（正常情况下）

推送到 `main` 分支，GitHub Actions 会自动构建并发布。
在后台改内容也是走这条路，不用管。

看构建状态：仓库页面 → **Actions** 标签。

### 手动（本地）

```bash
./deploy.sh            # 域名自动从 CNAME 读取，不用带参数
./deploy.sh            # 重复执行也没问题
```

脚本会：安全检查 → 提交 → 推送 → 确认 Pages 与域名绑定。

### 本地改动自动同步

```bash
./watch.sh             # 每 10 秒检查一次，有改动就自动发布
./watch.sh 30          # 自定义间隔（秒）
```

保持终端窗口开着，`Ctrl+C` 停止。改完文件保存，几秒后自动上线。

> ⚠️ **`.workbuddy/` 目录已被 `.gitignore` 排除，不会发布。**
> `deploy.sh` 里有三层防护，如果发现内部文件仍被追踪会直接中止发布。
> 往页面里加内容时不要动 `.gitignore`。

验证线上是否更新了，加时间戳强制刷新：

```bash
curl -s "https://akrobot.cn/?t=$(date +%s)" | grep 关键词
```

## 域名与 DNS（已完成，留档备查）

域名 `akrobot.cn` 在**阿里云**解析，需要这几条记录：

| 记录类型 | 主机记录 | 记录值 |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `qgle88-prog.github.io` |

- **四条 A 记录一条都不能少**，这是 GitHub Pages 的负载均衡地址池。
- 主机记录 `@` 代表 `akrobot.cn` 本身。
- CNAME 的值不要加 `https://`、不要加结尾的点、不要加路径。
- 域名上**不能有别的 A 记录残留**（比如阿里云的默认页 `60.205.34.132`），
  否则会出现「时好时坏」并且 HTTPS 证书永远签不下来。

验证：

```bash
dig +short akrobot.cn          # 应返回上面四条 GitHub IP
dig +short www.akrobot.cn      # 应返回 qgle88-prog.github.io
```

## 关于 .cn 域名和国内访问

**备案**：本站托管在 GitHub Pages，服务器在境外，**不需要 ICP 备案**。
只有把网站搬到国内服务器（阿里云 ECS、腾讯云等）时才需要。

**访问速度**：GitHub Pages 的服务器在国外，中国大陆访问**不稳定**，
有时快有时慢，个别地区可能打不开。这是固有限制，不是配置问题。

如果国内访问速度很重要，可以考虑换到免费的 **腾讯云 EdgeOne Pages**
或 **Cloudflare Pages** —— 后者不需要备案，国内访问通常比 GitHub Pages 稳一些。

## 常见问题

**打开是 404** — 检查仓库 Settings → Pages，
`Source` 应该是 **GitHub Actions**。首次部署后等 1–2 分钟。

**HTTPS 一直不可用** — 九成是 DNS 还没生效，先 `dig` 确认。
另外确认阿里云那边**没有**多余的 A 记录残留。

**改了内容没更新** — 先看 **Actions** 标签里构建是否成功。
构建通过了还看不到，就是 CDN 缓存，等一两分钟强制刷新（Cmd+Shift+R）。

**后台登录不了** — 令牌过期了，重新生成一个。
确认 `Contents` 权限是 `Read and write`，并且勾的是 `qgle88-prog.github.io` 这个仓库。

**推送被拒，提示 workflow scope** — 令牌缺少 `workflow` 权限。
在终端跑 `gh auth refresh -h github.com -s workflow`，
按提示在浏览器里完成授权。

**首页卡片区是空的** — 没有跑构建，或者构建报错了。
本地跑 `npm run build` 看输出；线上看 Actions 日志。
