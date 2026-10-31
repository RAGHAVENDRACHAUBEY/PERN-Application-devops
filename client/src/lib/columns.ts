import { STATUSES, type Columns, type Todo } from "../types";

export function groupByStatus(todos: Todo[]): Columns {
  const cols = Object.fromEntries(STATUSES.map((s) => [s.key, [] as Todo[]])) as Columns;
  for (const t of [...todos].sort((a, b) => a.position - b.position)) cols[t.status].push(t);
  return cols;
}

// Flatten columns back to a list, using array index as a stable local position.
export function flattenColumns(cols: Columns): Todo[] {
  return STATUSES.flatMap(({ key }) =>
    cols[key].map((t, i) => ({ ...t, status: key, position: i })),
  );
}
