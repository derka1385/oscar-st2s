import { structures } from "@/data/anatomy/skeleton";
export type ReviewRecord = {
  id: string;
  name: string;
  group: string;
  mastery: number;
  correctAnswers: number;
  wrongAnswers: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  streak: number;
  recentPerformance: boolean[];
};
export const freshRecords = (): Record<string, ReviewRecord> =>
  Object.fromEntries(
    structures.map((b) => [
      b.id,
      {
        id: b.id,
        name: b.name,
        group: b.category,
        mastery: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        lastReviewedAt: null,
        nextReviewAt: null,
        streak: 0,
        recentPerformance: [],
      },
    ]),
  );
export function effectiveMastery(r: ReviewRecord, now = Date.now()) {
  if (!r.lastReviewedAt) return 0;
  const elapsedDays = Math.max(
    0,
    (now - Date.parse(r.lastReviewedAt)) / 86400000,
  );
  return Math.max(
    0,
    Math.round(r.mastery - Math.max(0, elapsedDays - 2) * 1.5),
  );
}
export function applyReview(
  r: ReviewRecord,
  correct: boolean,
  attempts = 1,
  now = Date.now(),
): ReviewRecord {
  const recent = [...r.recentPerformance, correct].slice(-5);
  const recentRate = recent.filter(Boolean).length / recent.length;
  const gain = correct
    ? Math.max(8, 24 - (attempts - 1) * 7) * (0.75 + 0.25 * recentRate)
    : -14;
  const mastery = Math.max(
    0,
    Math.min(100, Math.round(effectiveMastery(r, now) + gain)),
  );
  const streak = correct ? r.streak + 1 : 0;
  const interval = correct
    ? Math.min(
        30,
        Math.max(
          1,
          Math.round(Math.pow(1.8, streak - 1) * (mastery / 50 + 0.5)),
        ),
      )
    : 0;
  return {
    ...r,
    mastery,
    streak,
    correctAnswers: r.correctAnswers + Number(correct),
    wrongAnswers: r.wrongAnswers + Number(!correct),
    recentPerformance: recent,
    lastReviewedAt: new Date(now).toISOString(),
    nextReviewAt: new Date(
      now + (correct ? interval * 86400000 : 10 * 60000),
    ).toISOString(),
  };
}
