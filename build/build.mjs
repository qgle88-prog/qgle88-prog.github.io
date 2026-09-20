/**
 * =============================================================================
 * 构建脚本 —— 把 content/ 里的 Markdown 预渲染成静态 HTML
 *
 * 用法:  node build/build.mjs
 * 产出:  _site/   （完整站点，供 GitHub Pages 部署）
 *
 * 为什么用构建期预渲染而不是浏览器端渲染：
 *   1. 文章页有真实的 HTML，搜索引擎和分享卡片能正确读到内容
 *   2. 不依赖 GitHub API 拉列表，没有速率限制，打开也更快
 *   3. 国内访问时少一次跨境外请求
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_site');

const SITE = {
  domain: 'akrobot.cn',
  origin: 'https://akrobot.cn',
  name: 'Aking Huang',
  tagline: '写工具，然后分享',
  email: 'qgle@hotmail.com',
  github: 'https://github.com/qgle88-prog',
  githubLabel: 'github.com/qgle88-prog',
};

// 草稿默认不发布；本地调试时用 `BUILD_DRAFTS=1 node build/build.mjs` 带上
const INCLUDE_DRAFTS = process.env.BUILD_DRAFTS === '1';

marked.setOptions({ gfm: true, breaks: false });

/* ---------------------------------------------------------------- 工具 --- */

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function parseDate(input) {
  const raw = String(input ?? '').trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return { y: +m[1], mo: +m[2], d: +m[3], iso: `${m[1]}-${m[2]}-${m[3]}` };
  }
  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) {
    const iso = dt.toISOString().slice(0, 10);
    return { y: dt.getUTCFullYear(), mo: dt.getUTCMonth() + 1, d: dt.getUTCDate(), iso };
  }
  return { y: 1970, mo: 1, d: 1, iso: '1970-01-01' };
}

const humanDate = (d) => `${d.y} 年 ${d.mo} 月 ${d.d} 日`;

/** 归一到数组：CMS 从 YAML 读出来可能是 undefined / string / array */
function toArray(v) {
  if (Array.isArray(v)) return v.filter((x) => x !== null && x !== undefined && x !== '');
  if (v === null || v === undefined || v === '') return [];
  return [v];
}

/* ------------------------------------------------------ 读取内容集合 --- */

function readCollection(name) {
  const dir = path.join(ROOT, 'content', name);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, content } = matter(raw);
      const fallbackSlug = file.replace(/\.md$/, '');
      const date = parseDate(data.date);
      return {
        slug: (data.slug && String(data.slug).trim()) || fallbackSlug,
        file,
        data,
        date,
        title: data.title ? String(data.title) : '',
        summary: data.summary ? String(data.summary) : '',
        tags: toArray(data.tags),
        draft: data.draft === true,
        html: marked.parse(content || ''),
        plain: (content || '').replace(/\s+/g, ' ').trim(),
      };
    })
    .filter((e) => INCLUDE_DRAFTS || !e.draft)
    .sort((a, b) => b.date.iso.localeCompare(a.date.iso));
}

/* ---------------------------------------------------------- 图标 --- */

const ICONS = {
  bio: '<path d="M7 3v6a5 5 0 0 0 10 0V3"/><path d="M4 3h6M14 3h6"/><path d="M12 14v3a4 4 0 0 0 8 0v-1"/><circle cx="20" cy="13" r="2"/>',
  chart:
    '<path d="M3 20h18"/><rect x="4.5" y="11" width="3.4" height="6" rx="1"/><rect x="10.3" y="7" width="3.4" height="10" rx="1"/><rect x="16.1" y="13" width="3.4" height="4" rx="1"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  ai: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 9.5h8M8 13h5"/><circle cx="12" cy="17.5" r="1.4" fill="currentColor" stroke="none"/>',
  doc: '<path d="M13.5 3H7a2.5 2.5 0 0 0-2.5 2.5v13A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5V9z"/><path d="M13.5 3v6H19.5"/><path d="M9 14h6"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
  // 下载区专用
  package:
    '<path d="m7.5 4.3 9 5.2"/><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  folder: '<path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.6.8l1 1.4a2 2 0 0 0 1.6.8H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2Z"/>',
};

const ICONS_DL = {
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  external:
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
};

const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${
    ICONS[name] || ICONS.code
  }</svg>`;

// 下载按钮里的图标，线更粗一点，跟按钮文字重量对得上
const dlIcon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${
    ICONS_DL[name] || ICONS_DL.download
  }</svg>`;

const statusClass = (s) => ({ 使用中: 'live', 实验中: 'wip' })[String(s || '')] || '';

const arrowRight =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* --------------------------------------------------------- 页面骨架 --- */

const NAV = [
  { href: '/articles/', label: '文章', key: 'articles' },
  { href: '/works/', label: '作品', key: 'works' },
  { href: '/downloads/', label: '下载', key: 'downloads' },
  { href: '/notes/', label: '动态', key: 'notes' },
  { href: '/#about', label: '关于' },
  { href: '/#contact', label: '联系' },
];

const THEME_TOGGLE = `<button class="theme-toggle" type="button" aria-label="切换主题">
        <svg class="icon-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.8 6.8 0 0 0 11 11Z"/></svg>
      </button>`;

function layout({ title, description, body, canonical, active = '', jsonLd = '' }) {
  const fullTitle = title ? `${esc(title)} — ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const nav = NAV.map(
    (n) =>
      `<a href="${n.href}"${n.key === active ? ' class="active" aria-current="page"' : ''}>${n.label}</a>`
  ).join('\n        ');

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme-mode="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fullTitle}</title>
<meta name="description" content="${esc(description || '')}">
<meta name="author" content="${SITE.name}">
<meta name="theme-color" content="#080E1A" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#F6F9FC" media="(prefers-color-scheme: light)">
<link rel="canonical" href="${SITE.origin}${canonical}">
<meta property="og:type" content="${active === 'articles' && canonical.startsWith('/articles/') && canonical !== '/articles/' ? 'article' : 'website'}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${fullTitle}">
<meta property="og:description" content="${esc(description || '')}">
<meta property="og:url" content="${SITE.origin}${canonical}">
<meta property="og:locale" content="zh_CN">
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="${SITE.name}" href="/feed.xml">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230D9488'/><text y='72' x='50' text-anchor='middle' font-size='58' font-family='monospace' font-weight='bold' fill='%2304211E'>A</text></svg>">
<link rel="stylesheet" href="/assets/style.css">
<!-- 动画元素默认 opacity:0，靠 main.js 加 .in 显现。
     万一 JS 没加载成功，这里是兜底，否则整页内容会全部看不见 -->
<noscript><style>.reveal{opacity:1 !important;transform:none !important}</style></noscript>
${jsonLd}
</head>
<body>

<a class="skip" href="#main">跳到主要内容</a>

<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/">
      <span class="mark" aria-hidden="true">A</span>
      <span>${SITE.name} <span class="sub">/ 写工具的人</span></span>
    </a>
    <nav class="nav" aria-label="主导航">
        ${nav}
    </nav>
    <div class="header-actions">${THEME_TOGGLE}</div>
  </div>
</header>

<main id="main">
${body}
</main>

<footer class="site-footer">
  <div class="wrap footer-inner">
    <span>© <span id="year">${new Date().getFullYear()}</span> ${SITE.name}</span>
    <span class="footer-links">
      <a href="/articles/">文章</a>
      <a href="/works/">作品</a>
      <a href="/downloads/">下载</a>
      <a href="/notes/">动态</a>
      <a href="/#about">关于</a>
      <a href="/feed.xml">RSS</a>
    </span>
  </div>
</footer>

<script src="/assets/main.js"></script>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
`;
}

/* ------------------------------------------------------- 片段生成器 --- */

function articleItem(a) {
  return `      <a class="post-item reveal" href="/articles/${esc(a.slug)}/">
        <div class="meta">
          <time class="date" datetime="${a.date.iso}">${humanDate(a.date)}</time>
        </div>
        <h2>${esc(a.title)}</h2>
        ${a.summary ? `<p>${esc(a.summary)}</p>` : ''}
        ${
          a.tags.length
            ? `<ul class="tag-list">${a.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
            : ''
        }
      </a>`;
}

function worksGridInner(works, limit = 0) {
  const list = limit > 0 ? works.slice(0, limit) : works;
  return list
    .map(
      (w) => `      <article class="card reveal">
        <div class="card-top">
          <div class="card-icon" aria-hidden="true">${icon(w.data.icon)}</div>
          <span class="tag ${statusClass(w.data.status)}">${esc(w.data.status || '使用中')}</span>
        </div>
        <h3>${esc(w.title)}</h3>
        ${w.summary ? `<p>${esc(w.summary)}</p>` : ''}
        ${
          w.data.stack && toArray(w.data.stack).length
            ? `<ul class="stack">${toArray(w.data.stack)
                .map((s) => `<li>${esc(s)}</li>`)
                .join('')}</ul>`
            : ''
        }
        <a class="card-link" href="/works/${esc(w.slug)}/">了解详情 ${arrowRight}</a>
      </article>`
    )
    .join('\n');
}

function latestNotes(articles) {
  return articles
    .slice(0, 3)
    .map(
      (a) => `      <a class="note" href="/articles/${esc(a.slug)}/">
        <span class="date">${a.date.iso.slice(0, 7)}</span>
        <span class="title">${esc(a.title)}${
          a.summary ? ` <span>— ${esc(a.summary)}</span>` : ''
        }</span>
      </a>`
    )
    .join('\n');
}

/* ------------------------------------------------------- 下载区片段 --- */

const DL_ICON_BY_CATEGORY = {
  脚本: 'code',
  软件: 'package',
  数据集: 'chart',
  模板: 'doc',
  其他: 'folder',
};

const IS_EXTERNAL = (href) => /^(https?:)?\/\//i.test(href) || href.startsWith('mailto:');

/** 站内文件自动算体积；外链返回空 */
function localFileSize(href) {
  if (!href || IS_EXTERNAL(href) || href.startsWith('/#')) return '';
  try {
    const abs = path.join(ROOT, href.replace(/^\//, ''));
    const bytes = fs.statSync(abs).size;
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  } catch {
    return '';
  }
}

/**
 * 决定一个下载项指向哪里。
 * CMS 里的 file 字段可能存成 `assets/uploads/x.zip`，也可能存成 `/assets/uploads/x.zip`，
 * 这里统一规范化成站内绝对路径。file 优先，没有才用外链。
 */
function resolveDownload(d) {
  const rawFile = d.data.file ? String(d.data.file).trim() : '';
  const rawLink = d.data.link ? String(d.data.link).trim() : '';

  if (rawFile) {
    if (IS_EXTERNAL(rawFile)) return { href: rawFile, external: true, size: '' };
    return {
      href: `/${rawFile.replace(/^\.?\//, '')}`,
      external: false,
      size: localFileSize(`/${rawFile.replace(/^\.?\//, '')}`),
    };
  }
  if (rawLink) {
    return { href: rawLink, external: IS_EXTERNAL(rawLink), size: '' };
  }
  return { href: '', external: false, size: '' };
}

/** 把一条下载项加工成渲染需要的形状 */
function prepareDownload(d) {
  const target = resolveDownload(d);
  const category = String(d.data.category || '其他');
  return {
    ...d,
    category,
    iconName: DL_ICON_BY_CATEGORY[category] || 'folder',
    version: d.data.version ? String(d.data.version).trim() : '',
    platform: d.data.platform ? String(d.data.platform).trim() : '',
    href: target.href,
    external: target.external,
    size: target.size || (d.data.size ? String(d.data.size).trim() : ''),
  };
}

/** 卡片上的元信息行：版本 / 平台 / 体积 / 更新日期 */
function dlMeta(d) {
  const cells = [
    d.version ? ['版本', d.version] : null,
    d.platform ? ['平台', d.platform] : null,
    d.size ? ['大小', d.size] : null,
    ['更新', d.date.iso],
  ].filter(Boolean);

  return `        <ul class="dl-meta">
${cells
  .map(([k, v]) => `          <li><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></li>`)
  .join('\n')}
        </ul>`;
}

/** 下载按钮：站内文件带 download 属性直接存盘，外链新窗口打开 */
function dlButton(d, { compact = false } = {}) {
  if (!d.href) {
    return `        <span class="dl-btn dl-btn-off">尚未提供下载</span>`;
  }
  const attrs = d.external
    ? ` target="_blank" rel="noopener noreferrer"`
    : ' download';
  const label = compact ? '下载' : d.external ? '前往下载' : '下载文件';
  const iconName = d.external ? 'external' : 'download';
  return `        <a class="dl-btn" href="${esc(d.href)}"${attrs}>${dlIcon(iconName)}${label}</a>`;
}

function downloadItem(d) {
  return `      <article class="card dl-card reveal">
        <div class="card-top">
          <div class="card-icon" aria-hidden="true">${icon(d.iconName)}</div>
          <span class="tag">${esc(d.category)}</span>
        </div>
        <h3>${esc(d.title)}</h3>
        ${d.summary ? `<p>${esc(d.summary)}</p>` : ''}
${dlMeta(d)}
        <div class="dl-actions">
${dlButton(d, { compact: true })}
          <a class="card-link" href="/downloads/${esc(d.slug)}/">详情 ${arrowRight}</a>
        </div>
      </article>`;
}

function downloadsGridInner(downloads, limit = 0) {
  const list = (limit > 0 ? downloads.slice(0, limit) : downloads).map(prepareDownload);
  return list.map(downloadItem).join('\n');
}

/* --------------------------------------------------------- 构建流程 --- */

console.log('\n构建开始\n');

const articles = readCollection('articles');
const works = readCollection('works');
const notes = readCollection('notes');
const downloads = readCollection('downloads');
console.log(
  `  内容：文章 ${articles.length} · 作品 ${works.length} · 动态 ${notes.length} · 下载 ${downloads.length}`
);
if (INCLUDE_DRAFTS) console.log('  （含草稿）');

/* --- 1. 清理并复制静态资源 --- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const COPY_FILES = ['404.html', 'robots.txt', 'CNAME', '.nojekyll'];
for (const f of COPY_FILES) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, f));
}
for (const d of ['assets', 'admin']) {
  const src = path.join(ROOT, d);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(OUT, d), { recursive: true });
}
console.log('  静态资源：已复制');

/* --- 2. 首页：注入作品网格与最新文章 --- */
let home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

if (home.includes('<!-- BUILD:WORKS -->')) {
  home = home.replace('<!-- BUILD:WORKS -->', worksGridInner(works, 6) || '');
} else {
  console.warn('  ! index.html 缺少 <!-- BUILD:WORKS --> 标记，作品未注入首页');
}
if (home.includes('<!-- BUILD:LATEST -->')) {
  home = home.replace('<!-- BUILD:LATEST -->', latestNotes(articles) || '');
} else {
  console.warn('  ! index.html 缺少 <!-- BUILD:LATEST --> 标记，最新文章未注入首页');
}
if (home.includes('<!-- BUILD:DOWNLOADS -->')) {
  home = home.replace('<!-- BUILD:DOWNLOADS -->', downloadsGridInner(downloads, 3) || '');
} else {
  console.warn('  ! index.html 缺少 <!-- BUILD:DOWNLOADS --> 标记，下载未注入首页');
}
fs.writeFileSync(path.join(OUT, 'index.html'), home);

/* --- 3. 文章列表 --- */
const articlesListBody = `
<section class="page-head">
  <div class="wrap">
    <span class="kicker">Articles</span>
    <h1>文章</h1>
    <p>踩过的坑、想明白的事，以及一些没什么用但挺有意思的记录。</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${
      articles.length
        ? `<div class="post-list">\n${articles.map(articleItem).join('\n')}\n    </div>`
        : '<div class="empty">还没有文章。到 <a href="/admin/">后台</a> 写第一篇吧。</div>'
    }
  </div>
</section>`;

fs.mkdirSync(path.join(OUT, 'articles'), { recursive: true });
fs.writeFileSync(
  path.join(OUT, 'articles/index.html'),
  layout({
    title: '文章',
    description: 'Aking Huang 的文章：自动化、大模型工作流、工程判断与研发实践。',
    canonical: '/articles/',
    active: 'articles',
    body: articlesListBody,
  })
);

/* --- 4. 文章详情 --- */
for (const a of articles) {
  const dir = path.join(OUT, 'articles', a.slug);
  fs.mkdirSync(dir, { recursive: true });
  const body = `
<section class="page-head">
  <div class="wrap">
    <a class="crumb" href="/articles/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>全部文章</a>
    <h1>${esc(a.title)}</h1>
    ${
      a.summary
        ? `<p>${esc(a.summary)}</p>`
        : ''
    }
  </div>
</section>

<div class="wrap article-wrap">
  <article class="prose reveal">
${a.html}
  </article>
  <aside class="article-aside">
    <div class="aside-block">
      <dt>发布日期</dt>
      <dd><time datetime="${a.date.iso}">${humanDate(a.date)}</time></dd>
    </div>
    ${
      a.tags.length
        ? `<div class="aside-block"><dt>标签</dt><dd><ul class="tag-list">${a.tags
            .map((t) => `<li>${esc(t)}</li>`)
            .join('')}</ul></dd></div>`
        : ''
    }
    <div class="aside-block">
      <dt>找我有事</dt>
      <dd><a href="mailto:${SITE.email}">${SITE.email}</a></dd>
    </div>
    <div class="aside-block">
      <dt>返回</dt>
      <dd><a href="/articles/">全部文章</a></dd>
    </div>
  </aside>
</div>`;

  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    datePublished: a.date.iso,
    author: { '@type': 'Person', name: SITE.name },
    description: a.summary || a.plain.slice(0, 160),
    mainEntityOfPage: `${SITE.origin}/articles/${a.slug}/`,
  })}</script>`;

  fs.writeFileSync(
    path.join(dir, 'index.html'),
    layout({
      title: a.title,
      description: a.summary || a.plain.slice(0, 155),
      canonical: `/articles/${a.slug}/`,
      active: 'articles',
      body,
      jsonLd,
    })
  );
}

/* --- 5. 作品 --- */
const worksBody = `
<section class="page-head">
  <div class="wrap">
    <span class="kicker">Works</span>
    <h1>作品</h1>
    <p>基本都是「自己痛过，所以自己解决」的产物。能公开的就放上来。</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${
      works.length
        ? `<div class="works-grid">\n${worksGridInner(works)}\n    </div>`
        : '<div class="empty">还没有作品。到 <a href="/admin/">后台</a> 添加第一个吧。</div>'
    }
  </div>
</section>`;

fs.mkdirSync(path.join(OUT, 'works'), { recursive: true });
fs.writeFileSync(
  path.join(OUT, 'works/index.html'),
  layout({
    title: '作品',
    description: 'Aking Huang 做的工具与项目：数据脚本、流程自动化、大模型工作流。',
    canonical: '/works/',
    active: 'works',
    body: worksBody,
  })
);

/* --- 6. 作品详情 --- */
for (const w of works) {
  const dir = path.join(OUT, 'works', w.slug);
  fs.mkdirSync(dir, { recursive: true });
  const stack = toArray(w.data.stack);
  const body = `
<section class="page-head">
  <div class="wrap">
    <a class="crumb" href="/works/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>全部作品</a>
    <h1>${esc(w.title)}</h1>
    ${w.summary ? `<p>${esc(w.summary)}</p>` : ''}
  </div>
</section>

<div class="wrap article-wrap">
  <article class="prose reveal">
${w.html || `<p>${esc(w.summary)}</p>`}
  </article>
  <aside class="article-aside">
    <div class="aside-block">
      <dt>状态</dt>
      <dd>${esc(w.data.status || '使用中')}</dd>
    </div>
    <div class="aside-block">
      <dt>日期</dt>
      <dd><time datetime="${w.date.iso}">${humanDate(w.date)}</time></dd>
    </div>
    ${
      stack.length
        ? `<div class="aside-block"><dt>技术栈</dt><dd><ul class="tag-list">${stack
            .map((s) => `<li>${esc(s)}</li>`)
            .join('')}</ul></dd></div>`
        : ''
    }
    ${
      w.data.link
        ? `<div class="aside-block"><dt>链接</dt><dd><a href="${esc(w.data.link)}" target="_blank" rel="noopener noreferrer">${esc(w.data.link)}</a></dd></div>`
        : ''
    }
    <div class="aside-block">
      <dt>返回</dt>
      <dd><a href="/works/">全部作品</a></dd>
    </div>
  </aside>
</div>`;

  fs.writeFileSync(
    path.join(dir, 'index.html'),
    layout({
      title: w.title,
      description: w.summary || w.plain.slice(0, 155),
      canonical: `/works/${w.slug}/`,
      active: 'works',
      body,
    })
  );
}

/* --- 7. 下载区 --- */
const downloadsBody = `
<section class="page-head">
  <div class="wrap">
    <span class="kicker">Downloads</span>
    <h1>下载</h1>
    <p>整理好、有说明、能直接拿去用的东西。每个包里都写了用法和已知边界，不藏坑。</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${
      downloads.length
        ? `<div class="dl-grid">\n${downloadsGridInner(downloads)}\n    </div>`
        : '<div class="empty">还没有可下载的内容。到 <a href="/admin/">后台</a> 添加第一个吧。</div>'
    }
  </div>
</section>`;

fs.mkdirSync(path.join(OUT, 'downloads'), { recursive: true });
fs.writeFileSync(
  path.join(OUT, 'downloads/index.html'),
  layout({
    title: '下载',
    description:
      'Aking Huang 整理的下载：自动化脚本、小工具、文档模板与示例数据集，附用法说明与已知边界。',
    canonical: '/downloads/',
    active: 'downloads',
    body: downloadsBody,
  })
);

/* --- 7b. 下载详情 --- */
for (const raw of downloads) {
  const d = prepareDownload(raw);
  const dir = path.join(OUT, 'downloads', d.slug);
  fs.mkdirSync(dir, { recursive: true });

  const sourceNote = !d.href
    ? '还没打包好，暂时拿不到。想要的话发邮件给我。'
    : d.external
      ? '托管在站外，点击后会在新窗口打开。'
      : '站内直链，点击直接下载。';

  const body = `
<section class="page-head">
  <div class="wrap">
    <a class="crumb" href="/downloads/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>全部下载</a>
    <h1>${esc(d.title)}</h1>
    ${d.summary ? `<p>${esc(d.summary)}</p>` : ''}
    <div class="dl-hero">
${dlButton(d)}
      <span class="dl-hero-note">${esc(sourceNote)}</span>
    </div>
  </div>
</section>

<div class="wrap article-wrap">
  <article class="prose reveal">
${d.html || `<p>${esc(d.summary)}</p>`}
  </article>
  <aside class="article-aside">
    <div class="aside-block">
      <dt>分类</dt>
      <dd>${esc(d.category)}</dd>
    </div>
    ${
      d.version
        ? `<div class="aside-block"><dt>版本</dt><dd>${esc(d.version)}</dd></div>`
        : ''
    }
    ${
      d.platform
        ? `<div class="aside-block"><dt>适用平台</dt><dd>${esc(d.platform)}</dd></div>`
        : ''
    }
    ${d.size ? `<div class="aside-block"><dt>文件大小</dt><dd>${esc(d.size)}</dd></div>` : ''}
    <div class="aside-block">
      <dt>更新日期</dt>
      <dd><time datetime="${d.date.iso}">${humanDate(d.date)}</time></dd>
    </div>
    ${
      d.external
        ? `<div class="aside-block"><dt>下载位置</dt><dd><a href="${esc(
            d.href
          )}" target="_blank" rel="noopener noreferrer">站外链接</a></dd></div>`
        : ''
    }
    <div class="aside-block">
      <dt>有问题</dt>
      <dd><a href="mailto:${SITE.email}">${SITE.email}</a></dd>
    </div>
    <div class="aside-block">
      <dt>返回</dt>
      <dd><a href="/downloads/">全部下载</a></dd>
    </div>
  </aside>
</div>`;

  fs.writeFileSync(
    path.join(dir, 'index.html'),
    layout({
      title: d.title,
      description: d.summary || d.plain.slice(0, 155),
      canonical: `/downloads/${d.slug}/`,
      active: 'downloads',
      body,
    })
  );
}

/* --- 8. 动态流 --- */
const notesBody = `
<section class="page-head">
  <div class="wrap">
    <span class="kicker">Notes</span>
    <h1>动态</h1>
    <p>短更新。进展、随手记、一句话想法。</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${
      notes.length
        ? `<div class="stream">\n${notes
            .map(
              (n) => `      <article class="stream-item reveal">
        <div class="stream-card">
          <div class="head">
            <time class="date" datetime="${n.date.iso}">${humanDate(n.date)}</time>
            ${n.title ? `<span class="badge">${esc(n.title)}</span>` : ''}
          </div>
          <div class="body">
${n.html}
          </div>
          ${
            n.data.image ? `<img src="${esc(n.data.image)}" alt="" loading="lazy">` : ''
          }
          ${
            n.tags.length
              ? `<ul class="tag-list" style="margin-top:14px">${n.tags
                  .map((t) => `<li>${esc(t)}</li>`)
                  .join('')}</ul>`
              : ''
          }
        </div>
      </article>`
            )
            .join('\n')}\n    </div>`
        : '<div class="empty">还没有动态。到 <a href="/admin/">后台</a> 发一条吧。</div>'
    }
  </div>
</section>`;

fs.mkdirSync(path.join(OUT, 'notes'), { recursive: true });
fs.writeFileSync(
  path.join(OUT, 'notes/index.html'),
  layout({
    title: '动态',
    description: 'Aking Huang 的短更新：进展、随手记、一句话想法。',
    canonical: '/notes/',
    active: 'notes',
    body: notesBody,
  })
);

/* --- 9. sitemap --- */
const urls = [
  { loc: '/', pri: '1.0' },
  { loc: '/articles/', pri: '0.8' },
  { loc: '/works/', pri: '0.8' },
  { loc: '/downloads/', pri: '0.8' },
  { loc: '/notes/', pri: '0.7' },
  ...articles.map((a) => ({ loc: `/articles/${a.slug}/`, pri: '0.6', lastmod: a.date.iso })),
  ...works.map((w) => ({ loc: `/works/${w.slug}/`, pri: '0.6', lastmod: w.date.iso })),
  ...downloads.map((d) => ({ loc: `/downloads/${d.slug}/`, pri: '0.6', lastmod: d.date.iso })),
];
fs.writeFileSync(
  path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${SITE.origin}${u.loc}</loc>${
        u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''
      }<priority>${u.pri}</priority></url>`
  )
  .join('\n')}
</urlset>
`
);

/* --- 10. robots 指向 sitemap --- */
fs.writeFileSync(
  path.join(OUT, 'robots.txt'),
  `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${SITE.origin}/sitemap.xml
`
);

/* --- 11. RSS --- */
const rssItems = articles
  .slice(0, 20)
  .map(
    (a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${SITE.origin}/articles/${a.slug}/</link>
      <guid isPermaLink="true">${SITE.origin}/articles/${a.slug}/</guid>
      <pubDate>${new Date(`${a.date.iso}T00:00:00Z`).toUTCString()}</pubDate>
      ${a.summary ? `<description>${esc(a.summary)}</description>` : ''}
    </item>`
  )
  .join('\n');

fs.writeFileSync(
  path.join(OUT, 'feed.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE.name} — ${SITE.tagline}</title>
    <link>${SITE.origin}/</link>
    <description>${SITE.name} 的文章</description>
    <language>zh-CN</language>
    <atom:link href="${SITE.origin}/feed.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>
`
);

/* --- 汇总 --- */
const count = (p) => {
  if (!fs.existsSync(p)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    if (e.isDirectory()) n += count(path.join(p, e.name));
    else n += 1;
  }
  return n;
};

console.log(`  产出文件：${count(OUT)} 个 → _site/`);
console.log('\n构建完成\n');
