import assert from "node:assert/strict";
import { freshRecords, applyReview, effectiveMastery } from "./mastery";
import { reviewQueue, dueToday } from "./spacedRepetition";
import { createSession, validBuild } from "./quiz";
import { structures, matchesTerm, boneById } from "@/data/anatomy/skeleton";
import { createProceduralSkeleton } from "@/components/anatomy/proceduralGeometry";
const now = Date.UTC(2026, 9, 7, 12);
const records = freshRecords();
assert.equal(Object.keys(records).length, structures.length);
const first = applyReview(records.femur, true, 1, now);
assert(first.mastery > 0);
assert.equal(first.correctAnswers, 1);
assert(Date.parse(first.nextReviewAt!) > now);
const wrong = applyReview(first, false, 1, now + 1000);
assert(wrong.mastery < first.mastery);
assert.equal(wrong.wrongAnswers, 1);
assert.equal(wrong.streak, 0);
const hesitant = applyReview(records.femur, true, 3, now);
assert(hesitant.mastery < first.mastery);
assert(effectiveMastery(first, now + 10 * 86400000) < first.mastery);
assert(!dueToday(first, now));
assert(dueToday(first, now + 40 * 86400000));
records.femur = wrong;
records.tibia = {
  ...first,
  id: "tibia",
  nextReviewAt: new Date(now + 30 * 86400000).toISOString(),
};
assert(
  reviewQueue(records, undefined, now).findIndex((r) => r.id === "femur") <
    reviewQueue(records, undefined, now).findIndex((r) => r.id === "tibia"),
);
assert(matchesTerm("ulna", "cubitus"));
assert(matchesTerm("patella", " ROTULE "));
assert(matchesTerm("femur", "femur"));
assert(!matchesTerm("fibula", "tibia"));
const standard = [
  "femur",
  "patella",
  "tibia",
  "fibula",
  "tarse",
  "metatarse",
  "phalanges-pied",
];
assert(validBuild(standard));
assert(
  validBuild([
    "femur",
    "patella",
    "fibula",
    "tibia",
    "tarse",
    "metatarse",
    "phalanges-pied",
  ]),
);
assert(!validBuild(["fibula", ...standard.slice(1)]));
const questions = createSession(records);
assert.equal(questions.length, 8);
assert.equal(new Set(questions.map((q) => q.type)).size, 5);
for (const q of questions) {
  assert(boneById[q.targetId]);
  if (q.type === "identify") assert(q.options.includes(q.targetId));
}
const filtered = createSession(records, ["ulna", "fibula"]);
assert(filtered.every((q) => ["ulna", "fibula"].includes(q.targetId)));
const parts = createProceduralSkeleton();
const ids = new Set(parts.map((p) => p.id));
for (const b of structures.filter((x) => x.id !== "coxal"))
  assert(ids.has(b.id), "Missing clickable geometry: " + b.id);
console.log(
  "Learning checks passed: mastery, scheduling, aliases, all 5 exercise types, error-only sessions, parallel leg bones and geometry coverage.",
);
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  value: {
    localStorage: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k),
    },
  },
  configurable: true,
});
const { useQuiz } = await import("@/store/quizStore");
const { useProgress } = await import("@/store/progressStore");
useQuiz.getState().start();
const firstTarget = useQuiz.getState().questions[0].targetId;
useQuiz.getState().answer(firstTarget === "femur" ? "tibia" : "femur");
assert.equal(useQuiz.getState().attempts, 1);
assert(!useQuiz.getState().feedback!.correct);
for (let i = 0; i < 8; i++) {
  const q = useQuiz.getState().questions[i];
  if (q.type === "multi") {
    q.expected.forEach((id) => useQuiz.getState().togglePick(id));
    useQuiz.getState().submitMulti();
  } else if (q.type === "build") {
    for (let j = 0; j < q.expected.length; j++) {
      const from = useQuiz.getState().order.indexOf(q.expected[j]);
      useQuiz.getState().reorder(from, j);
    }
    useQuiz.getState().submitBuild();
  } else useQuiz.getState().answer(q.expected[0]);
  assert(useQuiz.getState().feedback!.correct, "Exercise failed: " + q.type);
  const xp = useProgress.getState().xp;
  if (q.type === "multi") useQuiz.getState().submitMulti();
  else if (q.type === "build") useQuiz.getState().submitBuild();
  else useQuiz.getState().answer(q.expected[0]);
  assert.equal(
    useProgress.getState().xp,
    xp,
    "Double-submit must not award XP",
  );
  useQuiz.getState().next();
}
assert(useQuiz.getState().complete);
assert.equal(useProgress.getState().sessions.length, 1);
assert.equal(useProgress.getState().sessions[0].correct, 8);
assert.equal(useQuiz.getState().earned, useProgress.getState().xp);
assert(memory.has("oscar-progress-v1"));
useQuiz.getState().start([firstTarget]);
assert(useQuiz.getState().questions.every((q) => q.targetId === firstTarget));
console.log(
  "Session integration passed: retries, all exercises, duplicate submission protection, XP consistency, completion, local persistence and error-only review.",
);
