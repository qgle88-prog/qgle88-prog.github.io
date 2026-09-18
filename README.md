# akrobot.cn — 个人主页

一个纯静态的个人主页：无框架、无构建步骤、无依赖。三个文件，扔到任何静态托管上都能跑。

- 自动跟随系统深浅色，右上角按钮可手动切换（跟随系统 → 浅色 → 深色，循环）
- 内置滚动动画、导航高亮、邮箱一键复制
- 响应式，手机端可用
- 深海军蓝 + 青色配色

## 当前部署状态

| 项 | 值 |
|---|---|
| GitHub 账号 | `qgle88-prog` |
| 仓库 | `qgle88-prog/qgle88-prog.github.io` |
| 分支 / 目录 | `main` / `/ (root)` |
| 自定义域名 | `akrobot.cn` |
| 默认地址 | https://qgle88-prog.github.io/ |
| DNS 服务商 | 阿里云（万网，NS = `dns1/dns2.hichina.com`） |

## 文件结构

```
.
├── index.html          主页面（所有内容都在这里）
├── 404.html            404 页面
├── assets/
│   ├── style.css       样式（配色变量集中在文件顶部）
│   └── main.js         主题切换、滚动动画、复制按钮
├── CNAME               自定义域名（内容为 akrobot.cn）
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

## 重新部署

```bash
./deploy.sh              # 只推送，保持现有域名
./deploy.sh akrobot.cn   # 推送并确认域名绑定
```

脚本会自动：检查登录状态 → 初始化 git → 创建仓库 → 推送 → 开启 Pages →
绑定域名。**可以重复执行**，已完成的步骤会自动跳过。改完内容跑一次就行。

---

# 绑定域名 akrobot.cn（待完成）

GitHub 端已经绑好了（仓库 Settings → Pages 里 Custom domain 已填 `akrobot.cn`）。
**剩下的是在阿里云加 DNS 记录。**

## 第一步：删掉旧的 A 记录 ⚠️

当前 `akrobot.cn` 上有一条旧记录，指向阿里云的默认页：

```
@    A    60.205.34.132      ← 必须删掉
```

登录 **阿里云** → 控制台 → **域名** → `akrobot.cn` → **解析设置**，
找到上面这条记录，**删除**它。

> 这一步不能省。如果只加新记录不删旧记录，域名会随机在阿里云和 GitHub 之间跳，
> 访问时好时坏，而且 HTTPS 证书永远签发不下来。

## 第二步：添加这 5 条记录

在同一个「解析设置」页面点「添加记录」，逐条添加：

| 记录类型 | 主机记录 | 解析线路 | 记录值 | TTL |
|---|---|---|---|---|
| A | `@` | 默认 | `185.199.108.153` | 10 分钟 |
| A | `@` | 默认 | `185.199.109.153` | 10 分钟 |
| A | `@` | 默认 | `185.199.110.153` | 10 分钟 |
| A | `@` | 默认 | `185.199.111.153` | 10 分钟 |
| CNAME | `www` | 默认 | `qgle88-prog.github.io` | 10 分钟 |

几点注意：

- **四条 A 记录一条都不能少。** 这是 GitHub Pages 的负载均衡地址池，
  少一条就会有一部分访问失败。
- 主机记录 `@` 在阿里云就填一个 `@` 字符，代表 `akrobot.cn` 本身。
- CNAME 的记录值**不要**加 `https://`、不要加结尾的点、不要加路径，
  就是干干净净的 `qgle88-prog.github.io`。
- 阿里云的 TTL 选项里选「10 分钟」，改起来生效快。

## 第三步：等生效

一般 **10 分钟到 1 小时**。用下面命令确认（把结果和上面的表对一下）：

```bash
dig +short akrobot.cn          # 应返回 185.199.108.153 ~ 111.153 四条
dig +short www.akrobot.cn      # 应返回 qgle88-prog.github.io
```

DNS 生效后，GitHub 会自动去申请 Let's Encrypt 免费证书，这又要几分钟到几小时。

## 第四步：开启强制 HTTPS

证书签发好（Pages 页面出现 "Enforce HTTPS" 可勾选框）之后，勾上它，
所有 HTTP 访问会自动跳转到 HTTPS。

也可以在仓库 Settings → Pages 页面手动操作。

## 验证清单

- [ ] 阿里云的旧 A 记录（60.205.34.132）已删除
- [ ] 四条 A 记录已添加
- [ ] www 的 CNAME 已添加
- [ ] `dig +short akrobot.cn` 返回四条 GitHub IP
- [ ] https://akrobot.cn 能打开主页
- [ ] https://www.akrobot.cn 也能打开
- [ ] 地址栏显示锁头图标（HTTPS 生效）

---

## 关于 .cn 域名和国内访问

**备案**：本站在 GitHub Pages 上，服务器在境外，**不需要 ICP 备案**。
只有当你想把网站搬到国内服务器（阿里云 ECS、腾讯云等）时才需要备案。

**访问速度**：GitHub Pages 的服务器在国外，中国大陆访问速度**不稳定**，
有时快有时慢，个别地区可能打不开。这是它的固有限制，不是配置问题。

如果国内访问速度很重要，可以考虑换成免费的 **腾讯云 EdgeOne Pages**
或 **Cloudflare Pages** —— 前者在国内有节点但需要备案，后者不需要备案、
国内访问通常比 GitHub Pages 稳一些。需要换的时候告诉我。

## 常见问题

**打开是 404** — 检查 Pages 设置里的分支是不是 `main`、目录是不是 `/ (root)`。
首次部署后要等 1–2 分钟。

**HTTPS 一直不可用** — 九成是 DNS 还没生效，先在终端 `dig` 确认。
另外确认阿里云那边**没有**多余的 A 记录残留。

**改了内容没更新** — GitHub Pages 有 CDN 缓存，push 后等一两分钟，强制刷新（Cmd+Shift+R）。

**想换仓库名** — `REPO_NAME=myrepo ./deploy.sh akrobot.cn`
