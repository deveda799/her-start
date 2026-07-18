import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function text(path: string): Promise<string> {
  return readFile(path, "utf8");
}

describe("Tencent OpenCloudOS deployment assets", () => {
  it("builds a standalone Next.js server", async () => {
    expect(await text("next.config.ts")).toContain('output: "standalone"');
  });

  it("provides a secret-free production environment template", async () => {
    const example = await text(".env.production.example");

    for (const name of [
      "APP_MODE",
      "REQUIRE_LOGIN",
      "SHOW_USAGE_LIMIT",
      "ENABLE_POINTS",
      "ENABLE_AI_FOLLOWUP",
      "GLOBAL_DAILY_AI_LIMIT",
      "IP_HOURLY_AI_LIMIT",
      "NEXT_PUBLIC_SITE_URL",
      "AI_API_KEY",
      "AI_BASE_URL",
      "AI_MODEL",
      "DATA_PROVIDER",
    ]) {
      expect(example).toContain(`${name}=`);
    }
    expect(example).toContain("APP_MODE=competition");
    expect(example).toContain("DATA_PROVIDER=local-json");
    expect(example).not.toMatch(/sk-[A-Za-z0-9_-]{20,}/);
  });

  it("runs standalone Next.js through PM2 on loopback port 3000", async () => {
    const ecosystem = await text("ecosystem.config.js");

    expect(ecosystem).toContain(".next/standalone/server.js");
    expect(ecosystem).toContain('HOSTNAME: "127.0.0.1"');
    expect(ecosystem).toContain('PORT: "3000"');
    expect(ecosystem).toContain(
      'INTERNAL_API_ORIGIN: "http://127.0.0.1:3000"',
    );
    expect(ecosystem).toContain(".env.production");
  });

  it("proxies the public IP to the loopback Next.js server", async () => {
    const nginx = await text(
      "deploy/nginx/jenny-career-opportunity-h5.conf",
    );

    expect(nginx).toContain("listen 80");
    expect(nginx).toContain("server_name 175.178.174.40");
    expect(nginx).toContain("proxy_pass http://127.0.0.1:3000");
    expect(nginx).toContain("proxy_set_header X-Forwarded-Proto $scheme");
  });

  it("installs, validates, deploys, and checks both health endpoints", async () => {
    const script = await text("scripts/deploy-tencent-opencloudos.sh");

    expect(script).toContain("set -Eeuo pipefail");
    expect(script).toContain("/opt/jenny-career-opportunity-h5");
    expect(script).toContain("nodejs");
    expect(script).toContain("pm2");
    expect(script).toContain("package-lock.json");
    expect(script).toContain("pnpm-lock.yaml");
    expect(script).toContain("yarn.lock");
    expect(script).toContain(".env.production.example");
    expect(script).toContain("APP_MODE");
    expect(script).toContain("AI_API_KEY 可以留空");
    expect(script).toContain("填写 AI_API_KEY 时，也必须填写 AI_BASE_URL 和 AI_MODEL");
    expect(script).toContain("nginx -t");
    expect(script).toContain("http://127.0.0.1:3000/api/health");
    expect(script).toContain("http://175.178.174.40/api/health");
  });

  it("uses extracted source in offline mode without requiring GitHub", async () => {
    const script = await text("scripts/deploy-tencent-opencloudos.sh");

    expect(script).toContain('OFFLINE_DEPLOY="${OFFLINE_DEPLOY:-0}"');
    expect(script).toContain('${APP_DIR}/package.json');
    expect(script).toContain('[[ "${OFFLINE_DEPLOY}" == "1" ]]');
    expect(script).toContain("使用本地离线源码，跳过 GitHub");
  });

  it("documents the complete offline deployment flow", async () => {
    const guide = await text("docs/tencent-cloud-offline-deploy.md");

    for (const content of [
      "jenny-career-opportunity-h5-<提交号>.tar.gz",
      "/opt/jenny-career-opportunity-h5",
      "--strip-components=1",
      ".env.production",
      "OFFLINE_DEPLOY=1",
      "pm2 status",
      "systemctl status nginx",
      "http://175.178.174.40/api/health",
      "git push origin main",
    ]) {
      expect(guide).toContain(content);
    }
  });
});
