import { create } from "zustand";
import { sheetIds, matchesTerm } from "@/data/anatomy/skeleton";
import { useProgress } from "./progressStore";
type State = {
  ids: string[];
  answers: Record<string, string>;
  corrected: boolean;
  results: Record<string, boolean>;
  setAnswer: (id: string, value: string) => void;
  check: () => void;
  restart: (ids?: string[]) => void;
};
export const useSheet = create<State>((set, get) => ({
  ids: sheetIds,
  answers: {},
  corrected: false,
  results: {},
  setAnswer: (id, value) =>
    set((s) => (s.corrected ? {} : { answers: { ...s.answers, [id]: value } })),
  check: () => {
    const s = get();
    if (s.corrected) return;
    const results = Object.fromEntries(
      s.ids.map((id) => [id, matchesTerm(id, s.answers[id] ?? "")]),
    );
    for (const id of s.ids) useProgress.getState().record(id, results[id]);
    set({ corrected: true, results });
  },
  restart: (ids = sheetIds) =>
    set({ ids, answers: {}, corrected: false, results: {} }),
}));
