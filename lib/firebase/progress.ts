import { freshRecords, type ReviewRecord } from "@/lib/mastery";
export type Session = { at: string; correct: number; total: number; xp: number };
export type ProgressData = { records: Record<string, ReviewRecord>; saved: string[]; xp: number; sessions: Session[] };
export type ProgressBranch = ProgressData & { version: 1; updatedAt: number; favorites: Record<string, { value: boolean; at: number }> };
export const emptyProgress = (): ProgressData => ({ records: freshRecords(), saved: [], xp: 0, sessions: [] });
export const emptyBranch = (): ProgressBranch => ({ ...emptyProgress(), version: 1, updatedAt: 0, favorites: {} });
const finite = (value: unknown, max = 1e9) => typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;
const date = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
/** Treat both cloud and local cache as untrusted data. Keep the canonical anatomy IDs. */
export function parseProgress(value: unknown): ProgressData {
  const result = emptyProgress();
  if (!value || typeof value !== "object") return result;
  const input = value as Partial<ProgressData>;
  for (const [id, base] of Object.entries(result.records)) {
    const r = input.records?.[id];
    if (!r || typeof r !== "object") continue;
    result.records[id] = { ...base, mastery: finite(r.mastery, 100), correctAnswers: finite(r.correctAnswers), wrongAnswers: finite(r.wrongAnswers), streak: finite(r.streak), lastReviewedAt: date(r.lastReviewedAt), nextReviewAt: date(r.nextReviewAt), recentPerformance: Array.isArray(r.recentPerformance) ? r.recentPerformance.filter((x) => typeof x === "boolean").slice(-5) : [] };
  }
  result.xp = finite(input.xp);
  result.saved = Array.isArray(input.saved) ? [...new Set(input.saved.filter((id) => typeof id === "string" && id in result.records))] : [];
  result.sessions = Array.isArray(input.sessions) ? input.sessions.filter((s) => s && date(s.at) && Number.isFinite(s.correct) && Number.isFinite(s.total) && Number.isFinite(s.xp)).map((s) => ({ at: s.at, correct: finite(s.correct, 100), total: finite(s.total, 100), xp: finite(s.xp) })).slice(0, 30) : [];
  return result;
}
export function parseBranch(value: unknown): ProgressBranch {
  const branch = { ...emptyBranch(), ...parseProgress(value) };
  if (!value || typeof value !== "object") return branch;
  const input = value as Partial<ProgressBranch>;
  branch.updatedAt = finite(input.updatedAt, Number.MAX_SAFE_INTEGER);
  if (input.favorites && typeof input.favorites === "object") for (const [id, flag] of Object.entries(input.favorites)) {
    if (id in branch.records && flag && typeof flag.value === "boolean") branch.favorites[id] = { value: flag.value, at: finite(flag.at, Number.MAX_SAFE_INTEGER) };
  }
  return branch;
}
export const snapshotProgress = (state: ProgressData): ProgressData => ({ records: state.records, saved: state.saved, xp: state.xp, sessions: state.sessions });
export const hasProgress = (data: ProgressData) => data.xp > 0 || data.saved.length > 0 || data.sessions.length > 0 || Object.values(data.records).some((r) => r.correctAnswers || r.wrongAnswers);
/** Each browser tab owns a branch. Absolute writes are idempotent; tabs/devices never overwrite each other. */
export function captureChanges(branch: ProgressBranch, before: ProgressData, after: ProgressData, now = Date.now()): ProgressBranch {
  const next = { ...branch, records: { ...branch.records }, favorites: { ...branch.favorites }, updatedAt: Math.max(now, branch.updatedAt + 1) };
  for (const [id, r] of Object.entries(after.records)) {
    const old = before.records[id];
    if (r === old || !old) continue;
    const correct = Math.max(0, r.correctAnswers - old.correctAnswers), wrong = Math.max(0, r.wrongAnswers - old.wrongAnswers);
    if (correct || wrong) next.records[id] = { ...r, correctAnswers: branch.records[id].correctAnswers + correct, wrongAnswers: branch.records[id].wrongAnswers + wrong };
  }
  next.xp += Math.max(0, after.xp - before.xp);
  for (const id of new Set([...before.saved, ...after.saved])) if (before.saved.includes(id) !== after.saved.includes(id)) next.favorites[id] = { value: after.saved.includes(id), at: next.updatedAt };
  next.saved = Object.entries(next.favorites).filter(([, flag]) => flag.value).map(([id]) => id);
  next.sessions = [...after.sessions.filter((s) => !before.sessions.some((old) => old.at === s.at)), ...branch.sessions].slice(0, 30);
  return next;
}
export function importProgress(data: ProgressData, now = Date.now()): ProgressBranch {
  return { ...emptyBranch(), ...parseProgress(data), updatedAt: now, favorites: Object.fromEntries(data.saved.map((id) => [id, { value: true, at: now }])) };
}
export function mergeBranches(branches: ProgressBranch[]): ProgressData {
  const result = emptyProgress(), favorites: ProgressBranch["favorites"] = {};
  const sessions = new Map<string, Session>();
  for (const branch of branches) {
    result.xp += branch.xp;
    for (const [id, r] of Object.entries(branch.records)) {
      const current = result.records[id];
      if (!current) continue;
      const latest = Date.parse(r.lastReviewedAt ?? "") > Date.parse(current.lastReviewedAt ?? "1970-01-01") ? r : current;
      result.records[id] = { ...latest, correctAnswers: current.correctAnswers + r.correctAnswers, wrongAnswers: current.wrongAnswers + r.wrongAnswers };
    }
    for (const [id, flag] of Object.entries(branch.favorites)) if (!favorites[id] || flag.at >= favorites[id].at) favorites[id] = flag;
    for (const s of branch.sessions) sessions.set(s.at, s);
  }
  result.saved = Object.entries(favorites).filter(([, flag]) => flag.value).map(([id]) => id);
  result.sessions = [...sessions.values()].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 30);
  return result;
}
