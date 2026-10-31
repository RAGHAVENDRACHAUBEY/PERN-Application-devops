import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Status, Todo } from "../types";
import { TodoCard } from "./TodoCard";

interface Props {
  status: Status;
  label: string;
  todos: Todo[];
  onUpdate: React.ComponentProps<typeof TodoCard>["onUpdate"];
  onDelete: React.ComponentProps<typeof TodoCard>["onDelete"];
}

export function Column({ status, label, todos, onUpdate, onDelete }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section className={`column ${isOver ? "over" : ""}`} data-status={status}>
      <header>
        <span className="dot" aria-hidden="true" />
        <h2>{label}</h2>
        <span className="count">{todos.length}</span>
      </header>
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="cards">
          {todos.map((t) => (
            <TodoCard key={t.id} todo={t} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
          {todos.length === 0 && (
            <li className="empty">
              <span>Nothing here yet</span>
              <span>Drop a task to place it</span>
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}
