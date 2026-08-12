import { redirect } from "next/navigation";

/**
 * /tasks was a second list over the same rows as /loops, with a different
 * mental model — open/completed grouping and edit affordances, versus decay
 * grouping and the four answers. Two models of the same data, one of them
 * unreachable from the nav.
 *
 * Kept as a redirect rather than deleted so existing links and any bookmarks
 * still land somewhere sensible.
 */
export default function TasksPage() {
  redirect("/loops");
}
