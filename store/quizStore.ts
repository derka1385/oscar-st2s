import { create } from "zustand";
import { createSession, validBuild, type Question } from "@/lib/quiz";
import { useProgress } from "./progressStore";
import { useAnatomy } from "./anatomyStore";
export type Feedback = { correct: boolean; message: string; id?: string };
type State = {
  questions: Question[];
  index: number;
  attempts: number;
  feedback: Feedback | null;
  picks: string[];
  order: string[];
  missed: string[];
  complete: boolean;
  correct: number;
  earned: number;
  flash: string | null;
  flashCorrect: boolean;
  start: (ids?: string[]) => void;
  answer: (value: string) => void;
  togglePick: (id: string) => void;
  submitMulti: () => void;
  submitBuild: () => void;
  reorder: (from: number, to: number) => void;
  next: () => void;
};
const initial = {
  questions: [] as Question[],
  index: 0,
  attempts: 0,
  feedback: null,
  picks: [] as string[],
  order: [] as string[],
  missed: [] as string[],
  complete: false,
  correct: 0,
  earned: 0,
  flash: null,
  flashCorrect: false,
};
export const useQuiz = create<State>((set, get) => ({
  ...initial,
  start: (ids) => {
    const questions = createSession(useProgress.getState().records, ids);
    set({
      ...initial,
      questions,
      order: questions[0]?.type === "build" ? [...questions[0].options] : [],
    });
    useAnatomy.getState().setMode("quiz");
    useAnatomy.getState().reset();
  },
  answer: (value) => {
    const s = get();
    const q = s.questions[s.index];
    if (!q || s.feedback?.correct || s.complete) return;
    if (q.type === "multi") {
      get().togglePick(value);
      return;
    }
    if (q.type === "build") return;
    const correct = q.expected.includes(value);
    useProgress.getState().record(q.targetId, correct, s.attempts + 1);
    set({
      attempts: s.attempts + Number(!correct),
      feedback: {
        correct,
        message: correct
          ? `Correct — ${q.type === "group" ? useProgress.getState().records[q.targetId].name : useProgress.getState().records[q.targetId].name}`
          : "Ce n’est pas la bonne réponse. Réessaie.",
        id: value,
      },
      flash: q.type === "group" ? q.targetId : value,
      flashCorrect: correct,
      correct: s.correct + Number(correct),
      earned: s.earned + (correct ? Math.max(5, 15 - s.attempts * 3) : 0),
      missed: correct ? s.missed : [...new Set([...s.missed, q.targetId])],
    });
    setTimeout(() => set({ flash: null }), 900);
  },
  togglePick: (id) =>
    set((s) =>
      s.feedback?.correct
        ? {}
        : {
            picks: s.picks.includes(id)
              ? s.picks.filter((x) => x !== id)
              : [...s.picks, id],
            feedback: null,
          },
    ),
  submitMulti: () => {
    const s = get(),
      q = s.questions[s.index];
    if (!q || s.feedback?.correct) return;
    const xpBefore = useProgress.getState().xp;
    const good =
      q.expected.every((x) => s.picks.includes(x)) &&
      s.picks.every((x) => q.expected.includes(x));
    for (const id of new Set([...q.expected, ...s.picks])) {
      useProgress
        .getState()
        .record(
          id,
          good || q.expected.includes(id) === s.picks.includes(id),
          s.attempts + 1,
        );
    }
    set({
      feedback: {
        correct: good,
        message: good
          ? "Correct — les 6 structures sont sélectionnées."
          : "La sélection est incomplète ou contient un intrus. Réessaie.",
      },
      attempts: s.attempts + Number(!good),
      correct: s.correct + Number(good),
      earned: s.earned + useProgress.getState().xp - xpBefore,
      missed: good
        ? s.missed
        : [
            ...new Set([
              ...s.missed,
              ...q.expected.filter((x) => !s.picks.includes(x)),
              ...s.picks.filter((x) => !q.expected.includes(x)),
            ]),
          ],
    });
  },
  submitBuild: () => {
    const s = get();
    if (s.feedback?.correct) return;
    const xpBefore = useProgress.getState().xp;
    const good = validBuild(s.order);
    s.order.forEach((id) =>
      useProgress.getState().record(id, good, s.attempts + 1),
    );
    set({
      feedback: {
        correct: good,
        message: good
          ? "Correct — du proximal au distal."
          : "Vérifie l’ordre, de la cuisse vers les orteils.",
      },
      attempts: s.attempts + Number(!good),
      correct: s.correct + Number(good),
      earned: s.earned + useProgress.getState().xp - xpBefore,
      missed: good ? s.missed : [...new Set([...s.missed, ...s.order])],
    });
  },
  reorder: (from, to) =>
    set((s) => {
      if (s.feedback?.correct) return {};
      const order = [...s.order];
      const [x] = order.splice(from, 1);
      order.splice(to, 0, x);
      return { order, feedback: null };
    }),
  next: () => {
    const s = get();
    if (!s.feedback?.correct) return;
    const index = s.index + 1;
    if (index >= s.questions.length) {
      useProgress.getState().finish(s.correct, s.questions.length, s.earned);
      set({ complete: true, flash: null });
      return;
    }
    const q = s.questions[index];
    set({
      index,
      attempts: 0,
      feedback: null,
      picks: [],
      order: q.type === "build" ? [...q.options] : [],
      flash: null,
    });
    useAnatomy.getState().reset();
  },
}));
