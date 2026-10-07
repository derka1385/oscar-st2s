"use client";
import { useState } from "react";
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
import { groups } from "@/data/anatomy/groups";
import { structures } from "@/data/anatomy/skeleton";
import { useAnatomy } from "@/store/anatomyStore";
import { useQuiz } from "@/store/quizStore";
import { useProgress } from "@/store/progressStore";
import { effectiveMastery } from "@/lib/mastery";
export function AnatomyTree() {
  const a = useAnatomy();
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
  return (
    <aside
      className={"anatomy-index " + (a.indexOpen ? "index-open" : "")}
      aria-label="Index anatomique"
    >
      <div className="index-heading">
        <div className="lesson-number">MODULE 2.1</div>
        <button
          className="icon-button mobile-close"
          aria-label="Fermer l’index"
          onClick={() => useAnatomy.setState({ indexOpen: false })}
        >
          <X size={18} />
        </button>
        <h2>
          Organisation et exploration
          <br />
          du squelette
        </h2>
        <div className="lesson-meta">
          <span>BPH</span>
          <span>1ʳᵉ ST2S</span>
          <span>30 structures</span>
        </div>
      </div>
      <div className="index-search">
        <Search size={16} />
        <input
          placeholder={
            isQuiz ? "Choisir un os au clavier…" : "Rechercher un os…"
          }
          aria-label="Rechercher une structure"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            aria-label="Effacer la recherche"
            onClick={() => setSearch("")}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="index-tree-heading">
        <span>{isQuiz ? "SÉLECTION AU CLAVIER" : "INDEX ANATOMIQUE"}</span>
        <span>{structures.length}</span>
      </div>
      <div className="tree-scroll">
        <div className="tree-root">
          <span className="root-line" />
          <strong>Squelette humain</strong>
          <span className="tree-count">206 os</span>
        </div>
        {groups.map((g) => {
          const bones = structures.filter(
            (b) =>
              b.category === g.id &&
              (b.name + " " + b.aliases.join(" "))
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .includes(filter),
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
                      (hidden ? "Afficher " : "Masquer ") + g.shortName
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
          (b.name + " " + b.aliases.join(" "))
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .includes(filter),
        ) && (
          <p className="search-empty">
            Aucune structure trouvée.
            <br />
            Essaie un nom ou un ancien terme.
          </p>
        )}
      </div>
      <div className="index-bottom">
        <div className="module-progress">
          <span>Votre maîtrise</span>
          <strong>
            {count} / {structures.length}
          </strong>
        </div>
        <div className="progress-track">
          <i style={{ width: (count / structures.length) * 100 + "%" }} />
        </div>
        <button className="index-study" onClick={() => quiz.start()}>
          <BookOpen size={16} />
          <span>Passer aux révisions</span>
          <ArrowUpRight size={16} />
        </button>
      </div>
    </aside>
  );
}
