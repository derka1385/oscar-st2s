"use client";
import { useI18n } from "@/lib/useI18n";
import { useSheet } from "@/store/sheetStore";
export function MobileSheetAnswers() {
  const { t, boneById } = useI18n();
  const sheet = useSheet();
  return <ol className="mobile-sheet-answers">{sheet.ids.map((id, i) => <li key={id} className={sheet.corrected ? (sheet.results[id] ? "correct" : "incorrect") : ""}>
    <label htmlFor={"mobile-answer-" + id}><span>{i + 1}</span>{t("Repère {number}", { number: i + 1 })}</label>
    <input id={"mobile-answer-" + id} autoComplete="off" enterKeyHint="next" aria-describedby={sheet.corrected ? "mobile-correction-" + id : undefined} placeholder={t("Nom de l’os…")} value={sheet.answers[id] ?? ""} disabled={sheet.corrected} onChange={(event) => sheet.setAnswer(id, event.target.value)} />
    {sheet.corrected && <small id={"mobile-correction-" + id}>{sheet.results[id] ? t("Bonne réponse") : t("Réponse : {name}", { name: boneById[id].name })}</small>}
  </li>)}</ol>;
}
