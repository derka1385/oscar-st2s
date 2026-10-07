import { boneById, structures } from "@/data/anatomy/skeleton";
import { groups } from "@/data/anatomy/groups";
import { reviewQueue } from "./spacedRepetition";
import type { ReviewRecord } from "./mastery";
export type QuestionType = "locate" | "identify" | "group" | "multi" | "build";
export type Question = {
  type: QuestionType;
  targetId: string;
  prompt: string;
  options: string[];
  expected: string[];
};
export const typeLabels: Record<QuestionType, string> = {
  locate: "Localiser",
  identify: "Identifier",
  group: "Associer",
  multi: "Sélectionner",
  build: "Construire",
};
export function createSession(
  records: Record<string, ReviewRecord>,
  filter?: string[],
): Question[] {
  const queue = reviewQueue(records, filter).filter((r) => r.id !== "coxal");
  const targets = queue.map((r) => r.id);
  if (!targets.length) return [];
  const types: QuestionType[] = filter
    ? ["locate", "identify"]
    : [
        "locate",
        "identify",
        "group",
        "multi",
        "build",
        "locate",
        "identify",
        "locate",
      ];
  return types.map((type, i) => {
    const targetId = targets[i % targets.length];
    const b = boneById[targetId];
    const distractors = structures
      .filter((x) => x.id !== targetId && x.kind !== "joint")
      .sort(
        (a, c) =>
          Number(c.category === b.category) - Number(a.category === b.category),
      )
      .slice(0, 3)
      .map((x) => x.id);
    const options = [targetId, ...distractors];
    const shift = (i + 2) % 4;
    options.push(...options.splice(0, shift));
    if (type === "group")
      return {
        type,
        targetId,
        prompt: "À quel groupe appartient cet os ?",
        options: groups.map((g) => g.id),
        expected: [b.category],
      };
    if (type === "multi")
      return {
        type,
        targetId: "humerus",
        prompt: "Sélectionne tous les os du membre supérieur.",
        options: [],
        expected: structures
          .filter((x) => x.category === "upper")
          .map((x) => x.id),
      };
    if (type === "build")
      return {
        type,
        targetId: "femur",
        prompt: "Construis le membre inférieur.",
        options: [
          "fibula",
          "femur",
          "tarse",
          "tibia",
          "metatarse",
          "patella",
          "phalanges-pied",
        ],
        expected: [
          "femur",
          "patella",
          "tibia",
          "fibula",
          "tarse",
          "metatarse",
          "phalanges-pied",
        ],
      };
    return {
      type,
      targetId,
      prompt:
        type === "locate"
          ? `Localise : ${b.name.toLocaleLowerCase("fr")}.`
          : "Quel est cet os ?",
      options: type === "identify" ? options : [],
      expected: [targetId],
    };
  });
}
// Tibia and fibula are parallel bones of the leg, so either order is accepted.
export function validBuild(order: string[]) {
  return (
    order.length === 7 &&
    order[0] === "femur" &&
    order[1] === "patella" &&
    [order[2], order[3]].sort().join(",") === "fibula,tibia" &&
    order[4] === "tarse" &&
    order[5] === "metatarse" &&
    order[6] === "phalanges-pied"
  );
}
