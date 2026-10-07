"use client";
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
import { boneById } from "@/data/anatomy/skeleton";
import { groupById, type GroupId } from "@/data/anatomy/groups";
import { typeLabels } from "@/lib/quiz";
import { useState } from "react";
export function QuizPanel() {
  const q = useQuiz();
  const a = useAnatomy();
  const [drag, setDrag] = useState<number | null>(null);
  const question = q.questions[q.index];
  if (!question)
    return (
      <aside className="detail-panel">
        <h2>Prêt à réviser ?</h2>
        <p>Retrouve les structures directement sur Oscar.</p>
        <button className="primary-button" onClick={() => q.start()}>
          Commencer
        </button>
      </aside>
    );
  if (q.complete)
    return (
      <aside className="detail-panel quiz-complete">
        <div className="completion-icon">
          <Trophy size={30} />
        </div>
        <h2>
          Une session
          <br />
          bien construite.
        </h2>
        <p>
          Tu as retrouvé {q.correct} structures et associations sur{" "}
          {q.questions.length} exercices.
        </p>
        <div className="earned-xp">
          +{q.earned}
          <span>XP gagnés</span>
        </div>
        <p className="muted">
          {q.missed.length
            ? `${q.missed.length} structures ont demandé plusieurs essais. Une nouvelle rencontre les rendra plus familières.`
            : "Toutes les structures ont été retrouvées du premier coup."}
        </p>
        {q.missed.length > 0 && (
          <button className="primary-button" onClick={() => q.start(q.missed)}>
            <RotateCcw size={16} />
            Réviser mes erreurs
          </button>
        )}
        <button className="secondary-button" onClick={() => q.start()}>
          Nouvelle session
        </button>
        <button className="text-button" onClick={() => a.setMode("dashboard")}>
          Voir ma progression
          <ChevronRight size={15} />
        </button>
      </aside>
    );
  return (
    <aside className="detail-panel quiz-panel">
      <div className="panel-topline">
        <span>Session de révision</span>
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
      <span className="exercise-kind">{typeLabels[question.type]}</span>
      <h2>{question.prompt}</h2>
      <p className="quiz-instructions">
        {question.type === "locate"
          ? "Tourne Oscar si nécessaire, puis sélectionne la bonne structure."
          : question.type === "identify"
            ? "Observe la structure mise en évidence sur Oscar."
            : question.type === "group"
              ? "Observe l’os mis en évidence, puis choisis sa famille."
              : question.type === "multi"
                ? "Sélectionne les 6 structures sur Oscar. Clique à nouveau pour retirer une sélection."
                : "Glisse les étiquettes du proximal au distal : de la cuisse vers les orteils."}
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
          <span>À toi de jouer sur le modèle 3D</span>
        </div>
      )}
      {question.type === "multi" && (
        <>
          <div className="selected-bones">
            <div>
              <strong>Ta sélection</strong>
              <span>{q.picks.length} / 6</span>
            </div>
            {q.picks.length ? (
              q.picks.map((id) => (
                <button key={id} onClick={() => q.togglePick(id)}>
                  {boneById[id].name}
                  <span>×</span>
                </button>
              ))
            ) : (
              <p>Aucune structure sélectionnée.</p>
            )}
          </div>
          {!q.feedback?.correct && (
            <button
              className="primary-button"
              disabled={!q.picks.length}
              onClick={() => q.submitMulti()}
            >
              Valider ma sélection
            </button>
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
                  aria-label={"Monter " + boneById[id].name}
                  disabled={i === 0 || !!q.feedback?.correct}
                  onClick={() => q.reorder(i, i - 1)}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  aria-label={"Descendre " + boneById[id].name}
                  disabled={i === q.order.length - 1 || !!q.feedback?.correct}
                  onClick={() => q.reorder(i, i + 1)}
                >
                  <ArrowDown size={12} />
                </button>
              </li>
            ))}
          </ol>
          <p className="build-note">
            Le tibia et la fibula sont au même niveau anatomique : les deux
            ordres sont acceptés.
          </p>
          {!q.feedback?.correct && (
            <button className="primary-button" onClick={() => q.submitBuild()}>
              Vérifier l’ordre
            </button>
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
            {q.feedback.correct ? "Bien joué." : "Encore un essai."}
          </strong>
          <p>{q.feedback.message}</p>
          {q.feedback.correct && <small>Ta maîtrise a été mise à jour.</small>}
        </div>
      )}
      {q.attempts >= 2 && !q.feedback?.correct && (
        <div className="quiz-hint">
          <Lightbulb size={16} />
          <p>
            {question.type === "build"
              ? "La cuisse vient avant le genou, puis la jambe et enfin le pied."
              : question.type === "multi"
                ? "Pense au bras, à l’avant-bras, au poignet, à la paume et aux doigts."
                : "Un indice : la région concernée est maintenant mise en évidence."}
          </p>
        </div>
      )}
      {q.feedback?.correct && (
        <button
          className="primary-button next-question"
          onClick={() => q.next()}
        >
          {q.index === q.questions.length - 1
            ? "Terminer la session"
            : "Question suivante"}
          <ChevronRight size={16} />
        </button>
      )}
      <div className="quiz-panel-footer">
        <span>+{q.earned} XP</span>
        <button className="text-button" onClick={() => a.setMode("explore")}>
          Quitter la session
        </button>
      </div>
    </aside>
  );
}
