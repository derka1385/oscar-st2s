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

// Cyrillic answers must remain distinct after normalization; both vocabularies work.
const { ukrainianBones, ukrainianGroups } = await import("@/data/anatomy/uk");
const { anatomyContent, questionPrompt, feedbackMessage, translate } = await import("./i18n");
const { matchesSearch } = await import("@/data/anatomy/skeleton");
assert.deepEqual(Object.keys(ukrainianBones).sort(), structures.map((b) => b.id).sort());
assert.equal(Object.keys(ukrainianGroups).length, 7);
for (const bone of structures) {
  const uk = ukrainianBones[bone.id];
  assert(uk.description && uk.fact);
  assert(matchesTerm(bone.id, uk.name.toLocaleUpperCase("uk")));
  assert.deepEqual(anatomyContent.uk.boneById[bone.id].modelMeshNames, bone.modelMeshNames);
  assert.deepEqual(anatomyContent.uk.boneById[bone.id].anchor, bone.anchor);
}
assert(!matchesTerm("femur", "Череп"));
assert(!matchesTerm("crane", "Стегнова кістка"));
assert(!matchesTerm("femur", "???"));
assert(matchesTerm("carpe", "зап'ясток"));
assert(matchesSearch("ulna", "cubitus"));
assert(matchesSearch("ulna", "ЛІКТЬОВА"));
assert(!matchesSearch("ulna", "Череп"));
for (const question of questions) {
  assert(/[А-Яа-яІіЇїЄєҐґ]/.test(questionPrompt(question, "uk")));
  assert(/[А-Яа-яІіЇїЄєҐґ]/.test(feedbackMessage(question, true, "uk")));
  assert(/[А-Яа-яІіЇїЄєҐґ]/.test(feedbackMessage(question, false, "uk")));
  assert(!questionPrompt(question, "uk").includes("{name}"));
}
assert.equal(translate("Localise : {name}.", "fr", { name: "le fémur" }), "Localise : le fémur.");
const { useLocale, localeStorageKey } = await import("@/store/localeStore");
const { useSheet } = await import("@/store/sheetStore");
useSheet.getState().setAnswer(useSheet.getState().ids[0], "Череп");
const currentQuiz = useQuiz.getState();
const currentProgress = useProgress.getState();
const currentSheet = useSheet.getState();
useLocale.getState().setLocale("uk");
assert.equal(memory.get(localeStorageKey), "uk");
assert.equal(useQuiz.getState(), currentQuiz);
assert.equal(useProgress.getState(), currentProgress);
assert.equal(useSheet.getState(), currentSheet);
useLocale.setState({ locale: "fr" });
useLocale.getState().hydrate();
assert.equal(useLocale.getState().locale, "uk");
memory.set(localeStorageKey, "invalid");
useLocale.setState({ locale: "fr" });
useLocale.getState().hydrate();
assert.equal(useLocale.getState().locale, "fr");
console.log("Ukrainian checks passed: 30 translations, Cyrillic matching, bilingual search, localized exercises, saved language and unchanged session/progress/answers.");

const { emptyProgress, emptyBranch, parseProgress, parseBranch, captureChanges, importProgress, mergeBranches } = await import("./firebase/progress");
const { switchProgressAccount } = await import("@/store/progressStore");
const baseline = emptyProgress();
const deviceA = { ...baseline, records: { ...baseline.records, femur: applyReview(baseline.records.femur, true, 1, now) }, xp: 15, saved: ["femur"] };
let branchA = captureChanges(emptyBranch(), baseline, deviceA, now);
const combinedA = mergeBranches([branchA]);
assert.equal(combinedA.xp, 15);
assert.equal(combinedA.records.femur.correctAnswers, 1);
assert.deepEqual(combinedA.saved, ["femur"]);
const onDeviceB = { ...combinedA, records: { ...combinedA.records, tibia: applyReview(combinedA.records.tibia, true, 1, now + 1000) }, xp: 30 };
const branchB = captureChanges(emptyBranch(), combinedA, onDeviceB, now + 1000);
const mergedAB = mergeBranches([branchA, branchB]);
assert.equal(mergedAB.xp, 30, "A device only contributes its own XP, never re-uploads another device's totals");
assert.equal(mergedAB.records.femur.correctAnswers, 1);
assert.equal(mergedAB.records.tibia.correctAnswers, 1);
const nextA = { ...mergedAB, records: { ...mergedAB.records, femur: applyReview(mergedAB.records.femur, false, 1, now + 2000) }, saved: [] };
branchA = captureChanges(branchA, mergedAB, nextA, now + 2000);
const finalMerged = mergeBranches([branchA, branchB]);
assert.equal(finalMerged.records.femur.correctAnswers, 1);
assert.equal(finalMerged.records.femur.wrongAnswers, 1);
assert.equal(finalMerged.records.femur.mastery, nextA.records.femur.mastery);
assert.deepEqual(finalMerged.saved, [], "A later removal of a favorite propagates across devices");
assert.deepEqual(mergeBranches([parseBranch(JSON.parse(JSON.stringify(branchA))), branchB]), finalMerged, "Replaying an absolute branch must not duplicate XP or reviews");
assert.deepEqual(mergeBranches([importProgress(deviceA, now)]), deviceA);
assert.equal(parseProgress({ xp: Infinity, saved: ["unknown"], records: { femur: { mastery: 900, name: "untrusted" } } }).records.femur.mastery, 100);
assert.equal(parseProgress({ xp: -20 }).xp, 0);
const guestXP = useProgress.getState().xp;
switchProgressAccount("qa-account-a");
assert.equal(useProgress.getState().xp, 0);
useProgress.getState().record("femur", true);
switchProgressAccount("qa-account-b");
assert.equal(useProgress.getState().xp, 0, "Another account cannot inherit the previous account's progress");
switchProgressAccount("qa-account-a");
assert.equal(useProgress.getState().xp, 15);
switchProgressAccount(null);
assert.equal(useProgress.getState().xp, guestXP, "Signing out restores the separate guest progress");
console.log("Account checks passed: scoped caches, guest restoration, multi-device counters, idempotent cloud snapshots, favorite removal and input validation.");
