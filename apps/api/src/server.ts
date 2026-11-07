import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { Prisma, PrismaClient, TabKind } from "@prisma/client";
import { z } from "zod";

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();
const wss = new WebSocketServer({ server, path: "/ws" });

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

const asyncRoute = (fn: express.RequestHandler): express.RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const broadcast = (type: string, data: unknown) => {
  const message = JSON.stringify({ type, data });
  for (const client of wss.clients) if (client.readyState === 1) client.send(message);
};

app.get("/health", asyncRoute(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "connected" });
}));

app.get("/api/categories", asyncRoute(async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { products: { where: { available: true }, orderBy: { name: "asc" } } }
  });
  res.json(categories);
}));

app.get("/api/products", asyncRoute(async (req, res) => {
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
  const products = await prisma.product.findMany({
    where: { available: true, ...(categoryId ? { categoryId } : {}) },
    include: { category: true }, orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }]
  });
  res.json(products);
}));

app.get("/api/tabs", asyncRoute(async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "ABERTA";
  const tabs = await prisma.tab.findMany({
    where: { status: status as "ABERTA" | "FECHADA" | "CANCELADA" | "MESCLADA" },
    include: { table: true, items: true, payments: { where: { voidedAt: null } } },
    orderBy: { openedAt: "desc" }
  });
  res.json(tabs);
}));

const openTabSchema = z.object({
  kind: z.nativeEnum(TabKind),
  customerName: z.string().trim().max(100).optional(),
  tableNumber: z.number().int().positive().optional()
});

app.post("/api/tabs", asyncRoute(async (req, res) => {
  const input = openTabSchema.parse(req.body);
  if (input.kind === "MESA" && !input.tableNumber) {
    res.status(400).json({ error: "table_number_required", message: "Informe o número da mesa." }); return;
  }
  if (input.kind === "INDIVIDUAL" && !input.customerName) {
    res.status(400).json({ error: "customer_name_required", message: "Informe o nome do cliente." }); return;
  }
  const tab = await prisma.$transaction(async tx => {
    let tableId: string | undefined;
    if (input.kind === "MESA") {
      const table = await tx.diningTable.upsert({
        where: { number: input.tableNumber! },
        create: { number: input.tableNumber! },
        update: { active: true }
      });
      const occupied = await tx.tab.findFirst({ where: { tableId: table.id, status: "ABERTA" } });
      if (occupied) throw new Error("TABLE_ALREADY_OPEN");
      tableId = table.id;
    }
    return tx.tab.create({
      data: { kind: input.kind, customerName: input.customerName, tableId },
      include: { table: true, items: true }
    });
  });
  broadcast("tab.created", tab);
  res.status(201).json(tab);
}));

app.post("/api/tabs/:tabId/items", asyncRoute(async (req, res) => {
  const input = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99).default(1), notes: z.string().trim().max(300).optional() }).parse(req.body);
  const [tab, product] = await Promise.all([
    prisma.tab.findUnique({ where: { id: req.params.tabId } }),
    prisma.product.findUnique({ where: { id: input.productId }, include: { category: true } })
  ]);
  if (!tab || tab.status !== "ABERTA") { res.status(404).json({ error: "tab_not_open" }); return; }
  if (!product || !product.available) { res.status(404).json({ error: "product_unavailable" }); return; }
  const item = await prisma.orderItem.create({
    data: {
      tabId: tab.id, productId: product.id, productName: product.name,
      quantity: input.quantity, unitPriceCents: product.priceCents,
      station: product.category.station, notes: input.notes
    }
  });
  broadcast("tab.item.created", { tabId: tab.id, item });
  res.status(201).json(item);
}));

app.patch("/api/tabs/:tabId/items/:itemId", asyncRoute(async (req, res) => {
  const input = z.object({ quantity: z.number().int().min(1).max(99) }).parse(req.body);
  const item = await prisma.orderItem.findFirst({ where: { id: req.params.itemId, tabId: req.params.tabId, status: "RECEBIDO" } });
  if (!item) { res.status(404).json({ error: "item_not_editable" }); return; }
  const updated = await prisma.orderItem.update({ where: { id: item.id }, data: { quantity: input.quantity } });
  broadcast("tab.item.updated", updated);
  res.json(updated);
}));

app.delete("/api/tabs/:tabId/items/:itemId", asyncRoute(async (req, res) => {
  const item = await prisma.orderItem.findFirst({ where: { id: req.params.itemId, tabId: req.params.tabId, status: "RECEBIDO" } });
  if (!item) { res.status(404).json({ error: "item_not_removable" }); return; }
  await prisma.orderItem.delete({ where: { id: item.id } });
  broadcast("tab.item.deleted", { tabId: req.params.tabId, itemId: item.id });
  res.status(204).end();
}));

app.get("/api/kitchen", asyncRoute(async (_req, res) => {
  const items = await prisma.orderItem.findMany({
    where: { status: { in: ["RECEBIDO", "EM_PREPARO", "PRONTO"] } },
    include: { tab: { include: { table: true } } }, orderBy: { createdAt: "asc" }
  });
  res.json(items);
}));

app.patch("/api/order-items/:itemId/status", asyncRoute(async (req, res) => {
  const input = z.object({ status: z.enum(["EM_PREPARO", "PRONTO", "ENTREGUE"]) }).parse(req.body);
  const item = await prisma.orderItem.update({ where: { id: req.params.itemId }, data: { status: input.status } });
  broadcast("kitchen.item.updated", item);
  res.json(item);
}));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof z.ZodError) { res.status(400).json({ error: "validation_error", details: err.issues }); return; }
  if (err instanceof Error && err.message === "TABLE_ALREADY_OPEN") { res.status(409).json({ error: "table_already_open", message: "Esta mesa já possui uma comanda aberta." }); return; }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") { res.status(409).json({ error: "conflict" }); return; }
  console.error(err);
  res.status(500).json({ error: "internal_server_error", message: "Ocorreu um erro interno." });
});

wss.on("connection", socket => socket.send(JSON.stringify({ type: "connection.ready" })));
const port = Number(process.env.PORT ?? 3333);
server.listen(port, "0.0.0.0", () => console.log(`Comanda Fácil API listening on :${port}`));
async function shutdown() { server.close(); wss.close(); await prisma.$disconnect(); }
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
