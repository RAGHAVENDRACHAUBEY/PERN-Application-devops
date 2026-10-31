import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Todo } from "../types";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Max 120 characters"),
  description: z.string().trim().max(500, "Max 500 characters").optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  todo: Todo;
  onUpdate: (id: number, input: { title: string; description: string | null }) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
  </svg>
);

export function CardBody({ todo, onEdit, onDelete }: { todo: Todo; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <>
      <div className="card-text">
        <strong>{todo.title}</strong>
        {todo.description && <p>{todo.description}</p>}
      </div>
      {(onEdit || onDelete) && (
        <div className="card-actions">
          <button type="button" className="icon" onClick={onEdit} aria-label="Edit task" title="Edit">
            <EditIcon />
          </button>
          <button type="button" className="icon danger" onClick={onDelete} aria-label="Delete task" title="Delete">
            <TrashIcon />
          </button>
        </div>
      )}
    </>
  );
}

export function TodoCard({ todo, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    disabled: editing,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: todo.title, description: todo.description ?? "" },
  });

  const save = handleSubmit(async (v) => {
    await onUpdate(todo.id, { title: v.title, description: v.description || null });
    setEditing(false);
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (editing) {
    return (
      <li ref={setNodeRef} style={style} className="card editing" data-status={todo.status}>
        <form onSubmit={save} noValidate>
          <input {...register("title")} aria-label="Title" autoFocus />
          {errors.title && <span className="error">{errors.title.message}</span>}
          <textarea {...register("description")} rows={2} aria-label="Description" />
          {errors.description && <span className="error">{errors.description.message}</span>}
          <div className="row">
            <button type="submit" disabled={isSubmitting}>
              Save
            </button>
            <button type="button" className="secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`card ${todo.status === "DONE" ? "is-done" : ""}`}
      data-status={todo.status}
      {...attributes} {...listeners}>
      <CardBody todo={todo} onEdit={() => setEditing(true)} onDelete={() => onDelete(todo.id)} />
    </li>
  );
}
