import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { STATUSES } from "../types";
import type { TodoInput } from "../hooks/useTodos";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Max 120 characters"),
  description: z.string().trim().max(500, "Max 500 characters").optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});
type FormValues = z.infer<typeof schema>;

export function TodoForm({ onAdd }: { onAdd: (input: TodoInput) => Promise<unknown> }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", status: "TODO" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onAdd({ ...values, description: values.description || undefined });
      reset();
    } catch (e) {
      setError("root", { message: e instanceof Error ? e.message : "Something went wrong" });
    }
  });

  return (
    <form className="todo-form" onSubmit={submit} noValidate>
      <div className="field grow">
        <input {...register("title")} placeholder="What needs doing?" aria-label="Title" />
        {errors.title && <span className="error">{errors.title.message}</span>}
      </div>
      <div className="field grow">
        <input {...register("description")} placeholder="Details (optional)" aria-label="Description" />
        {errors.description && <span className="error">{errors.description.message}</span>}
      </div>
      <select {...register("status")} aria-label="Column">
        {STATUSES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add"}
      </button>
      {errors.root && <span className="error full">{errors.root.message}</span>}
    </form>
  );
}
