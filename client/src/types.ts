export type Status = "TODO" | "IN_PROGRESS" | "DONE";

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  status: Status;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export const STATUSES: { key: Status; label: string }[] = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE", label: "Done" },
];

export type Columns = Record<Status, Todo[]>;
