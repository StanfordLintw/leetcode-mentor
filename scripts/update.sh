#!/bin/bash
# ============================================================
#  LeetCode Mentor — 更新腳本
#  用法：bash /opt/leetcode-mentor/scripts/update.sh
# ============================================================

set -e

APP_DIR="/opt/leetcode-mentor"
APP_USER="leetcode"

GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }

info "停止服務..."
systemctl stop leetcode-mentor

info "拉取最新程式碼..."
cd "${APP_DIR}"
sudo -u "${APP_USER}" git pull origin main

info "安裝新套件..."
sudo -u "${APP_USER}" npm ci --legacy-peer-deps --silent

info "Prisma migrate..."
sudo -u "${APP_USER}" npx prisma generate
sudo -u "${APP_USER}" npx prisma migrate deploy 2>/dev/null || true

info "重新 Build..."
sudo -u "${APP_USER}" npm run build

info "啟動服務..."
systemctl start leetcode-mentor
sleep 2

systemctl is-active --quiet leetcode-mentor \
  && log "更新完成，服務正在運行 ✅" \
  || echo "服務啟動失敗，請檢查：journalctl -u leetcode-mentor -n 50"
