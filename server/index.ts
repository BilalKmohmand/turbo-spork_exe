import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import cors from "cors";

const app = express();
const IS_PROD = process.env.NODE_ENV === "production";

/* ── Trust proxy (Replit) ────────────────────────────────────────── */
app.set("trust proxy", 1);

/* ── CORS for Electron desktop app ───────────────────────────────── */
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-desktop-user"],
}));

/* ── Compression ─────────────────────────────────────────────────── */
app.use(compression({
  filter: (req, res) => {
    /* Don't compress SSE streams */
    if (res.getHeader("Content-Type")?.toString().includes("text/event-stream")) return false;
    return compression.filter(req, res);
  },
  level: 6,
}));

/* ── Security headers ────────────────────────────────────────────── */
app.use(helmet({
  contentSecurityPolicy: IS_PROD ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      mediaSrc: ["'self'", "blob:"],
      workerSrc: ["'self'", "blob:"],
    },
  } : false,
  frameguard: IS_PROD ? { action: "sameorigin" } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

/* ── Rate limiters ───────────────────────────────────────────────── */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many AI requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", generalLimiter);
app.use("/api/solve-text", aiLimiter);
app.use("/api/solve-text-stream", aiLimiter);
app.use("/api/solve-image", aiLimiter);
app.use("/api/solve-images", aiLimiter);
app.use("/api/courses/generate", aiLimiter);
app.use("/api/solve-image-stream", aiLimiter);
app.use("/api/solve-with-rag", aiLimiter);
app.use("/api/generate-quiz", aiLimiter);
app.use("/api/generate-essay", aiLimiter);
app.use("/api/generate-notes", aiLimiter);
app.use("/api/transcribe", aiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

/* ── Health check (before body parser / sessions) ────────────────── */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    env: IS_PROD ? "production" : "development",
  });
});

/* ── Session ─────────────────────────────────────────────────────── */
if (!process.env.SESSION_SECRET) {
  if (IS_PROD) throw new Error("SESSION_SECRET must be set in production");
  console.warn("Warning: SESSION_SECRET not set — using fallback for development");
}

const PgSession = connectPgSimple(session);
const httpServer = createServer(app);

app.use(
  session({
    store: IS_PROD
      ? new PgSession({
          pool,
          tableName: "user_sessions",
          createTableIfMissing: true,
          pruneSessionInterval: 60 * 60, // prune expired sessions every hour
        })
      : new session.MemoryStore(),
    secret: process.env.SESSION_SECRET || "dev-fallback-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    name: "gid",
    cookie: {
      secure: IS_PROD,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    },
  })
);

/* ── Body parsers ────────────────────────────────────────────────── */
declare module "http" {
  interface IncomingMessage { rawBody: unknown; }
}

app.use(express.json({
  limit: "50mb",
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

/* ── Request logger ──────────────────────────────────────────────── */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

/* ── Bootstrap ───────────────────────────────────────────────────── */
(async () => {
  await registerRoutes(httpServer, app);

  /* 404 handler for unmatched API routes */
  app.use("/api/*", (_req: Request, res: Response) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  /* Global error handler */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status  = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (!IS_PROD || status >= 500) {
      console.error(`[error] ${status} — ${message}`, err.stack || "");
    }
    if (!res.headersSent) {
      res.status(status).json({ error: message });
    }
  });

  if (IS_PROD) {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port} (${IS_PROD ? "production" : "development"})`);
  });

  /* ── Graceful shutdown ─────────────────────────────────────────── */
  const shutdown = (signal: string) => {
    log(`${signal} received — shutting down gracefully`, "server");
    httpServer.close(() => {
      pool.end(() => {
        log("Database pool closed — exit", "server");
        process.exit(0);
      });
    });
    /* Force exit after 10 s if graceful shutdown hangs */
    setTimeout(() => {
      console.error("Forced exit after timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  /* Catch unhandled errors in production so the process stays alive */
  process.on("uncaughtException", (err) => {
    console.error("[uncaughtException]", err);
    if (!IS_PROD) process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
  });
})();
