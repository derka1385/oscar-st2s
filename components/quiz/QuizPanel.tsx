"use client";
import { useI18n } from "@/lib/useI18n";
import {
  Check,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  GripVertical,
  MousePointer2,
  Lightbulb,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { useQuiz } from "@/store/quizStore";
import { useAnatomy } from "@/store/anatomyStore";
import { type GroupId } from "@/data/anatomy/groups";
import { feedbackMessage } from "@/lib/i18n";
import { typeLabels } from "@/lib/quiz";
import { useState } from "react";
export function QuizPanel() {
  const { t, locale, boneById, groupById, prompt } = useI18n();
  const q = useQuiz();
  const a = useAnatomy();
  const [drag, setDrag] = useState<number | null>(null);
  const question = q.questions[q.index];
  if (!question)
    return (
      <aside className="detail-panel">
        <h2>{t("Prêt à réviser ?")}</h2>
        <p>{t("Retrouve les structures directement sur Oscar.")}</p>
        <button className="primary-button" onClick={() => q.start()}>{t("Commencer ")}</button>
      </aside>
    );
  if (q.complete)
    return (
      <aside className="detail-panel quiz-complete">
        <div className="completion-icon">
          <Trophy size={30} />
        </div>
        <h2>{t("Une session ")}<br />{t("bien construite. ")}</h2>
        <p>{t("Tu as retrouvé {correct} structures et associations sur {total} exercices.", { correct: q.correct, total: q.questions.length })}</p>
        <div className="earned-xp">
          +{q.earned}
          <span>{t("XP gagnés")}</span>
        </div>
        <p className="muted">
          {q.missed.length
            ? t("{count} structures ont demandé plusieurs essais. Une nouvelle rencontre les rendra plus familières.", { count: q.missed.length })
            : t("Toutes les structures ont été retrouvées du premier coup.")}
        </p>
        {q.missed.length > 0 && (
          <button className="primary-button" onClick={() => q.start(q.missed)}>
            <RotateCcw size={16} />{t("Réviser mes erreurs ")}</button>
        )}
        <button className="secondary-button" onClick={() => q.start()}>{t("Nouvelle session ")}</button>
        <button className="text-button" onClick={() => a.setMode("dashboard")}>{t("Voir ma progression ")}<ChevronRight size={15} />
        </button>
      </aside>
    );
  return (
    <aside className="detail-panel quiz-panel">
      <div className="panel-topline">
        <span>{t("Session de révision")}</span>
        <strong>
          {q.index + 1} / {q.questions.length}
        </strong>
      </div>
      <div className="quiz-step-track">
        {q.questions.map((_, i) => (
          <i
            key={i}
            className={i < q.index ? "done" : i === q.index ? "current" : ""}
          />
        ))}
      </div>
      <span className="exercise-kind">{t(typeLabels[question.type])}</span>
      <h2>{prompt(question)}</h2>
      <p className="quiz-instructions">
        {question.type === "locate"
          ? t("Tourne Oscar si nécessaire, puis sélectionne la bonne structure.")
          : question.type === "identify"
            ? t("Observe la structure mise en évidence sur Oscar.")
            : question.type === "group"
              ? t("Observe l’os mis en évidence, puis choisis sa famille.")
              : question.type === "multi"
                ? t("Sélectionne les 6 structures sur Oscar. Clique à nouveau pour retirer une sélection.")
                : t("Glisse les étiquettes du proximal au distal : de la cuisse vers les orteils.")}
      </p>
      {(question.type === "identify" || question.type === "group") && (
        <div className="quiz-options">
          {question.options.map((id, i) => (
            <button
              key={id}
              disabled={!!q.feedback?.correct}
              onClick={() => q.answer(id)}
              className={
                q.feedback?.id === id
                  ? q.feedback.correct
                    ? "option-good"
                    : "option-wrong"
                  : ""
              }
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {question.type === "group"
                ? groupById[id as GroupId].shortName
                : boneById[id].name}
              {q.feedback?.correct && q.feedback.id === id && (
                <Check size={16} />
              )}
            </button>
          ))}
        </div>
      )}
      {question.type === "locate" && (
        <div className="click-instruction">
          <MousePointer2 size={20} />
          <span>{t("À toi de jouer sur le modèle 3D")}</span>
        </div>
      )}
      {question.type === "multi" && (
        <>
          <div className="selected-bones">
            <div>
              <strong>{t("Ta sélection")}</strong>
              <span>{q.picks.length} / 6</span>
            </div>
            {q.picks.length ? (
              q.picks.map((id) => (
                <button key={id} onClick={() => q.togglePick(id)}>
                  {boneById[id].name}
                  <span>{t("×")}</span>
                </button>
              ))
            ) : (
              <p>{t("Aucune structure sélectionnée.")}</p>
            )}
          </div>
          {!q.feedback?.correct && (
            <button
              className="primary-button"
              disabled={!q.picks.length}
              onClick={() => q.submitMulti()}
            >{t("Valider ma sélection ")}</button>
          )}
        </>
      )}
      {question.type === "build" && (
        <>
          <ol className="build-list">
            {q.order.map((id, i) => (
              <li
                key={id}
                draggable={!q.feedback?.correct}
                onDragStart={() => setDrag(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (drag !== null) q.reorder(drag, i);
                  setDrag(null);
                }}
              >
                <GripVertical size={14} />
                <span className="order-number">{i + 1}</span>
                <span>{boneById[id].name}</span>
                <button
                  aria-label={t("Monter {name}", { name: boneById[id].name })}
                  disabled={i === 0 || !!q.feedback?.correct}
                  onClick={() => q.reorder(i, i - 1)}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  aria-label={t("Descendre {name}", { name: boneById[id].name })}
                  disabled={i === q.order.length - 1 || !!q.feedback?.correct}
                  onClick={() => q.reorder(i, i + 1)}
                >
                  <ArrowDown size={12} />
                </button>
              </li>
            ))}
          </ol>
          <p className="build-note">{t("Le tibia et la fibula sont au même niveau anatomique : les deux ordres sont acceptés. ")}</p>
          {!q.feedback?.correct && (
            <button className="primary-button" onClick={() => q.submitBuild()}>{t("Vérifier l’ordre ")}</button>
          )}
        </>
      )}
      {q.feedback && (
        <div
          role="status"
          aria-live="polite"
          className={
            "quiz-feedback " + (q.feedback.correct ? "correct" : "incorrect")
          }
        >
          <strong>
            {q.feedback.correct ? t("Bien joué.") : t("Encore un essai.")}
          </strong>
          <p>{feedbackMessage(question, q.feedback.correct, locale)}</p>
          {q.feedback.correct && <small>{t("Ta maîtrise a été mise à jour.")}</small>}
        </div>
      )}
      {q.attempts >= 2 && !q.feedback?.correct && (
        <div className="quiz-hint">
          <Lightbulb size={16} />
          <p>
            {question.type === "build"
              ? t("La cuisse vient avant le genou, puis la jambe et enfin le pied.")
              : question.type === "multi"
                ? t("Pense au bras, à l’avant-bras, au poignet, à la paume et aux doigts.")
                : t("Un indice : la région concernée est maintenant mise en évidence.")}
          </p>
        </div>
      )}
      {q.feedback?.correct && (
        <button
          className="primary-button next-question"
          onClick={() => q.next()}
        >
          {q.index === q.questions.length - 1
            ? t("Terminer la session")
            : t("Question suivante")}
          <ChevronRight size={16} />
        </button>
      )}
      <div className="quiz-panel-footer">
        <span>+{q.earned}{t(" XP")}</span>
        <button className="text-button" onClick={() => a.setMode("explore")}>{t("Quitter la session ")}</button>
      </div>
    </aside>
  );
}
