import { getTasksForFocus } from "@/lib/data";
import { FocusTimer } from "./focus-timer";

export default async function FocusPage({ searchParams }: { searchParams: Promise<{ task?: string }> }) {
  const [tasks, params] = await Promise.all([getTasksForFocus().catch(() => []), searchParams]);
  return <FocusTimer tasks={tasks} initialTaskId={params.task ?? ""} />;
}
