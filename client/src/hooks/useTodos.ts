import useSWR from "swr";
import { del, fetcher, patch, post } from "../lib/api";
import type { Status, Todo } from "../types";

const KEY = "/todos";

export interface TodoInput {
  title: string;
  description?: string;
  status?: Status;
}

export function useTodos() {
  const { data, error, isLoading, mutate } = useSWR<Todo[]>(KEY, fetcher);

  const addTodo = (input: TodoInput) =>
    mutate(async (current = []) => [...current, await post<Todo>(KEY, input)], {
      revalidate: true,
    });

  const updateTodo = (id: number, input: { title?: string; description?: string | null }) =>
    mutate(
      async (current = []) => {
        const updated = await patch<Todo>(`${KEY}/${id}`, input);
        return current.map((t) => (t.id === id ? updated : t));
      },
      {
        optimisticData: (current = []) =>
          current.map((t) => (t.id === id ? { ...t, ...input } : t)),
        rollbackOnError: true,
      },
    );

  const deleteTodo = (id: number) =>
    mutate(
      async (current = []) => {
        await del(`${KEY}/${id}`);
        return current.filter((t) => t.id !== id);
      },
      {
        optimisticData: (current = []) => current.filter((t) => t.id !== id),
        rollbackOnError: true,
      },
    );

  // `optimistic` is the full list as it looks after the drop.
  const moveTodo = (id: number, status: Status, afterId: number | null, optimistic: Todo[]) =>
    mutate(
      async () => {
        await patch<Todo>(`${KEY}/${id}/move`, { status, afterId });
        return undefined;
      },
      {
        optimisticData: optimistic,
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      },
    );

  return { todos: data, error, isLoading, addTodo, updateTodo, deleteTodo, moveTodo };
}
