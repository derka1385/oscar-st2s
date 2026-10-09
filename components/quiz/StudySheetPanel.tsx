"use client";
import { useI18n } from "@/lib/useI18n";
import { FilePenLine, Check, RotateCcw, ChevronRight } from "lucide-react";
import { useMobileLayout } from "@/lib/useMobileLayout";
import { MobileSheetAnswers } from "../mobile/MobileSheetAnswers";
import { useSheet } from "@/store/sheetStore";
import { useQuiz } from "@/store/quizStore";
import { useAnatomy } from "@/store/anatomyStore";
export function StudySheetPanel() {
  const { t } = useI18n();
  const s = useSheet();
  const mobile = useMobileLayout();
  const correct = Object.values(s.results).filter(Boolean).length;
  const errors = s.ids.filter((id) => !s.results[id]);
  return (
    <aside className="detail-panel sheet-panel">
      <div className="panel-topline">
        <span>
          <FilePenLine size={16} />{t("Mode fiche ")}</span>
      </div>
      <h2>{mobile ? t("À toi de nommer les os") : <>{t("Les bons mots,")}<br />{t("aux bons endroits.")}</>}</h2>
      <p>
        {mobile ? t("Retrouve les {count} repères numérotés sur le squelette.", { count: s.ids.length }) : t("Complète les {count} légendes autour d’Oscar, comme sur ta fiche de cours.", { count: s.ids.length })}
      </p>
      <div className="sheet-instruction">
        <strong>{t("Quelques repères")}</strong>
        <p>{t("La vue de face te permet de retrouver les principales structures. Les anciens noms des os sont aussi acceptés. ")}</p>
      </div>
      <div className="sheet-count">
        <span>{t("Légendes complétées")}</span>
        <strong>
          {s.ids.filter((id) => !!s.answers[id]?.trim()).length} /{" "}
          {s.ids.length}
        </strong>
      </div>
      {mobile && <MobileSheetAnswers />}
      {!s.corrected ? (
        <button className="primary-button" onClick={() => s.check()}>
          <Check size={16} />{t("Corriger ma fiche ")}</button>
      ) : (
        <>
          <div
            className={
              "quiz-feedback " +
              (correct === s.ids.length ? "correct" : "incorrect")
            }
            role="status"
          >
            <strong>
              {t("{correct} / {total} bonnes réponses", { correct, total: s.ids.length })}</strong>
            <p>
              {correct === s.ids.length
                ? t("Tous les repères sont en place. Bravo !")
                : t("Les corrections sont affichées sous chaque légende.")}
            </p>
          </div>
          {errors.length > 0 && (
            <button
              className="primary-button"
              onClick={() => useQuiz.getState().start(errors)}
            >
              <RotateCcw size={16} />{t("Réviser mes erreurs ")}</button>
          )}
          <button className="secondary-button" onClick={() => s.restart()}>{t("Recommencer la fiche ")}</button>
        </>
      )}
      <button
        className="text-button"
        onClick={() => {
          useAnatomy.getState().setMode("explore");
          useAnatomy.getState().reset();
        }}
      >{t("Retour à l’exploration ")}<ChevronRight size={15} />
      </button>
      <div className="local-note">{t("Tes réponses contribuent à ta progression. ")}</div>
    </aside>
  );
}
