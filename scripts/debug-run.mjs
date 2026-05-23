import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const logDir = resolve(projectRoot, "logs");
const logFile = resolve(logDir, "debug.log");
const command = process.argv[2];
const args = process.argv.slice(3);

mkdirSync(logDir, { recursive: true });

const stream = createWriteStream(logFile, { flags: "a" });
const timestamp = new Date().toISOString();

if (!command) {
  const message = "No command provided to debug-run.\n";
  stream.write(`[${timestamp}] ERROR ${message}`);
  process.stderr.write(message);
  process.exit(1);
}

stream.write(`\n[${timestamp}] RUN ${[command, ...args].join(" ")}\n`);

const child = spawn(command, args, {
  cwd: projectRoot,
  env: {
    ...process.env,
    EXPO_NO_TELEMETRY: process.env.EXPO_NO_TELEMETRY ?? "1"
  },
  shell: false,
  stdio: ["inherit", "pipe", "pipe"]
});

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  stream.write(chunk);
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
  stream.write(chunk);
});

child.on("error", (error) => {
  const message = `[${new Date().toISOString()}] ERROR ${error.message}\n`;
  process.stderr.write(message);
  stream.write(message);
});

child.on("close", (code, signal) => {
  stream.write(`[${new Date().toISOString()}] EXIT code=${code ?? "null"} signal=${signal ?? "null"}\n`);
  stream.end(() => {
    process.exit(code ?? 1);
  });
});
