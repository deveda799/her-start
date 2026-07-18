# 腾讯云部署方案 — Her Start 她来开局

## 部署信息

| 项目 | 值 |
|------|-----|
| Git Commit | fffb0a3 |
| Build Version | 20260718-2301 |
| Deploy Target | tencent |
| PM2 应用名 | her-start |
| 内部端口 | 3100 |

## 1. 新项目目录

```
/opt/her-start
```

与原训练营项目完全隔离，不共享任何目录。

## 2. 独立内部端口

**端口 3100**

部署前需在服务器上执行只读检查：
```bash
ss -tlnp | grep 3100
```
确认 3100 端口未被占用。如有冲突，可改为 3101、3200 等。

## 3. PM2 应用

```bash
pm2 start "npm run start -- -p 3100" --name her-start
pm2 save
```

PM2 应用名 `her-start`，与原训练营项目的 PM2 应用名不同。

## 4. Nginx 独立站点配置

新建独立 Nginx 配置文件：
```
/etc/nginx/conf.d/her-start.conf
```

**不修改**原训练营项目的 Nginx 配置。

```nginx
server {
    listen 80;
    server_name her-start.yourdomain.com;  # 替换为实际域名

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 5. 域名方案

**方案 A（推荐）**：使用子域名
```
her-start.yourdomain.com
```

**方案 B**：使用独立域名
```
herstart.yourdomain.com
```

需要在 DNS 中将域名 A 记录指向腾讯云服务器 IP。

## 6. HTTPS 方案

使用 Let's Encrypt 免费证书：
```bash
# 安装 certbot（如未安装）
# sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d her-start.yourdomain.com

# 自动续期已由 certbot 配置
```

**不修改**原训练营项目的 SSL 证书。

## 7. DeepSeek 环境变量配置

在服务器上创建 `.env.local` 文件：
```bash
# 在 /opt/her-start 目录下
cat > .env.local << 'EOF'
AI_API_KEY=由用户本人在服务器上填写
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-v4-flash
NEXT_PUBLIC_DEPLOY_TARGET=tencent
NEXT_PUBLIC_SITE_URL=https://her-start.yourdomain.com
EOF

# 设置权限
chmod 600 .env.local
```

**安全要求：**
- `.env.local` 不进入 Git
- `.env.local` 不进入部署包
- `.env.local` 文件权限 600
- 只有部署用户可读
- 不在日志中输出
- 不在聊天中传输

## 8. 日志位置

```
/opt/her-start/logs/
├── app.log       # Next.js 应用日志
├── error.log     # 错误日志
└── pm2.log       # PM2 进程日志
```

PM2 日志也可通过 `pm2 logs her-start` 查看。

## 9. 健康检查

```bash
# 本地检查
curl http://127.0.0.1:3100/

# 域名检查
curl https://her-start.yourdomain.com/

# API 检查
curl -X POST https://her-start.yourdomain.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"answers":["测试","测试","测试","测试"],"requestId":"health-check-0001"}'
```

预期响应包含 `"mode":"ai"`。

## 10. 自动重启

PM2 配置自动重启：
```bash
pm2 start "npm run start -- -p 3100" --name her-start --restart-delay 3000
pm2 save
pm2 startup  # 设置开机自启
```

PM2 会在进程崩溃后自动重启（延迟 3 秒）。

## 11. 回滚方式

```bash
# 查看历史
pm2 logs her-start --lines 50

# 停止应用
pm2 stop her-start

# 备份当前版本
cp -r /opt/her-start /opt/her-start-backup-$(date +%Y%m%d)

# 部署新版本后回滚
cd /opt/her-start
git checkout <commit-hash>
npm ci --production
npm run build
pm2 restart her-start
```

## 12. 与原训练营项目隔离

| 维度 | 原训练营项目 | Her Start |
|------|-------------|-----------|
| 目录 | 不同目录 | `/opt/her-start` |
| PM2 应用名 | 原项目名 | `her-start` |
| 端口 | 原端口 | `3100` |
| Nginx 配置 | 原配置文件 | `/etc/nginx/conf.d/her-start.conf` |
| 域名 | 原域名 | `her-start.yourdomain.com` |
| SSL 证书 | 原证书 | 独立证书 |
| 环境变量 | 原配置 | 独立 `.env.local` |
| 日志 | 原日志目录 | `/opt/her-start/logs/` |

**完全不共享任何资源。**

## 13. 中国大陆微信测试

1. 手机微信打开 `https://her-start.yourdomain.com`
2. 完成四问
3. 查看三张结果卡
4. 保存品牌长图
5. 确认无 Next.js 开发工具
6. 确认 Build 版本 `20260718-2301`
7. 确认部署节点显示 `tencent`

## 14. 部署步骤

```bash
# 1. 在服务器上创建目录
sudo mkdir -p /opt/her-start
sudo chown $USER:$USER /opt/her-start

# 2. 上传部署包（从本地上传）
scp her-start-deploy.tar.gz user@your-server:/opt/her-start/

# 3. 解压
cd /opt/her-start
tar xzf her-start-deploy.tar.gz

# 4. 安装依赖
npm ci --production

# 5. 配置环境变量（用户本人操作）
nano .env.local  # 填入 DeepSeek API Key

# 6. 构建
npm run build

# 7. 启动
pm2 start "npm run start -- -p 3100" --name her-start
pm2 save
pm2 startup

# 8. 配置 Nginx
sudo nano /etc/nginx/conf.d/her-start.conf
# 粘贴上方 Nginx 配置
sudo nginx -t
sudo systemctl reload nginx

# 9. 配置 HTTPS
sudo certbot --nginx -d her-start.yourdomain.com

# 10. 验证
curl https://her-start.yourdomain.com/
```

## 15. 部署包内容

部署包 `her-start-deploy.tar.gz` 包含：
- `src/` 全部源码
- `public/` 静态资源
- `package.json` + `package-lock.json`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `.env.example`（无密钥值）
- `docs/DEPLOY_TENCENT.md`
- `README.md`

**不包含：**
- `.env.local`（密钥）
- `.env`（密钥）
- `.env.production`（密钥）
- `node_modules/`
- `.next/`（构建缓存）
- `.git/`
- `tests/`
- `.codebanana/`
