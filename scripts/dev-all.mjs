import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");

function prefixStream(stream, label) {
  let buffer = "";

  stream.on("data", chunk => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.length > 0) {
        process.stdout.write(`[${label}] ${line}\n`);
      }
    }
  });

  stream.on("end", () => {
    if (buffer.length > 0) {
      process.stdout.write(`[${label}] ${buffer}\n`);
    }
  });
}

function startProcess(label, args, cwd) {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const spawnArgs =
    process.platform === "win32"
      ? ["/d", "/s", "/c", "npm", ...args]
      : args;

  const child = spawn(command, spawnArgs, {
    cwd,
    stdio: ["inherit", "pipe", "pipe"],
    shell: false
  });

  prefixStream(child.stdout, label);
  prefixStream(child.stderr, `${label}:err`);

  child.on("error", error => {
    console.error(`[${label}:err] Failed to start: ${error.message}`);
  });

  return child;
}

const processes = [
  startProcess("frontend", ["run", "dev"], rootDir),
  startProcess("backend", ["--prefix", "backend", "run", "dev"], rootDir)
];

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  setTimeout(() => process.exit(exitCode), 300);
}

for (const child of processes) {
  child.on("exit", code => {
    if (!shuttingDown && code && code !== 0) {
      shutdown(code);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
