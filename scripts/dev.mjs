import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const children = [
  spawn(npmCommand, ["run", "dev:server"], { stdio: "inherit", shell: true }),
  spawn(npmCommand, ["run", "dev:web"], { stdio: "inherit", shell: true }),
];

let stopping = false;

function stop(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill(signal);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stop(signal));
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (stopping) return;
    stop();
    process.exitCode = code ?? (signal ? 1 : 0);
  });
}
