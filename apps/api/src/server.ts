import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();
const wss = new WebSocketServer({ server, path: "/ws" });

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", database: "unavailable" });
  }
});

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "connection.ready" }));
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_server_error", message: "Ocorreu um erro interno." });
});

const port = Number(process.env.PORT ?? 3333);
server.listen(port, "0.0.0.0", () => console.log(`Comanda Fácil API listening on :${port}`));

async function shutdown() {
  server.close();
  wss.close();
  await prisma.$disconnect();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
