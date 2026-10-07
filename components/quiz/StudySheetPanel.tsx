"use client";
import { FilePenLine, Check, RotateCcw, ChevronRight } from "lucide-react";
import { useSheet } from "@/store/sheetStore";
import { useQuiz } from "@/store/quizStore";
import { useAnatomy } from "@/store/anatomyStore";
export function StudySheetPanel() {
  const s = useSheet();
  const correct = Object.values(s.results).filter(Boolean).length;
  const errors = s.ids.filter((id) => !s.results[id]);
  return (
    <aside className="detail-panel sheet-panel">
      <div className="panel-topline">
        <span>
          <FilePenLine size={16} />
          Mode fiche
        </span>
      </div>
      <h2>
        Les bons mots,
        <br />
        aux bons endroits.
      </h2>
      <p>
        Complète les {s.ids.length} légendes autour d’Oscar, comme sur ta fiche
        de cours.
      </p>
      <div className="sheet-instruction">
        <strong>Quelques repères</strong>
        <p>
          La vue de face te permet de retrouver les principales structures. Les
          anciens noms des os sont aussi acceptés.
        </p>
      </div>
      <div className="sheet-count">
        <span>Légendes complétées</span>
        <strong>
          {s.ids.filter((id) => !!s.answers[id]?.trim()).length} /{" "}
          {s.ids.length}
        </strong>
      </div>
      {!s.corrected ? (
        <button className="primary-button" onClick={() => s.check()}>
          <Check size={16} />
          Corriger ma fiche
        </button>
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
              {correct} / {s.ids.length} bonnes réponses
            </strong>
            <p>
              {correct === s.ids.length
                ? "Tous les repères sont en place. Bravo !"
                : "Les corrections sont affichées sous chaque légende."}
            </p>
          </div>
          {errors.length > 0 && (
            <button
              className="primary-button"
              onClick={() => useQuiz.getState().start(errors)}
            >
              <RotateCcw size={16} />
              Réviser mes erreurs
            </button>
          )}
          <button className="secondary-button" onClick={() => s.restart()}>
            Recommencer la fiche
          </button>
        </>
      )}
      <button
        className="text-button"
        onClick={() => {
          useAnatomy.getState().setMode("explore");
          useAnatomy.getState().reset();
        }}
      >
        Retour à l’exploration
        <ChevronRight size={15} />
      </button>
      <div className="local-note">
        Tes réponses contribuent à ta progression.
      </div>
    </aside>
  );
}
