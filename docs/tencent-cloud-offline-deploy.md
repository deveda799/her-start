# 腾讯云 OpenCloudOS 离线部署

本方案用离线源码包绕过 GitHub。服务器仍需能访问 OpenCloudOS 软件源、npm、DeepSeek API 和 Supabase API。

## 1. 上传部署包

在本机下载最新的 `jenny-career-opportunity-h5-<提交号>.tar.gz`，再通过腾讯云控制台、SCP 或 SFTP 上传到服务器登录用户的主目录。

服务器示例：

- 系统：OpenCloudOS
- 公网 IP：`175.178.174.40`
- 腾讯云防火墙放行：22、80、443

## 2. 解压并填写环境变量

登录服务器后执行：

```bash
sudo mkdir -p /opt/jenny-career-opportunity-h5
PACKAGE="$(ls -t ~/jenny-career-opportunity-h5-*.tar.gz | head -n 1)"
test -n "${PACKAGE}" || { echo "未找到离线部署包"; exit 1; }
sudo tar -xzf "${PACKAGE}" \
  -C /opt/jenny-career-opportunity-h5 \
  --strip-components=1
cd /opt/jenny-career-opportunity-h5
sudo cp .env.production.example .env.production
sudo vi .env.production
```

在 `.env.production` 中填写以下变量。不要把真实密钥提交到 Git 或发到聊天中：

```dotenv
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=<REDACTED>
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<REDACTED>
BRAVE_SEARCH_API_KEY=
```

`BRAVE_SEARCH_API_KEY` 可留空；留空时只跳过 Brave Search，不影响其他采集源和 H5。

## 3. 执行部署

```bash
cd /opt/jenny-career-opportunity-h5
sudo chmod +x scripts/deploy-tencent-opencloudos.sh
sudo env OFFLINE_DEPLOY=1 bash scripts/deploy-tencent-opencloudos.sh
```

`OFFLINE_DEPLOY=1` 会要求脚本直接使用 `/opt/jenny-career-opportunity-h5` 中的源码，不执行 GitHub clone、fetch 或 pull。

## 4. 检查服务

```bash
sudo -u jennyapp env HOME=/home/jennyapp pm2 status
sudo systemctl status nginx --no-pager
curl --fail http://127.0.0.1:3000/api/health
curl --fail http://175.178.174.40/api/health
```

浏览器访问：

- 网站：`http://175.178.174.40`
- 健康检查：`http://175.178.174.40/api/health`

查看日志：

```bash
sudo -u jennyapp env HOME=/home/jennyapp pm2 logs jenny-career-opportunity-h5
```

重启服务：

```bash
sudo -u jennyapp env HOME=/home/jennyapp pm2 restart jenny-career-opportunity-h5 --update-env
```

## 5. 更新离线版本

上传新压缩包前，先备份 `.env.production`。将新包解压到干净的 `/opt/jenny-career-opportunity-h5`，恢复 `.env.production`，再执行：

```bash
sudo env OFFLINE_DEPLOY=1 bash /opt/jenny-career-opportunity-h5/scripts/deploy-tencent-opencloudos.sh
```

不要把新包直接覆盖到旧源码目录，否则旧版本已经删除的文件可能残留。

## GitHub 网络恢复后

离线部署不受远程仓库旧版本影响。GitHub 网络恢复后，本机仍需补执行：

```bash
git push origin main
```
