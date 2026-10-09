"use client";
import { useI18n } from "@/lib/useI18n";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Bookmark,
  Clock3,
} from "lucide-react";
import { useProgress } from "@/store/progressStore";
import { useQuiz } from "@/store/quizStore";
import { effectiveMastery } from "@/lib/mastery";
import { reviewQueue, dueToday } from "@/lib/spacedRepetition";
import { structures } from "@/data/anatomy/skeleton";
export function Dashboard() {
  const { t, locale, groups, boneById } = useI18n();
  const p = useProgress();
  const records = Object.values(p.records);
  const average = Math.round(
    records.reduce((s, r) => s + effectiveMastery(r), 0) / records.length,
  );
  const due = reviewQueue(p.records).filter((r) => dueToday(r));
  return (
    <aside className="detail-panel dashboard-panel">
      <div className="panel-topline">
        <span>
          <BookOpen size={15} />{t("Mon apprentissage ")}</span>
      </div>
      <h2>{t("Chaque os ")}<br />{t("à son rythme. ")}</h2>
      <p className="muted">{t("Tes révisions, au bon moment.")}</p>
      <div className="global-progress">
        <div>
          <span>{t("Progression globale")}</span>
          <strong>
            {average}
            <small>%</small>
          </strong>
        </div>
        <div className="progress-track">
          <i style={{ width: average + "%" }} />
        </div>
        <p>
          {t("{count} structures révisées sur {total}", { count: records.filter((r) => r.lastReviewedAt).length, total: structures.length })}
        </p>
      </div>
      <div className="dashboard-groups">
        {groups
          .filter((g) => g.number)
          .sort((a, b) => a.number! - b.number!)
          .map((g) => {
            const rs = records.filter((r) => r.group === g.id);
            const percent = Math.round(
              rs.reduce((s, r) => s + effectiveMastery(r), 0) / rs.length,
            );
            return (
              <div className="dashboard-group" key={g.id}>
                <div>
                  <span>
                    <b style={{ color: g.color }}>{g.number}</b>
                    {g.shortName}
                  </span>
                  <strong>{percent}%</strong>
                </div>
                <div className="progress-track">
                  <i style={{ width: percent + "%", background: g.color }} />
                </div>
              </div>
            );
          })}
      </div>
      <div className="due-heading">
        <h3>{t("À revoir aujourd’hui")}</h3>
        <span>{due.length}</span>
      </div>
      {due.length ? (
        <div className="due-list">
          {due.slice(0, 4).map((r) => (
            <button key={r.id} onClick={() => useQuiz.getState().start([r.id])}>
              <span>{boneById[r.id].name}</span>
              <span>
                {r.lastReviewedAt ? effectiveMastery(r) + "%" : t("À découvrir")}
                <ArrowUpRight size={13} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="muted">
          <CheckCircle2 size={16} />{t(" Tout est à jour pour aujourd’hui. ")}</p>
      )}
      <button
        className="primary-button"
        onClick={() => useQuiz.getState().start()}
      >
        <BookOpen size={16} />{t("Commencer une session ")}</button>
      <div className="session-duration">
        <Clock3 size={13} />{t("8 questions · environ 8 min ")}</div>
      {p.saved.length > 0 && (
        <button
          className="saved-session secondary-button"
          onClick={() => useQuiz.getState().start(p.saved)}
        >
          <Bookmark size={15} />{t("Ma sélection · {count} structures", { count: p.saved.length })}</button>
      )}
      <div className="session-history">
        <h3>{t("Dernière session")}</h3>
        {p.sessions[0] ? (
          <p>
            {p.sessions[0].correct}/{p.sessions[0].total}{t(" réponses justes · + ")}{p.sessions[0].xp}{t(" XP ")}<br />
            <small>
              {new Date(p.sessions[0].at).toLocaleDateString(locale === "uk" ? "uk-UA" : "fr-FR")}
            </small>
          </p>
        ) : (
          <p>{t("Ta première session commence ici.")}</p>
        )}
      </div>
      <div className="local-note">{t("Progression enregistrée sur cet appareil. ")}</div>
    </aside>
  );
}
