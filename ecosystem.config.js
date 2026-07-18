const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const appRoot = __dirname;
const envPath = path.join(appRoot, ".env.production");
const fileEnv = fs.existsSync(envPath)
  ? dotenv.parse(fs.readFileSync(envPath))
  : {};

module.exports = {
  apps: [
    {
      name: "jenny-career-opportunity-h5",
      cwd: appRoot,
      script: ".next/standalone/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      time: true,
      env: {
        ...fileEnv,
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: "3000",
        INTERNAL_API_ORIGIN: "http://127.0.0.1:3000",
      },
    },
  ],
};
