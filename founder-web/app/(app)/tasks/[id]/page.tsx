import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjects } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { TaskActions } from "./task-actions";
import { priorityLabel, energyLabel, type Task, type Tag } from "@/lib/supabase/types";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("*").eq("id", id).single();
  if (!task) notFound();
  const t = task as Task;

  const [allProjects, taskTags] = await Promise.all([
    getProjects(),
    supabase.from("task_tags").select("tag_id").eq("task_id", id),
  ]);
  const project = t.project_id ? allProjects.find((p) => p.id === t.project_id) : null;
  const tagIds = (taskTags.data ?? []).map((x) => x.tag_id);
  const { data: tagsData } = tagIds.length
    ? await supabase.from("tags").select("*").in("id", tagIds)
    : { data: [] };
  const tags = (tagsData ?? []) as Tag[];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/tasks" className="text-sm font-bold text-text-muted dark:text-dark-text-muted hover:text-primary">
          ← Back to tasks
        </Link>
        <TaskActions taskId={t.id} completed={t.completed} />
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {t.is_inbox ? <span className="text-xs font-extrabold text-warning">INBOX</span> : null}
          {t.priority > 0 ? (
            <span className={`text-xs font-extrabold ${t.priority === 2 ? "text-danger" : t.priority === 1 ? "text-warning" : "text-text-muted"}`}>
              {priorityLabel(t.priority as 0 | 1 | 2).toUpperCase()}
            </span>
          ) : null}
          {t.completed ? <span className="text-xs font-extrabold text-success">DONE</span> : null}
        </div>

        <h1 className={`text-2xl sm:text-3xl font-extrabold leading-tight ${t.completed ? "line-through text-text-muted dark:text-dark-text-muted" : ""}`}>
          {t.title}
        </h1>

        {t.description ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{t.description}</p>
        ) : (
          <p className="text-sm text-text-muted dark:text-dark-text-muted italic">No description.</p>
        )}

        {(t.first_step || t.implementation_intention) ? (
          <div className="space-y-3 pt-2 border-t border-border dark:border-dark-border">
            {t.first_step ? (
              <div>
                <SectionLabel className="mb-1">FIRST MICRO-STEP</SectionLabel>
                <p className="text-sm">{t.first_step}</p>
              </div>
            ) : null}
            {t.implementation_intention ? (
              <div>
                <SectionLabel className="mb-1">WHEN/WHERE TRIGGER</SectionLabel>
                <p className="text-sm">{t.implementation_intention}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border dark:border-dark-border">
          <Field label="Energy" value={t.energy_level >= 0 ? energyLabel(t.energy_level as 0 | 1 | 2) : "—"} />
          <Field label="Estimate" value={t.estimated_minutes ? `${t.estimated_minutes} min` : "—"} />
          <Field label="Due" value={t.due_date ?? "—"} />
          <Field label="Recurrence" value={["None", "Daily", "Weekly", "Monthly"][t.recurrence] ?? "None"} />
        </div>

        {project ? (
          <div className="pt-2 border-t border-border dark:border-dark-border">
            <SectionLabel className="mb-1">PROJECT</SectionLabel>
            <Link href={`/projects/${project.id}`} className="text-sm font-bold text-primary hover:underline">
              {project.name}
            </Link>
          </div>
        ) : null}

        {tags.length > 0 ? (
          <div className="pt-2 border-t border-border dark:border-dark-border">
            <SectionLabel className="mb-2">TAGS</SectionLabel>
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map((tag) => (
                <span key={tag.id} className="text-xs font-bold px-2.5 h-6 rounded-full inline-flex items-center" style={{ backgroundColor: `#${tag.color.toString(16).padStart(6, "0")}20`, color: `#${tag.color.toString(16).padStart(6, "0")}` }}>
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="text-xs text-text-muted dark:text-dark-text-muted pt-2">
          Created {new Date(t.created_at).toLocaleString()}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold tracking-wider text-text-muted dark:text-dark-text-muted">{label.toUpperCase()}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}
