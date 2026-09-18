#!/usr/bin/env bash
# =============================================================================
# deploy.sh — 把本站发布到 GitHub Pages，并（可选）绑定自定义域名
#
# 用法:
#   ./deploy.sh                    # 只发布，使用默认仓库 <用户名>.github.io
#   ./deploy.sh aking.com          # 发布并绑定 aking.com
#   ./deploy.sh www.aking.com      # 发布并绑定 www.aking.com
#
# 前置条件:
#   1. 已安装 gh 与 git
#   2. 已执行过 gh auth login（脚本会检查）
#
# 幂等：可重复执行。已存在的仓库 / 已开启的 Pages / 相同的 CNAME 都会被跳过。
# =============================================================================

set -euo pipefail

export PATH="/opt/homebrew/bin:$PATH"

# --- 0. 颜色与日志 ----------------------------------------------------------
if [ -t 1 ]; then
  C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_GRN=$'\033[32m'
  C_YEL=$'\033[33m'; C_RED=$'\033[31m'; C_CYN=$'\033[36m'
else
  C_RESET=""; C_DIM=""; C_GRN=""; C_YEL=""; C_RED=""; C_CYN=""
fi

step() { printf '%s==>%s %s\n' "$C_CYN" "$C_RESET" "$1"; }
ok()   { printf '  %s✓%s %s\n' "$C_GRN" "$C_RESET" "$1"; }
warn() { printf '  %s!%s %s\n' "$C_YEL" "$C_RESET" "$1"; }
die()  { printf '  %s✗%s %s\n' "$C_RED" "$C_RESET" "$1" >&2; exit 1; }

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SITE_DIR"

DOMAIN="${1:-}"
DOMAIN_FROM_CNAME=0

# 没传域名参数时，沿用 CNAME 文件里已绑定的域名，
# 避免日常更新时忘记带参数、把域名配置漏掉
if [ -z "$DOMAIN" ] && [ -f CNAME ] && [ -s CNAME ]; then
  DOMAIN="$(head -1 CNAME | tr -d '[:space:]')"
  DOMAIN_FROM_CNAME=1
fi

printf '\n%s个人主页发布%s  %s%s%s\n\n' "$C_CYN" "$C_RESET" "$C_DIM" "$SITE_DIR" "$C_RESET"

# --- 1. 依赖检查 ------------------------------------------------------------
step "检查依赖"
command -v git >/dev/null 2>&1 || die "未找到 git"
ok "git $(git --version | awk '{print $3}')"

command -v gh >/dev/null 2>&1 || die "未找到 gh。请先运行: brew install gh"
ok "gh $(gh --version | head -1 | awk '{print $3}')"

gh auth status >/dev/null 2>&1 || die "未登录 GitHub。请先运行: gh auth login --web"
GH_USER="$(gh api user --jq .login 2>/dev/null)" || die "无法读取 GitHub 用户名"
ok "已登录为 ${C_CYN}${GH_USER}${C_RESET}"

# --- 1.5 安全检查：绝不把内部目录推上公开仓库 -------------------------------
step "安全检查"
if [ ! -f .gitignore ] || ! grep -q '^\.workbuddy/' .gitignore 2>/dev/null; then
  printf '.workbuddy/\n' >> .gitignore
  ok "已补写 .gitignore（忽略 .workbuddy/）"
else
  ok ".gitignore 已包含 .workbuddy/"
fi

# 万一历史上被追踪过，这里再兜一层，避免 git add -A 又把它捞回来
if git ls-files --error-unmatch .workbuddy >/dev/null 2>&1; then
  git rm -r --cached .workbuddy -q
  warn "检测到 .workbuddy 曾被追踪，已从索引移除（防止内部笔记被发布）"
else
  ok ".workbuddy 未被 git 追踪"
fi

# 兜底：列出即将提交的文件，若含敏感目录则直接中止
STAGED_SENSITIVE="$(git ls-files | grep -E '^\.workbuddy/' || true)"
if [ -n "$STAGED_SENSITIVE" ]; then
  die "中止：以下内部文件仍在版本控制中，拒绝发布：\n$STAGED_SENSITIVE"
fi

# --- 2. 仓库名 --------------------------------------------------------------
# 用 <用户名>.github.io 作为仓库名，得到最干净的 Pages 地址
REPO_NAME="${REPO_NAME:-${GH_USER}.github.io}"
REPO_FULL="${GH_USER}/${REPO_NAME}"
step "目标仓库"
ok "${REPO_FULL}"

# --- 3. 初始化本地仓库 ------------------------------------------------------
step "准备 git 仓库"
if [ ! -d .git ]; then
  git init -q -b main
  ok "已初始化 main 分支"
else
  # 确保当前分支是 main
  CUR_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if [ "$CUR_BRANCH" != "main" ]; then
    git branch -M main 2>/dev/null || true
    ok "分支已重命名为 main"
  else
    ok "已在 main 分支"
  fi
fi

if ! git config user.email >/dev/null 2>&1; then
  git config user.email "${GH_USER}@users.noreply.github.com"
  ok "已设置本地 user.email"
fi
if ! git config user.name >/dev/null 2>&1; then
  git config user.name "$GH_USER"
  ok "已设置本地 user.name"
fi

# --- 4. CNAME（自定义域名）--------------------------------------------------
if [ -n "$DOMAIN" ]; then
  step "写入 CNAME 文件"
  if [ "$DOMAIN_FROM_CNAME" = "1" ]; then
    ok "沿用现有域名 ${DOMAIN}（来自 CNAME 文件）"
  else
    printf '%s\n' "$DOMAIN" > CNAME
    ok "CNAME → ${DOMAIN}"
  fi
else
  warn "未指定域名，跳过 CNAME（之后可用 ./deploy.sh <域名> 补上）"
fi

# --- 5. 提交 ----------------------------------------------------------------
step "提交改动"
git add -A
if git diff --cached --quiet; then
  ok "没有新改动需要提交"
else
  git commit -q -m "Deploy personal homepage $(date '+%Y-%m-%d %H:%M')"
  ok "已创建提交 $(git rev-parse --short HEAD)"
fi

# --- 6. 创建远端仓库 --------------------------------------------------------
step "配置远端仓库"
if gh repo view "$REPO_FULL" >/dev/null 2>&1; then
  ok "远端仓库已存在"
else
  gh repo create "$REPO_FULL" --public --description "Personal homepage" >/dev/null
  ok "已创建远端仓库"
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "https://github.com/${REPO_FULL}.git"
  ok "origin 已更新"
else
  git remote add origin "https://github.com/${REPO_FULL}.git"
  ok "origin 已添加"
fi

# --- 7. 推送 ----------------------------------------------------------------
step "推送到 GitHub"
git push -u origin main 2>&1 | sed 's/^/  /'
ok "推送完成"

# --- 8. 开启 GitHub Pages ---------------------------------------------------
step "开启 GitHub Pages"
if gh api "repos/${REPO_FULL}/pages" >/dev/null 2>&1; then
  ok "Pages 已启用"
  gh api --method PUT "repos/${REPO_FULL}/pages" \
    -f "build_type=legacy" \
    -f "source[branch]=main" \
    -f "source[path]=/" >/dev/null 2>&1 \
    && ok "Pages 源已确认为 main /" \
    || warn "Pages 源更新返回非零（通常无妨）"
else
  if gh api --method POST "repos/${REPO_FULL}/pages" \
      -f "build_type=legacy" \
      -f "source[branch]=main" \
      -f "source[path]=/" >/dev/null 2>&1; then
    ok "Pages 已开启（main 分支根目录）"
  else
    warn "自动开启失败，请手动到 Settings → Pages 选择 main / (root)"
  fi
fi

# --- 9. 绑定自定义域名 ------------------------------------------------------
if [ -n "$DOMAIN" ]; then
  step "在 GitHub 端绑定域名"
  if gh api --method PUT "repos/${REPO_FULL}/pages" -f "cname=${DOMAIN}" >/dev/null 2>&1; then
    ok "已绑定 ${DOMAIN}"
  else
    warn "绑定失败，请手动到 Settings → Pages → Custom domain 填入 ${DOMAIN}"
  fi
fi

# --- 10. 结果 ---------------------------------------------------------------
printf '\n%s%s 发布完成 %s\n\n' "$C_GRN" "$C_RESET" "$C_RESET"
printf '  默认地址   %shttps://%s.github.io/%s\n' "$C_CYN" "$GH_USER" "$([ "$REPO_NAME" = "${GH_USER}.github.io" ] && echo '' || echo "$REPO_NAME")"
[ -n "$DOMAIN" ] && printf '  自定义域名 %shttps://%s%s\n' "$C_CYN" "$DOMAIN" "$C_RESET"

cat <<EOF

${C_DIM}--- 接下来要在你的域名服务商处添加 DNS 记录 ---${C_RESET}

A 记录（绑定根域名，四条都要加）：
  @    A    185.199.108.153
  @    A    185.199.109.153
  @    A    185.199.110.153
  @    A    185.199.111.153

CNAME 记录（绑定 www 子域名）：
  www  CNAME  ${REPO_FULL%/*}.github.io

然后在 GitHub 仓库 Settings → Pages 勾选 "Enforce HTTPS"
（DNS 生效后可能需要等几分钟到几小时，证书才会签发）

EOF
