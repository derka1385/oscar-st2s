import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { freshRecords, applyReview, type ReviewRecord } from "@/lib/mastery";
const storageFailure = () =>
  queueMicrotask(() => {
    if (!useProgress.getState().storageError)
      useProgress.setState({ storageError: true });
  });
const safeStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      return typeof window === "undefined"
        ? null
        : window.localStorage.getItem(name);
    } catch {
      storageFailure();
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      storageFailure();
    }
  },
  removeItem: (name: string) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      storageFailure();
    }
  },
}));
type Session = { at: string; correct: number; total: number; xp: number };
type Progress = {
  records: Record<string, ReviewRecord>;
  saved: string[];
  xp: number;
  sessions: Session[];
  storageError: boolean;
  record: (id: string, correct: boolean, attempts?: number) => void;
  toggleSaved: (id: string) => void;
  finish: (correct: number, total: number, xp: number) => void;
};
export const useProgress = create<Progress>()(
  persist(
    (set) => ({
      records: freshRecords(),
      saved: [],
      xp: 0,
      sessions: [],
      storageError: false,
      record: (id, correct, attempts = 1) =>
        set((s) => ({
          records: {
            ...s.records,
            [id]: applyReview(
              s.records[id] ?? freshRecords()[id],
              correct,
              attempts,
            ),
          },
          xp: s.xp + (correct ? Math.max(5, 15 - (attempts - 1) * 3) : 0),
        })),
      toggleSaved: (id) =>
        set((s) => ({
          saved: s.saved.includes(id)
            ? s.saved.filter((x) => x !== id)
            : [...s.saved, id],
        })),
      finish: (correct, total, xp) =>
        set((s) => ({
          sessions: [
            { at: new Date().toISOString(), correct, total, xp },
            ...s.sessions,
          ].slice(0, 30),
        })),
    }),
    {
      name: "oscar-progress-v1",
      version: 1,
      skipHydration: true,
      storage: safeStorage,
      partialize: ({ records, saved, xp, sessions }) => ({
        records,
        saved,
        xp,
        sessions,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<Progress>;
        return {
          ...current,
          ...p,
          records: { ...freshRecords(), ...(p?.records ?? {}) },
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) storageFailure();
      },
    },
  ),
);
