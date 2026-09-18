# 个人主页

一个纯静态的个人主页：无框架、无构建步骤、无依赖。三个文件，扔到任何静态托管上都能跑。

- 自动跟随系统深浅色，右上角按钮可手动切换（跟随系统 → 浅色 → 深色，循环）
- 内置滚动动画、导航高亮、邮箱一键复制
- 响应式，手机端可用
- 深海军蓝 + 青色配色

## 文件结构

```
.
├── index.html          主页面（所有内容都在这里）
├── 404.html            404 页面
├── assets/
│   ├── style.css       样式（配色变量集中在文件顶部）
│   └── main.js         主题切换、滚动动画、复制按钮
├── deploy.sh           一键发布到 GitHub Pages
├── robots.txt
└── .nojekyll           告诉 GitHub Pages 不要跑 Jekyll
```

## 本地预览

```bash
cd 个人首页
python3 -m http.server 8899
# 打开 http://127.0.0.1:8899
```

直接双击 `index.html` 也能看，但用本地服务器更接近真实情况。

## 怎么改内容

所有文字都在 `index.html` 里，按区块找就行：

| 想改什么 | 找哪里 |
|---|---|
| 大标题、自我介绍、技能标签 | `<section class="hero" id="top">` |
| 项目卡片 | `<section class="section tinted" id="work">` 里的 `<article class="card">` |
| 笔记条目 | `<section class="section" id="notes">` 里的 `<a class="note">` |
| 关于我、右侧信息栏 | `<section class="section tinted" id="about">` |
| 邮箱、GitHub | `<section class="section" id="contact">` |

配色改 `assets/style.css` 开头的变量。品牌色是 `--accent`（青色）和
`--accent-2`（天蓝），浅色和深色两套都要改。

**复制一张项目卡片**：把整个 `<article class="card reveal">...</article>` 复制一份改内容即可。

## 发布到 GitHub Pages

```bash
./deploy.sh              # 只发布，地址是 https://<用户名>.github.io
./deploy.sh aking.com    # 发布并绑定自定义域名
```

脚本会自动：检查登录状态 → 初始化 git → 创建仓库 → 推送 → 开启 Pages →
（可选）绑定域名。可以重复执行，已完成的步骤会自动跳过。

首次使用需要先登录 GitHub：

```bash
brew install gh
gh auth login --web
```

## 绑定自定义域名

### 第一步：加 DNS 记录

登录你的域名服务商（阿里云 / 腾讯云 / Cloudflare / Namecheap 等），
在 DNS 解析设置里添加：

**A 记录 —— 绑定根域名（四条都要，一条都不能少）**

| 主机记录 | 类型 | 记录值 |
|---|---|---|
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |

**CNAME 记录 —— 绑定 www 子域名**

| 主机记录 | 类型 | 记录值 |
|---|---|---|
| `www` | CNAME | `<你的用户名>.github.io` |

> 注意 CNAME 的值末尾**不要**加点和路径，就是 `username.github.io`。

### 第二步：在 GitHub 端填入域名

仓库 → **Settings** → 左侧 **Pages** → **Custom domain** 填你的域名 → **Save**。

等 DNS 生效（一般几分钟，最长几小时），同一页面的 **Enforce HTTPS** 勾选上，
GitHub 会自动签发免费证书。

### 验证

```bash
dig +short aking.com          # 应返回上面四条 GitHub 的 IP
dig +short www.aking.com      # 应返回 <用户名>.github.io
```

### 如果域名 DNS 托管在 Cloudflare

把代理状态（橙色云朵）**关掉**，改成「仅 DNS」，否则 GitHub 签发证书会失败。
等 HTTPS 生效后可以再打开代理。

## 常见问题

**打开是 404** — 检查 Pages 设置里的分支是不是 `main`、目录是不是 `/ (root)`。
首次部署后要等 1–2 分钟。

**HTTPS 一直不可用** — 通常是 DNS 还没生效。先在终端 `dig` 确认，再等一会儿。
Cloudflare 用户注意关掉代理。

**改了内容没更新** — GitHub Pages 有 CDN 缓存，改完 push 后等一两分钟，强制刷新（Cmd+Shift+R）。

**想换仓库名** — `REPO_NAME=myrepo ./deploy.sh aking.com`
