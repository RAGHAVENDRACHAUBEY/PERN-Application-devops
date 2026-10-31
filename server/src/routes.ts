import { Router, type NextFunction, type Request, type Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "./db.js";
import { createTodoSchema, moveTodoSchema, updateTodoSchema } from "./schemas.js";

const GAP = 1024;

export const router = Router();

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const parseId = (req: Request) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, "Invalid id");
  return id;
};

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

router.get(
  "/todos",
  wrap(async (_req, res) => {
    const todos = await prisma.todo.findMany({
      orderBy: [{ status: "asc" }, { position: "asc" }],
    });
    res.json(todos);
  }),
);

router.post(
  "/todos",
  wrap(async (req, res) => {
    const data = createTodoSchema.parse(req.body);
    const last = await prisma.todo.findFirst({
      where: { status: data.status },
      orderBy: { position: "desc" },
    });
    const todo = await prisma.todo.create({
      data: { ...data, position: (last?.position ?? 0) + GAP },
    });
    res.status(201).json(todo);
  }),
);

router.patch(
  "/todos/:id",
  wrap(async (req, res) => {
    const todo = await prisma.todo.update({
      where: { id: parseId(req) },
      data: updateTodoSchema.parse(req.body),
    });
    res.json(todo);
  }),
);

// Drag & drop: place a todo into a column right after `afterId`.
router.patch(
  "/todos/:id/move",
  wrap(async (req, res) => {
    const id = parseId(req);
    const { status, afterId } = moveTodoSchema.parse(req.body);

    const todo = await prisma.$transaction(async (tx) => {
      const column = await tx.todo.findMany({
        where: { status, id: { not: id } },
        orderBy: { position: "asc" },
        select: { id: true, position: true },
      });

      let prev: number | null = null;
      let next: number | null = column[0]?.position ?? null;
      if (afterId !== null) {
        const idx = column.findIndex((t) => t.id === afterId);
        if (idx === -1) throw new HttpError(400, "afterId not in target column");
        prev = column[idx].position;
        next = column[idx + 1]?.position ?? null;
      }

      let position: number;
      if (prev === null && next === null) position = GAP;
      else if (prev === null) position = next! - GAP;
      else if (next === null) position = prev + GAP;
      else position = (prev + next) / 2;

      return tx.todo.update({ where: { id }, data: { status, position } });
    });

    res.json(todo);
  }),
);

router.delete(
  "/todos/:id",
  wrap(async (req, res) => {
    await prisma.todo.delete({ where: { id: parseId(req) } });
    res.status(204).end();
  }),
);

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err && typeof err === "object" && "issues" in err) {
    return res.status(400).json({ error: "Validation failed", details: (err as { issues: unknown }).issues });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    return res.status(404).json({ error: "Todo not found" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
