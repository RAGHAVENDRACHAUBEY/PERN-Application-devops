import { Board } from "./components/Board";
import { TodoForm } from "./components/TodoForm";
import { useTodos } from "./hooks/useTodos";

export default function App() {
  const { todos, error, isLoading, addTodo, updateTodo, deleteTodo, moveTodo } = useTodos();

  const total = todos?.length ?? 0;
  const done = todos?.filter((t) => t.status === "DONE").length ?? 0;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <main>
      <div className="page-header">
        <div>
          <h1>Todo Board</h1>
          <p>Drag cards between columns to update their status.</p>
        </div>
        {todos && (
          <div className="progress">
            <div className="progress-label">
              <span>
                <strong>{done}</strong> of {total} done
              </span>
              <span>{percent}%</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Completed tasks"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div className="progress-bar" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}
      </div>
      <TodoForm onAdd={addTodo} />
      {error && <p className="error banner">Could not load todos: {error.message}</p>}
      {isLoading && <p className="muted">Loading…</p>}
      {todos && (
        <Board todos={todos} updateTodo={updateTodo} deleteTodo={deleteTodo} moveTodo={moveTodo} />
      )}
    </main>
  );
}
