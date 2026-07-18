#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="jenny-career-opportunity-h5"
APP_DIR="/opt/jenny-career-opportunity-h5"
APP_USER="jennyapp"
APP_HOME="/home/${APP_USER}"
REPO_URL="https://github.com/deveda799/jenny-career-opportunity-h5.git"
BRANCH="main"
OFFLINE_DEPLOY="${OFFLINE_DEPLOY:-0}"
PUBLIC_IP="175.178.174.40"
ENV_FILE="${APP_DIR}/.env.production"
ENV_EXAMPLE="${APP_DIR}/.env.production.example"
NGINX_SOURCE="${APP_DIR}/deploy/nginx/${APP_NAME}.conf"
NGINX_TARGET="/etc/nginx/conf.d/${APP_NAME}.conf"

log() {
  printf '\n[%s] %s\n' "$(date '+%F %T')" "$*"
}

fail() {
  printf '\n部署停止：%s\n' "$*" >&2
  exit 1
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    fail "请使用 sudo bash scripts/deploy-tencent-opencloudos.sh 运行。"
  fi
}

run_as_app() {
  runuser -u "${APP_USER}" -- env \
    HOME="${APP_HOME}" \
    PATH="/usr/local/bin:/usr/bin:/bin" \
    "$@"
}

install_system_dependencies() {
  log "安装 Git、curl、wget、Nginx 和系统工具"
  dnf install -y \
    git curl wget nginx ca-certificates \
    policycoreutils-python-utils

  if ! id "${APP_USER}" >/dev/null 2>&1; then
    useradd --create-home --home-dir "${APP_HOME}" --shell /bin/bash "${APP_USER}"
  fi

  log "检查 Node.js 20 LTS"
  local node_major=""
  if command -v node >/dev/null 2>&1; then
    node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
  fi
  if [[ "${node_major}" != "20" ]]; then
    dnf install -y nodejs npm || true
    if command -v node >/dev/null 2>&1; then
      node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
    fi
  fi
  if [[ "${node_major}" != "20" ]]; then
    local node_setup="/tmp/nodesource_setup_20.x.sh"
    curl -fsSL "https://rpm.nodesource.com/setup_20.x" -o "${node_setup}" \
      || fail "无法下载 Node.js 20 安装脚本，请检查服务器网络。"
    bash "${node_setup}"
    dnf install -y nodejs
  fi

  command -v node >/dev/null 2>&1 || fail "Node.js 安装失败。"
  command -v npm >/dev/null 2>&1 || dnf install -y npm
  node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
  [[ "${node_major}" == "20" ]] \
    || fail "需要 Node.js 20，当前版本为 $(node --version)。"

  log "安装 PM2"
  npm install --global pm2
  command -v pm2 >/dev/null 2>&1 || fail "PM2 安装失败。"
}

update_source() {
  install -d "$(dirname "${APP_DIR}")"

  if [[ -f "${APP_DIR}/package.json" ]] \
    && { [[ "${OFFLINE_DEPLOY}" == "1" ]] || [[ ! -d "${APP_DIR}/.git" ]]; }; then
    log "使用本地离线源码，跳过 GitHub"
    chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
    return
  fi

  if [[ "${OFFLINE_DEPLOY}" == "1" ]]; then
    fail "离线部署要求 ${APP_DIR} 中已有完整源码和 package.json。"
  fi

  log "拉取或更新 ${BRANCH} 分支"
  if [[ ! -e "${APP_DIR}" ]]; then
    install -d -o "${APP_USER}" -g "${APP_USER}" "${APP_DIR}"
    run_as_app git clone --branch "${BRANCH}" --single-branch \
      "${REPO_URL}" "${APP_DIR}"
  elif [[ -d "${APP_DIR}/.git" ]]; then
    chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
    run_as_app git -C "${APP_DIR}" fetch origin "${BRANCH}"
    run_as_app git -C "${APP_DIR}" checkout "${BRANCH}"
    run_as_app git -C "${APP_DIR}" pull --ff-only origin "${BRANCH}"
  else
    fail "${APP_DIR} 已存在但不是 Git 仓库，请先人工检查该目录。"
  fi
}

prepare_environment() {
  if [[ ! -f "${ENV_FILE}" ]]; then
    [[ -f "${ENV_EXAMPLE}" ]] \
      || fail "仓库缺少 .env.production.example。"
    cp "${ENV_EXAMPLE}" "${ENV_FILE}"
    chown "${APP_USER}:${APP_USER}" "${ENV_FILE}"
    chmod 600 "${ENV_FILE}"
    printf '\n已创建 %s。\n' "${ENV_FILE}"
    printf '请执行 sudo vi %s 填写真实密钥，然后重新运行本脚本。\n' "${ENV_FILE}"
    exit 2
  fi

  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a

  local required=(
    APP_MODE
    REQUIRE_LOGIN
    SHOW_USAGE_LIMIT
    ENABLE_POINTS
    ENABLE_AI_FOLLOWUP
    GLOBAL_DAILY_AI_LIMIT
    IP_HOURLY_AI_LIMIT
    NEXT_PUBLIC_SITE_URL
  )
  local missing=()
  local name value
  for name in "${required[@]}"; do
    value="${!name:-}"
    if [[ -z "${value}" || "${value}" == "<REDACTED>" ]]; then
      missing+=("${name}")
    fi
  done

  if (( ${#missing[@]} > 0 )); then
    printf '\n.env.production 中以下变量未填写：\n' >&2
    printf '  - %s\n' "${missing[@]}" >&2
    fail "请填写后重新运行部署脚本。AI_API_KEY 可以留空，留空时 Her Start 会进入演示模式。"
  fi

  if [[ -n "${AI_API_KEY:-}" ]]; then
    [[ -n "${AI_BASE_URL:-}" && -n "${AI_MODEL:-}" ]] \
      || fail "填写 AI_API_KEY 时，也必须填写 AI_BASE_URL 和 AI_MODEL。"
  fi

  chown "${APP_USER}:${APP_USER}" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
}

install_project_dependencies() {
  log "按 lockfile 安装项目依赖"
  if [[ -f "${APP_DIR}/package-lock.json" ]]; then
    run_as_app bash -c "cd '${APP_DIR}' && npm ci"
    PACKAGE_MANAGER="npm"
  elif [[ -f "${APP_DIR}/pnpm-lock.yaml" ]]; then
    command -v corepack >/dev/null 2>&1 || npm install --global corepack
    corepack enable
    run_as_app bash -c "cd '${APP_DIR}' && pnpm install --frozen-lockfile"
    PACKAGE_MANAGER="pnpm"
  elif [[ -f "${APP_DIR}/yarn.lock" ]]; then
    command -v corepack >/dev/null 2>&1 || npm install --global corepack
    corepack enable
    local yarn_major
    yarn_major="$(yarn --version | cut -d. -f1)"
    if [[ "${yarn_major}" == "1" ]]; then
      run_as_app bash -c "cd '${APP_DIR}' && yarn install --frozen-lockfile"
    else
      run_as_app bash -c "cd '${APP_DIR}' && yarn install --immutable"
    fi
    PACKAGE_MANAGER="yarn"
  else
    log "未发现 lockfile，使用 npm install"
    run_as_app bash -c "cd '${APP_DIR}' && npm install"
    PACKAGE_MANAGER="npm"
  fi
}

build_application() {
  log "构建 Next.js standalone 应用"
  case "${PACKAGE_MANAGER}" in
    npm) run_as_app bash -c "cd '${APP_DIR}' && npm run build" ;;
    pnpm) run_as_app bash -c "cd '${APP_DIR}' && pnpm run build" ;;
    yarn) run_as_app bash -c "cd '${APP_DIR}' && yarn build" ;;
  esac

  [[ -f "${APP_DIR}/.next/standalone/server.js" ]] \
    || fail "未生成 .next/standalone/server.js，请检查 next.config.ts。"

  run_as_app mkdir -p "${APP_DIR}/.next/standalone/.next"
  run_as_app rm -rf "${APP_DIR}/.next/standalone/.next/static"
  run_as_app cp -a \
    "${APP_DIR}/.next/static" \
    "${APP_DIR}/.next/standalone/.next/static"
  if [[ -d "${APP_DIR}/public" ]]; then
    run_as_app rm -rf "${APP_DIR}/.next/standalone/public"
    run_as_app cp -a \
      "${APP_DIR}/public" \
      "${APP_DIR}/.next/standalone/public"
  fi
  run_as_app cp "${ENV_FILE}" "${APP_DIR}/.next/standalone/.env.production"
}

start_pm2() {
  log "使用 PM2 启动 Next.js"
  run_as_app pm2 startOrReload "${APP_DIR}/ecosystem.config.js" --update-env
  run_as_app pm2 save

  pm2 startup systemd -u "${APP_USER}" --hp "${APP_HOME}" >/dev/null
  systemctl enable --now "pm2-${APP_USER}"
}

configure_nginx() {
  log "配置 Nginx 反向代理"
  [[ -f "${NGINX_SOURCE}" ]] || fail "缺少 Nginx 配置模板。"
  install -m 0644 "${NGINX_SOURCE}" "${NGINX_TARGET}"

  if command -v getenforce >/dev/null 2>&1 \
    && [[ "$(getenforce)" == "Enforcing" ]]; then
    setsebool -P httpd_can_network_connect 1
  fi

  if systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
  fi

  nginx -t
  systemctl enable --now nginx
  systemctl reload nginx
}

check_health() {
  local url="$1"
  local attempts=12
  local i
  for ((i = 1; i <= attempts; i += 1)); do
    if curl --fail --silent --show-error --max-time 10 "${url}"; then
      printf '\n'
      return 0
    fi
    sleep 5
  done
  return 1
}

verify_deployment() {
  log "检查本机 Next.js health"
  check_health "http://127.0.0.1:3000/api/health" \
    || fail "本机 health 检查失败，请运行：sudo -u ${APP_USER} pm2 logs ${APP_NAME}"

  log "检查公网 Nginx health"
  check_health "http://175.178.174.40/api/health" \
    || fail "公网 health 检查失败，请检查腾讯云防火墙、Nginx 和服务器公网网络。"
}

print_summary() {
  cat <<EOF

部署完成。

网站：http://${PUBLIC_IP}
健康检查：http://${PUBLIC_IP}/api/health

注意：公网 IP 只能用于快速连通性检查。比赛验收需要 HTTPS 链接，
请绑定域名并配置证书，或使用已验证大陆可访问的 HTTPS 部署平台。

查看日志：
  sudo -u ${APP_USER} env HOME=${APP_HOME} pm2 logs ${APP_NAME}

重启服务：
  sudo -u ${APP_USER} env HOME=${APP_HOME} pm2 restart ${APP_NAME} --update-env

以后更新：
  sudo bash ${APP_DIR}/scripts/deploy-tencent-opencloudos.sh
EOF
}

main() {
  require_root
  install_system_dependencies
  update_source
  prepare_environment
  install_project_dependencies
  build_application
  start_pm2
  configure_nginx
  verify_deployment
  print_summary
}

main "$@"
