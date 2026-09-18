#!/usr/bin/env bash
# =============================================================================
# watch.sh — 监视本地文件改动，自动同步到线上
#
# 用法:
#   ./watch.sh              # 每 10 秒检查一次，有改动就自动发布
#   ./watch.sh 30           # 自定义检查间隔（秒）
#
# 保持这个终端窗口开着即可。按 Ctrl+C 停止。
#
# 为什么不用 fswatch：本机没装，而且轮询方式零依赖、行为可预测。
# 纯静态站才几十 KB，轮询的开销可以忽略。
# =============================================================================

set -uo pipefail

export PATH="/opt/homebrew/bin:$PATH"

INTERVAL="${1:-10}"
SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SITE_DIR"

if [ -t 1 ]; then
  C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_GRN=$'\033[32m'
  C_YEL=$'\033[33m'; C_CYN=$'\033[36m'; C_RED=$'\033[31m'
else
  C_RESET=""; C_DIM=""; C_GRN=""; C_YEL=""; C_CYN=""; C_RED=""
fi

log() { printf '%s[%s]%s %s\n' "$C_DIM" "$(date '+%H:%M:%S')" "$C_RESET" "$1"; }

printf '\n%s自动同步已启动%s\n' "$C_CYN" "$C_RESET"
printf '%s  目录   %s%s\n' "$C_DIM" "$SITE_DIR" "$C_RESET"
printf '%s  间隔   %s 秒\n' "$C_DIM" "$INTERVAL" "$C_RESET"
printf '%s  停止   %sCtrl+C\n\n' "$C_DIM" "$C_RESET"

# 用 git 的哈希当指纹：只要工作区有任何变化，哈希就会变
fingerprint() {
  git add -A >/dev/null 2>&1
  git write-tree 2>/dev/null || echo "empty"
}

LAST="$(fingerprint)"
log "初始状态已记录，等待改动…"

while true; do
  sleep "$INTERVAL"

  NOW="$(fingerprint)"
  [ "$NOW" = "$LAST" ] && continue

  # 有改动
  CHANGED="$(git diff --cached --name-only 2>/dev/null | head -10)"
  log "${C_YEL}检测到改动：${C_RESET}"
  echo "$CHANGED" | sed "s/^/         /"

  if printf '%s\n' "$CHANGED" | grep -qE '^\.workbuddy/'; then
    log "${C_RED}改动涉及 .workbuddy/，已跳过发布${C_RESET}"
    LAST="$(fingerprint)"
    continue
  fi

  log "正在发布…"
  if ./deploy.sh >/tmp/watch-deploy.log 2>&1; then
    log "${C_GRN}已发布${C_RESET}  https://akrobot.cn"
  else
    log "${C_RED}发布失败，详情见 /tmp/watch-deploy.log${C_RESET}"
    tail -15 /tmp/watch-deploy.log | sed 's/^/         /'
  fi

  LAST="$(fingerprint)"
done
