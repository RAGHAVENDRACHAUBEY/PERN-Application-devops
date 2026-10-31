import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { flattenColumns, groupByStatus } from "../lib/columns";
import { STATUSES, type Columns, type Status, type Todo } from "../types";
import { Column } from "./Column";
import { CardBody } from "./TodoCard";
import type { useTodos } from "../hooks/useTodos";

type Api = ReturnType<typeof useTodos>;
interface Props {
  todos: Todo[];
  updateTodo: Api["updateTodo"];
  deleteTodo: Api["deleteTodo"];
  moveTodo: Api["moveTodo"];
}

const isStatus = (id: unknown): id is Status => STATUSES.some((s) => s.key === id);

export function Board({ todos, updateTodo, deleteTodo, moveTodo }: Props) {
  const [columns, setColumns] = useState<Columns>(() => groupByStatus(todos));
  const [activeId, setActiveId] = useState<number | null>(null);

  // Mirror server state, except mid-drag where the local arrangement wins.
  // Keyed on `todos` only, so ending a drag doesn't snap back to stale data
  // before the optimistic update lands.
  const draggingRef = useRef(false);
  draggingRef.current = activeId !== null;
  useEffect(() => {
    if (!draggingRef.current) setColumns(groupByStatus(todos));
  }, [todos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findColumn = (id: unknown, cols: Columns = columns): Status | undefined =>
    isStatus(id) ? id : STATUSES.find((s) => cols[s.key].some((t) => t.id === id))?.key;

  const activeTodo = activeId === null ? null : flattenColumns(columns).find((t) => t.id === activeId);

  const onDragStart = (e: DragStartEvent) => setActiveId(Number(e.active.id));

  // Moving across columns: re-home the card live so the target column makes room.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setColumns((prev) => {
      const from = findColumn(active.id, prev);
      const to = findColumn(over.id, prev);
      if (!from || !to || from === to) return prev;

      const moving = prev[from].find((t) => t.id === active.id)!;
      const target = prev[to];
      let index = target.length;
      if (!isStatus(over.id)) {
        const overIndex = target.findIndex((t) => t.id === over.id);
        const below =
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
        index = overIndex + (below ? 1 : 0);
      }
      return {
        ...prev,
        [from]: prev[from].filter((t) => t.id !== active.id),
        [to]: [...target.slice(0, index), { ...moving, status: to }, ...target.slice(index)],
      };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = Number(active.id);
    setActiveId(null);
    if (!over) return setColumns(groupByStatus(todos));

    const status = findColumn(id);
    if (!status) return;

    let next = columns;
    const oldIndex = columns[status].findIndex((t) => t.id === id);
    const overIndex = isStatus(over.id)
      ? columns[status].length - 1
      : columns[status].findIndex((t) => t.id === over.id);
    if (overIndex !== -1 && overIndex !== oldIndex) {
      next = { ...columns, [status]: arrayMove(columns[status], oldIndex, overIndex) };
      setColumns(next);
    }

    const original = todos.find((t) => t.id === id);
    const newIndex = next[status].findIndex((t) => t.id === id);
    const afterId = newIndex > 0 ? next[status][newIndex - 1].id : null;
    const prevAfterId = (() => {
      const orig = groupByStatus(todos)[status];
      const i = orig.findIndex((t) => t.id === id);
      return i > 0 ? orig[i - 1].id : null;
    })();
    if (original?.status === status && prevAfterId === afterId) return; // dropped where it started

    moveTodo(id, status, afterId, flattenColumns(next)).catch(() =>
      setColumns(groupByStatus(todos)),
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setColumns(groupByStatus(todos));
      }}
    >
      <div className="board">
        {STATUSES.map((s) => (
          <Column
            key={s.key}
            status={s.key}
            label={s.label}
            todos={columns[s.key]}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTodo ? (
          <div className={`card overlay ${activeTodo.status === "DONE" ? "is-done" : ""}`} data-status={activeTodo.status}>
            <CardBody todo={activeTodo} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
