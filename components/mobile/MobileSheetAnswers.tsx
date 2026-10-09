"use client";
import { useSheet } from "@/store/sheetStore";
import { boneById } from "@/data/anatomy/skeleton";
export function MobileSheetAnswers() {
  const sheet = useSheet();
  return <ol className="mobile-sheet-answers">{sheet.ids.map((id, i) => <li key={id} className={sheet.corrected ? (sheet.results[id] ? "correct" : "incorrect") : ""}>
    <label htmlFor={"mobile-answer-" + id}><span>{i + 1}</span>Repère {i + 1}</label>
    <input id={"mobile-answer-" + id} autoComplete="off" enterKeyHint="next" aria-describedby={sheet.corrected ? "mobile-correction-" + id : undefined} placeholder="Nom de l’os…" value={sheet.answers[id] ?? ""} disabled={sheet.corrected} onChange={(event) => sheet.setAnswer(id, event.target.value)} />
    {sheet.corrected && <small id={"mobile-correction-" + id}>{sheet.results[id] ? "Bonne réponse" : "Réponse : " + boneById[id].name}</small>}
  </li>)}</ol>;
}
