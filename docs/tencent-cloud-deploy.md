# 腾讯云轻量应用服务器部署指南

本文用于把珍妮职业机会情报 H5 部署到腾讯云轻量应用服务器，不依赖 Vercel。

示例服务器：

- 系统：OpenCloudOS
- 公网 IPv4：`175.178.174.40`
- 腾讯云防火墙放行：`22`、`80`、`443`
- Next.js 只监听服务器本机 `127.0.0.1:3000`
- 正式入口由 Nginx 的 `80/443` 转发

真实 API Key 只填写在服务器 `/opt/jenny-career-opportunity-h5/.env.production`，不要发到聊天、提交到 Git 或写进部署脚本。

## 1. 登录服务器

在腾讯云控制台使用“登录”，或者在自己的终端执行：

```bash
ssh root@175.178.174.40
```

如果服务器禁止 root SSH，请使用有 sudo 权限的账号。

## 2. 首次运行一键部署

在服务器终端复制执行这一条完整命令：

```bash
sudo bash -c 'dnf install -y git && if [ ! -d /opt/jenny-career-opportunity-h5/.git ]; then git clone --branch main --single-branch https://github.com/deveda799/jenny-career-opportunity-h5.git /opt/jenny-career-opportunity-h5; fi && chmod +x /opt/jenny-career-opportunity-h5/scripts/deploy-tencent-opencloudos.sh && /opt/jenny-career-opportunity-h5/scripts/deploy-tencent-opencloudos.sh'
```

脚本会安装 Git、curl、wget、Nginx、Node.js 20、npm 和 PM2，并创建专用系统用户 `jennyapp`。

首次运行时，如果 `.env.production` 不存在，脚本会：

1. 从 `.env.production.example` 创建文件。
2. 设置文件权限为 `600`。
3. 提示填写环境变量。
4. 安全停止，不会使用空密钥继续部署。

## 3. 填写 `.env.production`

执行：

```bash
sudo vi /opt/jenny-career-opportunity-h5/.env.production
```

如果不熟悉 `vi`，也可安装并使用 `nano`：

```bash
sudo dnf install -y nano
sudo nano /opt/jenny-career-opportunity-h5/.env.production
```

变量说明：

| 变量 | 是否必填 | 说明 |
|---|---|---|
| `NODE_ENV` | 是 | 固定为 `production` |
| `DATA_PROVIDER` | 是 | 当前填 `supabase` |
| `AI_PROVIDER` | 是 | 当前填 `deepseek` |
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API Key |
| `DEEPSEEK_BASE_URL` | 是 | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 是 | 当前使用的 DeepSeek 模型名 |
| `SUPABASE_URL` | 是 | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 是 | 仅保存在服务器端的 service role key |
| `BRAVE_SEARCH_API_KEY` | 否 | 不使用 Brave Search 时留空 |
| `MAX_DAILY_SEARCH_QUERIES` | 否 | 默认 `30` |
| `MAX_ITEMS_PER_RUN` | 否 | 默认 `50` |

不要在变量两侧添加多余空格。Key 中如果包含 Shell 特殊字符，使用单引号包裹值。

填写并保存后，再执行：

```bash
sudo bash /opt/jenny-career-opportunity-h5/scripts/deploy-tencent-opencloudos.sh
```

脚本将完成：

- 更新 `main` 分支。
- 按 lockfile 安装依赖。
- 构建 Next.js standalone。
- 使用 PM2 启动 `127.0.0.1:3000`。
- 配置并检查 Nginx。
- 配置 PM2 开机自启动。
- 检查本机和公网 health API。

## 4. 访问网站

部署成功后打开：

- H5：<http://175.178.174.40>
- 健康检查：<http://175.178.174.40/api/health>
- 机会 API：<http://175.178.174.40/api/opportunities>

health API 正常示例：

```json
{
  "status": "ok",
  "timestamp": "2026-07-01T00:00:00.000Z",
  "provider": "supabase",
  "environment": "production"
}
```

health API 不返回任何密钥。

## 5. PM2 常用命令

查看进程：

```bash
sudo -u jennyapp env HOME=/home/jennyapp pm2 status
```

查看日志：

```bash
sudo -u jennyapp env HOME=/home/jennyapp pm2 logs jenny-career-opportunity-h5
```

只查看最近 200 行：

```bash
sudo -u jennyapp env HOME=/home/jennyapp pm2 logs jenny-career-opportunity-h5 --lines 200
```

重启服务并重新读取环境变量：

```bash
sudo -u jennyapp env HOME=/home/jennyapp pm2 restart jenny-career-opportunity-h5 --update-env
```

## 6. 更新代码

推荐直接重新运行一键部署脚本。它会执行 `git pull --ff-only`、依赖安装、production build、PM2 reload、Nginx 检查和 health 检查：

```bash
sudo bash /opt/jenny-career-opportunity-h5/scripts/deploy-tencent-opencloudos.sh
```

如需人工检查更新过程：

```bash
cd /opt/jenny-career-opportunity-h5
sudo -u jennyapp git pull --ff-only origin main
sudo -u jennyapp npm ci
sudo -u jennyapp npm run build
```

standalone 还需要复制静态文件并更新 PM2，因此人工更新后仍建议执行部署脚本完成收尾。

## 7. 故障排查

检查 Nginx 配置：

```bash
sudo nginx -t
```

查看 Nginx 状态：

```bash
sudo systemctl status nginx
```

查看 PM2 状态和日志：

```bash
sudo -u jennyapp env HOME=/home/jennyapp pm2 status
sudo -u jennyapp env HOME=/home/jennyapp pm2 logs jenny-career-opportunity-h5 --lines 200
```

检查 Next.js 本机 health：

```bash
curl -i http://127.0.0.1:3000/api/health
```

检查 Nginx 公网 health：

```bash
curl -i http://175.178.174.40/api/health
```

检查端口监听：

```bash
sudo ss -lntp | grep -E ":80|:3000"
```

常见判断：

- 本机 `3000` 正常、公网失败：检查 Nginx、服务器 firewalld 和腾讯云防火墙。
- PM2 反复重启：查看 PM2 日志，重点检查 `.env.production`。
- Nginx 返回 `502`：Next.js 未启动或未监听 `127.0.0.1:3000`。
- API 返回 `500`：检查 Supabase URL、service role key 和数据库 migration。

## 8. 后续绑定域名与 HTTPS

1. 在域名 DNS 控制台添加 A 记录，指向 `175.178.174.40`。
2. 将 Nginx 配置中的 `server_name` 改为备案域名。
3. 中国大陆正式公开访问需评估并完成适用的 ICP 备案流程。
4. HTTPS 可后续使用 Certbot，或在腾讯云申请并配置 SSL 证书。
5. 配置证书后再启用 Nginx `443 ssl`，并将 HTTP 重定向到 HTTPS。

修改 Nginx 后必须执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 9. GitHub Actions collect

H5 运行在腾讯云服务器，定时采集仍由 GitHub Actions 执行。当前仓库 Secrets：

```text
AI_PROVIDER
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
DEEPSEEK_MODEL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
BRAVE_SEARCH_API_KEY    # 可选
```

Actions 不需要服务器密码，也不依赖 Vercel。以后可将相同 `npm run collect` 命令迁移到腾讯云定时云函数。
