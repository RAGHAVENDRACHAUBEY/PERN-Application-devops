import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./db.js";
import { errorHandler, router } from "./routes.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", router);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
const server = app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

// Drain in-flight requests and close the DB pool on `docker stop`.
const shutdown = () =>
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
