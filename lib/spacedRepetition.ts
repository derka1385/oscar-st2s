import type { ReviewRecord } from "./mastery";
import { effectiveMastery } from "./mastery";
export function priority(r: ReviewRecord, now = Date.now()) {
  const overdue = r.nextReviewAt
    ? Math.max(0, (now - Date.parse(r.nextReviewAt)) / 86400000)
    : 1;
  return (
    100 -
    effectiveMastery(r, now) +
    Math.min(30, overdue * 5) +
    r.recentPerformance.filter((x) => !x).length * 10
  );
}
export function reviewQueue(
  records: Record<string, ReviewRecord>,
  ids?: string[],
  now = Date.now(),
) {
  return Object.values(records)
    .filter((r) => !ids || ids.includes(r.id))
    .sort((a, b) => priority(b, now) - priority(a, now));
}
export const dueToday = (r: ReviewRecord, now = Date.now()) =>
  !r.nextReviewAt || Date.parse(r.nextReviewAt) <= now;
