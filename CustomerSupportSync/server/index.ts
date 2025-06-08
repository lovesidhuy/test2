import express, { Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let json: any;
  const orig = res.json;
  res.json = function (body: any, ...args: any[]) {
    json = body;
    return orig.apply(res, [body, ...args]);
  };
  res.on("finish", () => {
    if (path.startsWith("/api")) {
      let line = `${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`;
      if (json) line += ` :: ${JSON.stringify(json)}`;
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });
  next();
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

(async () => {
  const server = await registerRoutes(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
})();
