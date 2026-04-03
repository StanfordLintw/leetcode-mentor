#!/bin/bash
# ============================================================
#  LeetCode Mentor — LXC 一鍵部署腳本
#  適用：Ubuntu 22.04 LXC on Proxmox
#  用法：bash setup-lxc.sh
# ============================================================

set -e  # 任何指令失敗即中止

# ── 顏色輸出 ─────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── 設定區（可修改）─────────────────────────────────────────
APP_USER="leetcode"
APP_DIR="/opt/leetcode-mentor"
REPO_URL="https://github.com/StanfordLintw/leetcode-mentor.git"
DB_NAME="leetcode_mentor"
DB_USER="leetcode"
DB_PASS="$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 20)"
APP_PORT=3000
NODE_VERSION=20

# ── 0. 確認 root ─────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  fail "請用 root 執行：sudo bash setup-lxc.sh"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     LeetCode Mentor — LXC 部署開始          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. 系統更新 ──────────────────────────────────────────────
info "更新系統套件..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl git wget unzip build-essential ca-certificates gnupg lsb-release
log "系統更新完成"

# ── 2. 安裝 Node.js 20 LTS ───────────────────────────────────
info "安裝 Node.js ${NODE_VERSION} LTS..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - -qq
  apt-get install -y -qq nodejs
else
  warn "Node.js 已安裝：$(node -v)"
fi
log "Node.js 版本：$(node -v)，npm：$(npm -v)"

# ── 3. 安裝 PostgreSQL 15 ─────────────────────────────────────
info "安裝 PostgreSQL 15..."
if ! command -v psql &>/dev/null; then
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
  echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  apt-get update -qq
  apt-get install -y -qq postgresql-15
fi
systemctl enable --now postgresql
log "PostgreSQL 已啟動"

# ── 4. 建立資料庫與使用者 ─────────────────────────────────────
info "建立資料庫 ${DB_NAME}..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename='${DB_USER}'" \
  | grep -q 1 || sudo -u postgres psql -c \
  "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" \
  | grep -q 1 || sudo -u postgres psql -c \
  "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

sudo -u postgres psql -c \
  "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
log "資料庫建立完成"

# ── 5. 建立 app 使用者 ────────────────────────────────────────
info "建立系統使用者 ${APP_USER}..."
id "${APP_USER}" &>/dev/null || useradd -m -s /bin/bash "${APP_USER}"
log "使用者 ${APP_USER} 就緒"

# ── 6. Clone 專案 ─────────────────────────────────────────────
info "Clone 專案到 ${APP_DIR}..."
if [ -d "${APP_DIR}/.git" ]; then
  warn "目錄已存在，執行 git pull..."
  cd "${APP_DIR}" && sudo -u "${APP_USER}" git pull
else
  git clone "${REPO_URL}" "${APP_DIR}"
  chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
fi
log "程式碼已就緒"

# ── 7. 寫入 .env ──────────────────────────────────────────────
info "建立 .env 設定檔..."
cat > "${APP_DIR}/.env" <<EOF
# ── 資料庫 ──────────────────────────────────────────
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

# ── Judge0 程式執行（RapidAPI 免費方案）─────────────
# 請至 https://rapidapi.com/judge0-official/api/judge0-ce 取得
JUDGE0_API_KEY=your_judge0_rapidapi_key_here

# ── App ──────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME=LeetCode Mentor
NODE_ENV=production
PORT=${APP_PORT}

# ── 注意：AI 功能透過 Claude CLI 執行，不需要 API Key ──
# 部署完成後請執行：su - ${APP_USER} -c "claude login"
EOF
chown "${APP_USER}:${APP_USER}" "${APP_DIR}/.env"
chmod 600 "${APP_DIR}/.env"
log ".env 建立完成（Judge0 Key 請手動填入）"

# ── 8. 安裝 npm 依賴 ──────────────────────────────────────────
info "安裝 npm 套件（這需要幾分鐘）..."
cd "${APP_DIR}"
sudo -u "${APP_USER}" npm ci --legacy-peer-deps --silent
log "npm 套件安裝完成"

# ── 9. 安裝 Claude CLI ────────────────────────────────────────
info "安裝 Claude CLI..."
if ! command -v claude &>/dev/null; then
  npm install -g @anthropic-ai/claude-code --silent 2>/dev/null \
    || warn "Claude CLI 安裝失敗，請手動執行：npm install -g @anthropic-ai/claude-code"
else
  warn "Claude CLI 已安裝：$(claude --version 2>/dev/null || echo '已存在')"
fi
log "Claude CLI 就緒"

# ── 10. Prisma migrate + seed ─────────────────────────────────
info "建立資料表並匯入題目..."
cd "${APP_DIR}"
sudo -u "${APP_USER}" npx prisma generate
sudo -u "${APP_USER}" npx prisma migrate deploy 2>/dev/null \
  || sudo -u "${APP_USER}" npx prisma db push --accept-data-loss
sudo -u "${APP_USER}" npx prisma db seed 2>/dev/null \
  && log "30 題 seed 資料匯入完成" \
  || warn "Seed 失敗，請之後手動執行：cd ${APP_DIR} && npx prisma db seed"

# ── 11. Build Next.js ─────────────────────────────────────────
info "Build Next.js（這需要幾分鐘）..."
cd "${APP_DIR}"
sudo -u "${APP_USER}" npm run build
log "Build 完成"

# ── 12. 建立 systemd 服務 ─────────────────────────────────────
info "設定 systemd 服務..."
cat > /etc/systemd/system/leetcode-mentor.service <<EOF
[Unit]
Description=LeetCode Mentor App
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/node_modules/.bin/next start -p ${APP_PORT}
ExecStartPre=/usr/bin/npx next start -p ${APP_PORT} --help > /dev/null 2>&1 || true
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=leetcode-mentor
Environment=NODE_ENV=production
EnvironmentFile=${APP_DIR}/.env

[Install]
WantedBy=multi-user.target
EOF

# 修正 ExecStart 使用正確路徑
cat > /etc/systemd/system/leetcode-mentor.service <<EOF
[Unit]
Description=LeetCode Mentor App
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
ExecStart=$(which npm) start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=leetcode-mentor
Environment=NODE_ENV=production
EnvironmentFile=${APP_DIR}/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable leetcode-mentor
systemctl start leetcode-mentor
sleep 3
log "systemd 服務已啟動"

# ── 13. 取得本機 IP ───────────────────────────────────────────
LOCAL_IP=$(hostname -I | awk '{print $1}')

# ── 完成摘要 ──────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              🎉 部署完成！                          ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  App URL  :  ${GREEN}http://${LOCAL_IP}:${APP_PORT}${NC}"
echo -e "${CYAN}║${NC}  DB       :  ${DB_NAME} @ localhost"
echo -e "${CYAN}║${NC}  DB User  :  ${DB_USER}"
echo -e "${CYAN}║${NC}  DB Pass  :  ${YELLOW}${DB_PASS}${NC}  ← 請記下來！"
echo -e "${CYAN}║${NC}  App Dir  :  ${APP_DIR}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  ${RED}⚠ 必做：Claude CLI 登入（AI 功能需要）${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}su - ${APP_USER} -c \"claude login\"${NC}"
echo -e "${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  ${RED}⚠ 必做：填入 Judge0 API Key${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}nano ${APP_DIR}/.env${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  服務管理指令："
echo -e "${CYAN}║${NC}    systemctl status leetcode-mentor"
echo -e "${CYAN}║${NC}    systemctl restart leetcode-mentor"
echo -e "${CYAN}║${NC}    journalctl -u leetcode-mentor -f"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# 儲存 DB 密碼到安全位置
echo "DB_PASS=${DB_PASS}" > /root/.leetcode-mentor-secrets
chmod 600 /root/.leetcode-mentor-secrets
warn "DB 密碼已備份至 /root/.leetcode-mentor-secrets"
