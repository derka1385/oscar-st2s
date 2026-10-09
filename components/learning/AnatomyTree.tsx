"use client";
import { useI18n } from "@/lib/useI18n";
import { useEffect, useRef, useState } from "react";
import { useMobileLayout } from "@/lib/useMobileLayout";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { matchesSearch } from "@/data/anatomy/skeleton";
import { useAnatomy } from "@/store/anatomyStore";
import { useQuiz } from "@/store/quizStore";
import { useProgress } from "@/store/progressStore";
import { effectiveMastery } from "@/lib/mastery";
export function AnatomyTree() {
  const { t, structures, groups } = useI18n();
  const a = useAnatomy();
  const mobile = useMobileLayout();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => useAnatomy.setState({ indexOpen: false });
  useEffect(() => {
    const dialog = dialogRef.current;
    if (mobile && a.indexOpen) { setSearch(""); dialog?.showModal(); }
    else dialog?.close();
    return () => dialog?.close();
  }, [mobile, a.indexOpen]);
  const quiz = useQuiz();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([
    "head",
    "spine",
    "scapular",
    "upper",
    "lower",
  ]);
  const records = useProgress((s) => s.records);
  const question = quiz.questions[quiz.index];
  const isQuiz = a.mode === "quiz" && !quiz.complete;
  const filter = search
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const count = structures.filter(
    (b) => records[b.id] && effectiveMastery(records[b.id]) >= 75,
  ).length;
  const content = (<>
      <div className="index-heading">
        <div className="lesson-number">{t("MODULE 2.1")}</div>
        <button
          autoFocus={mobile}
          className="icon-button mobile-close"
          aria-label={t("Fermer l’index")}
          onClick={() => useAnatomy.setState({ indexOpen: false })}
        >
          <X size={18} />
        </button>
        <h2>
          {mobile ? (isQuiz ? t("Choisir une réponse") : t("Choisir un os")) : <>{t("Organisation et exploration")}<br />{t("du squelette")}</>}
        </h2>
        <div className="lesson-meta">
          <span>{t("BPH")}</span>
          <span>{t("1ʳᵉ ST2S")}</span>
          <span>{t("30 structures")}</span>
        </div>
      </div>
      <div className="index-search">
        <Search size={16} />
        <input
          placeholder={
            isQuiz ? (mobile ? t("Rechercher une réponse…") : t("Choisir un os au clavier…")) : t("Rechercher un os…")
          }
          aria-label={t("Rechercher une structure")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            aria-label={t("Effacer la recherche")}
            onClick={() => setSearch("")}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="index-tree-heading">
        <span>{isQuiz ? (mobile ? t("STRUCTURES") : t("SÉLECTION AU CLAVIER")) : t("INDEX ANATOMIQUE")}</span>
        <span>{structures.length}</span>
      </div>
      <div className="tree-scroll">
        <div className="tree-root">
          <span className="root-line" />
          <strong>{t("Squelette humain")}</strong>
          <span className="tree-count">{t("206 os")}</span>
        </div>
        {groups.map((g) => {
          const bones = structures.filter(
            (b) =>
              b.category === g.id &&
              matchesSearch(b.id, filter),
          );
          if (!bones.length) return null;
          const open = expanded.includes(g.id) || !!search;
          const hidden = a.hiddenGroups.includes(g.id);
          return (
            <div
              className="tree-group"
              key={g.id}
              onMouseEnter={() =>
                !isQuiz && useAnatomy.setState({ hoveredGroup: g.id })
              }
              onMouseLeave={() => useAnatomy.setState({ hoveredGroup: null })}
            >
              <div className={"group-row " + (hidden ? "is-hidden" : "")}>
                <button
                  className="group-expand"
                  onClick={() =>
                    setExpanded((s) =>
                      s.includes(g.id)
                        ? s.filter((x) => x !== g.id)
                        : [...s, g.id],
                    )
                  }
                  aria-expanded={open}
                >
                  {open ? (
                    <ChevronDown size={13} />
                  ) : (
                    <ChevronRight size={13} />
                  )}
                  <i style={{ background: g.color }} />
                  <span>{g.shortName}</span>
                </button>
                {!isQuiz && (
                  <button
                    className="group-eye"
                    aria-label={
                      t(hidden ? "Afficher {name}" : "Masquer {name}", { name: g.shortName })
                    }
                    onClick={() => a.toggleGroup(g.id)}
                  >
                    {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
              {open && (
                <div className="bone-rows">
                  {bones.map((b) => (
                    <button
                      className={
                        "bone-row " +
                        (!isQuiz && a.selected === b.id ? "selected" : "") +
                        (isQuiz && quiz.picks.includes(b.id) ? " picked" : "")
                      }
                      key={b.id}
                      onClick={() => {
                        if (isQuiz) {
                          quiz.answer(b.id);
                          if (mobile && question?.type !== "multi") close();
                        } else {
                          if (a.mode === "dashboard") a.setMode("explore");
                          a.select(b.id);
                          useAnatomy.setState({ indexOpen: false });
                        }
                      }}
                    >
                      <span>{b.name}</span>
                      {!isQuiz && a.selected === b.id ? (
                        <span className="selected-dot" />
                      ) : isQuiz &&
                        question?.type === "multi" &&
                        quiz.picks.includes(b.id) ? (
                        <span>✓</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!structures.some((b) =>
          matchesSearch(b.id, filter),
        ) && (
          <p className="search-empty">{t("Aucune structure trouvée. ")}<br />{t("Essaie un nom ou un ancien terme. ")}</p>
        )}
      </div>
      <div className="index-bottom">
        <div className="module-progress">
          <span>{t("Votre maîtrise")}</span>
          <strong>
            {count} / {structures.length}
          </strong>
        </div>
        <div className="progress-track">
          <i style={{ width: (count / structures.length) * 100 + "%" }} />
        </div>
        <button className="index-study" onClick={() => { if (!(mobile && isQuiz)) quiz.start(); if (mobile) close(); }}>
          <BookOpen size={16} />
          <span>{mobile && isQuiz ? t("Revenir à la question") : t("Passer aux révisions")}</span>
          <ArrowUpRight size={16} />
        </button>
      </div>
    </>
  );
  return mobile ? <dialog ref={dialogRef} className="anatomy-index mobile-index" aria-label={t("Index anatomique")} onCancel={close} onClick={(event) => { if (event.target === dialogRef.current) close(); }}>{content}</dialog> : <aside className={"anatomy-index " + (a.indexOpen ? "index-open" : "")} aria-label={t("Index anatomique")}>{content}</aside>;
}
