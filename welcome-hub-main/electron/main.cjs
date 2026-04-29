const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let backendProcess = null;

const isDev = !app.isPackaged;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBackend({ url, timeoutMs }) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error(`Backend did not become ready within ${timeoutMs}ms`);
}

function startBackend() {
  if (backendProcess) return;

  const serverEntry = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", "backend", "desktop-server.cjs")
    : path.join(__dirname, "..", "backend", "desktop-server.cjs");

  backendProcess = fork(serverEntry, [], {
    stdio: "pipe",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: "5050",
      OLLAMA_ENABLED: process.env.OLLAMA_ENABLED || "true",
      OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      OLLAMA_MODEL: process.env.OLLAMA_MODEL || "llama3.2",
      DATA_DIR: path.join(app.getPath("userData"), "backend-data"),
    },
  });

  backendProcess.on("exit", (code, signal) => {
    backendProcess = null;
    console.log(`[backend] exited code=${code} signal=${signal}`);
  });

  if (backendProcess.stdout) {
    backendProcess.stdout.on("data", (d) => console.log(`[backend] ${String(d).trimEnd()}`));
  }
  if (backendProcess.stderr) {
    backendProcess.stderr.on("data", (d) => console.error(`[backend] ${String(d).trimEnd()}`));
  }
}

function createWindow() {
  const win = new BrowserWindow({
    title: "TheHighGrader",
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: "#0d0d14",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    win.loadURL("http://localhost:8080");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  startBackend();

  const create = async () => {
    try {
      await waitForBackend({ url: "http://127.0.0.1:5050/health", timeoutMs: 20_000 });
    } catch (e) {
      console.error("Backend failed to start", e);
    }
    createWindow();
  };

  create();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  try {
    if (backendProcess) backendProcess.kill();
  } catch {}
});
