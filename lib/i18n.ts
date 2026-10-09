import dictionary from "@/data/i18n/uk-ui.json";
import { boneById as frenchBones, structures as frenchStructures, type AnatomyStructure } from "@/data/anatomy/skeleton";
import { groups as frenchGroups, type GroupId, type AnatomyGroup } from "@/data/anatomy/groups";
import { ukrainianBones, ukrainianGroups } from "@/data/anatomy/uk";
import type { Locale } from "@/store/localeStore";
import type { Question } from "./quiz";
const ukrainian = dictionary as Record<string, string>;
export function translate(text: string, locale: Locale, values?: Record<string, string | number>) {
  const key = text.replace(/\s+/g, " ").trim();
  let result = locale === "uk" && ukrainian[key] ? (text.match(/^\s*/)?.[0] ?? "") + ukrainian[key].trim() + (text.match(/\s*$/)?.[0] ?? "") : text;
  if (values) for (const [name, value] of Object.entries(values)) result = result.replaceAll(`{${name}}`, String(value));
  return result;
}
export function localizedBone(id: string, locale: Locale): AnatomyStructure {
  const bone = frenchBones[id];
  return locale === "uk" ? { ...bone, ...ukrainianBones[id], groupName: ukrainianGroups[bone.category].name } : bone;
}
export function localizedGroup(id: GroupId, locale: Locale): AnatomyGroup {
  const group = frenchGroups.find((item) => item.id === id)!;
  return locale === "uk" ? { ...group, ...ukrainianGroups[id] } : group;
}
export const anatomyContent = Object.fromEntries((["fr", "uk"] as const).map((locale) => {
  const structures = frenchStructures.map((bone) => localizedBone(bone.id, locale));
  const groups = frenchGroups.map((group) => localizedGroup(group.id, locale));
  return [locale, { structures, groups, boneById: Object.fromEntries(structures.map((bone) => [bone.id, bone])), groupById: Object.fromEntries(groups.map((group) => [group.id, group])) as Record<GroupId, AnatomyGroup> }];
})) as Record<Locale, { structures: AnatomyStructure[]; groups: AnatomyGroup[]; boneById: Record<string, AnatomyStructure>; groupById: Record<GroupId, AnatomyGroup> }>;
export function questionPrompt(question: Question, locale: Locale) {
  if (question.type === "locate") return translate("Localise : {name}.", locale, { name: localizedBone(question.targetId, locale).name.toLocaleLowerCase(locale) });
  const prompts = { identify: "Quel est cet os ?", group: "À quel groupe appartient cet os ?", multi: "Sélectionne tous les os du membre supérieur.", build: "Construis le membre inférieur." };
  return translate(prompts[question.type], locale);
}
export function feedbackMessage(question: Question, correct: boolean, locale: Locale) {
  if (question.type === "multi") return translate(correct ? "Correct — les 6 structures sont sélectionnées." : "La sélection est incomplète ou contient un intrus. Réessaie.", locale);
  if (question.type === "build") return translate(correct ? "Correct — du proximal au distal." : "Vérifie l’ordre, de la cuisse vers les orteils.", locale);
  return correct ? translate("Correct — {name}", locale, { name: localizedBone(question.targetId, locale).name }) : translate("Ce n’est pas la bonne réponse. Réessaie.", locale);
}
