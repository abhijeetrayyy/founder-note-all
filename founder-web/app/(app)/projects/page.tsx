import Link from "next/link";
import { getProjectHealth } from "@/lib/data";
import { EmptyState } from "@/components/ui/card";
import { CreateProjectButton } from "@/components/create-project-button";
import { PROJECT_COLORS } from "@/lib/constants";
import { GRACE_DAYS, ROT_DAYS } from "@/lib/loops";

/**
 * Projects, ordered by how stuck they are.
 *
 * This page used to render a name, a coloured initial and a description — which
 * answers "what is this project called", a question nobody has. Every signal
 * needed to answer the real one already existed in the data: open loops, the
 * age of the oldest unanswered one, who it is blocked on, and how long since
 * anything moved.
 */
export default async function ProjectsPage() {
  const health = await getProjectHealth();
  const stuck = health.filter((h) => h.oldestDays >= GRACE_DAYS || h.owedByYou > 0);

  return (
    <div className="max-w-[1180px] mx-auto px-5 sm:px-7 pt-7 pb-16 space-y-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-base text-[#9C9CA4] max-w-[560px]">
          {health.length === 0
            ? "Outcomes, not folders."
            : stuck.length === 0
            ? "Nothing is stuck. Every project has moved recently."
            : `${stuck.length} of ${health.length} ${stuck.length === 1 ? "project has" : "projects have"} stopped moving. Most stuck first.`}
        </p>
        <CreateProjectButton />
      </header>

      {health.length ? (
        <div className="flex flex-col gap-2.5">
          {health.map((h) => <ProjectRow key={h.project.id} h={h} />)}
        </div>
      ) : (
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>}
          title="No projects yet"
          subtitle="Group loops around an outcome you're driving toward."
        />
      )}
    </div>
  );
}

function ProjectRow({ h }: { h: Awaited<ReturnType<typeof getProjectHealth>>[number] }) {
  const { project, open, oldestDays, idleDays, blockedOn, owedByYou } = h;
  const rotting = oldestDays >= ROT_DAYS;
  const aging = oldestDays >= GRACE_DAYS && !rotting;

  // The single sentence that says why this project is where it is in the list.
  const verdict = owedByYou > 0
    ? `${owedByYou} ${owedByYou === 1 ? "person is" : "people are"} waiting on you`
    : rotting
    ? `Oldest loop has sat ${oldestDays} days unanswered`
    : blockedOn.length
    ? `Sitting with ${blockedOn.slice(0, 2).join(" and ")}${blockedOn.length > 2 ? ` +${blockedOn.length - 2}` : ""}`
    : aging
    ? `Oldest loop is ${oldestDays} days old`
    : open === 0
    ? "Nothing open"
    : idleDays !== null && idleDays >= 7
    ? `Nothing has moved for ${idleDays} days`
    : "Moving";

  const tone = owedByYou > 0 || rotting ? "#FF8A4C" : aging || (idleDays ?? 0) >= 7 ? "#E0A33E" : "#6E6E77";

  return (
    <Link href={`/projects/${project.id}`}
      className="group flex items-center gap-4 rounded-[8px] border border-[#26262B] bg-[#141417] p-5 hover:border-[#35353C] transition-colors focus-ring">
      <span className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-semibold text-white shrink-0"
        style={{ backgroundColor: PROJECT_COLORS[project.color % PROJECT_COLORS.length] }}>
        {project.name[0]?.toUpperCase()}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold truncate">{project.name}</p>
        <p className="mt-0.5 text-sm truncate" style={{ color: tone }}>{verdict}</p>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-1 flex-none">
        <span className="font-mono text-xs text-[#9C9CA4]">{open} open</span>
        {idleDays !== null && (
          <span className="font-mono text-2xs text-[#9C9CA4]">
            {idleDays === 0 ? "touched today" : `${idleDays}d since a change`}
          </span>
        )}
      </div>

      <span className="text-[#6E6E77] group-hover:text-[#F0F0EE] transition-colors flex-none">→</span>
    </Link>
  );
}
