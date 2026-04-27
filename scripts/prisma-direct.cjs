require("dotenv").config();

const { spawnSync } = require("node:child_process");

const args = process.argv.slice(2);
const env = { ...process.env };

if (env.DIRECT_URL && env.DIRECT_URL.trim().length > 0) {
  env.DATABASE_URL = env.DIRECT_URL;
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["prisma", ...args], {
  stdio: "inherit",
  env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
