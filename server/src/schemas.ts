import { z } from "zod";

export const statusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(500).optional(),
  status: statusSchema.default("TODO"),
});

export const updateTodoSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
});

export const moveTodoSchema = z.object({
  status: statusSchema,
  // id of the card the moved card should sit directly after (null = top of column)
  afterId: z.number().int().nullable(),
});
