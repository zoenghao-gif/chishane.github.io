import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;
const backend = spawn(node, [join(root, "server", "index.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
const frontend = spawn(node, [join(root, "node_modules", "vite", "bin", "vite.js"), ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

function stop() {
  backend.kill();
  frontend.kill();
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
backend.on("exit", (code) => {
  if (code && code !== 0) frontend.kill();
});
frontend.on("exit", (code) => {
  if (code && code !== 0) backend.kill();
});
