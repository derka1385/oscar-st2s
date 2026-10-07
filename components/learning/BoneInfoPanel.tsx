"use client";
import {
  Scan,
  EyeOff,
  Bookmark,
  Check,
  Focus,
  Layers,
  Lightbulb,
  ChevronRight,
  Info,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnatomy } from "@/store/anatomyStore";
import { useProgress } from "@/store/progressStore";
import { useQuiz } from "@/store/quizStore";
import { boneById } from "@/data/anatomy/skeleton";
import { groupById } from "@/data/anatomy/groups";
import { effectiveMastery } from "@/lib/mastery";
export function BoneInfoPanel() {
  const a = useAnatomy();
  const p = useProgress();
  const b = a.selected ? boneById[a.selected] : null;
  if (!b)
    return (
      <aside className="detail-panel empty-detail">
        <Info size={25} />
        <h2>Un os, une découverte.</h2>
        <p>
          Sélectionne une structure sur Oscar ou dans l’index pour explorer son
          rôle.
        </p>
      </aside>
    );
  const g = groupById[b.category];
  const saved = p.saved.includes(b.id);
  const mastery = effectiveMastery(p.records[b.id]);
  return (
    <aside className="detail-panel">
      <div className="panel-topline">
        <span>
          <Info size={15} />
          Fiche anatomique
        </span>
        <button
          className="icon-button mobile-close"
          aria-label="Fermer la fiche"
          onClick={() => useAnatomy.setState({ selected: null })}
        >
          <X size={16} />
        </button>
        <span className="panel-code">
          {String(Object.keys(boneById).indexOf(b.id) + 1).padStart(2, "0")} /
          30
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={b.id}
          initial={{ opacity: 0, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="bone-info-content"
        >
          <div className="bone-name">
            <span className="bone-category">
              {g.axial ? "Squelette axial" : "Squelette appendiculaire"}
            </span>
            <h2>{b.name}</h2>
            <button
              className="group-badge"
              style={{ "--group-color": g.color } as React.CSSProperties}
              onClick={() => a.isolate(g.id, "group")}
            >
              <i />
              {g.number && <b>{g.number}</b>}
              {g.shortName}
              <ChevronRight size={13} />
            </button>
          </div>
          <p className="bone-description">{b.description}</p>
          <dl className="anatomy-facts">
            <div>
              <dt>Nom moderne</dt>
              <dd>{b.name}</dd>
            </div>
            <div>
              <dt>Ancien terme</dt>
              <dd>{b.aliases.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt>Groupe</dt>
              <dd>{g.shortName}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>
                {b.kind === "joint"
                  ? "Articulation"
                  : b.kind === "region"
                    ? "Ensemble osseux"
                    : "Os"}
              </dd>
            </div>
          </dl>
          <div className="detail-actions">
            <button
              className={
                "primary-button " +
                (a.isolation?.id === b.id ? "is-active" : "")
              }
              onClick={() =>
                a.isolation?.id === b.id
                  ? useAnatomy.setState({ isolation: null })
                  : a.isolate(b.id)
              }
            >
              <Scan size={16} />
              {a.isolation?.id === b.id
                ? "Quitter l’isolation"
                : "Isoler la structure"}
            </button>
            <div className="split-actions">
              <button className="secondary-button" onClick={() => a.hide(b.id)}>
                <EyeOff size={15} />
                Masquer
              </button>
              <button
                className="secondary-button"
                onClick={() => a.setCamera(b.anchor, 4.5)}
              >
                <Focus size={15} />
                Centrer
              </button>
            </div>
            <button
              className="text-button view-skeleton"
              onClick={() => a.reset()}
            >
              Voir dans le squelette
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="key-point">
            <div>
              <Lightbulb size={17} />
              <strong>À retenir</strong>
            </div>
            <p>{b.fact}</p>
          </div>
          <button
            className="group-context"
            onClick={() => a.isolate(g.id, "group")}
          >
            <Layers size={16} />
            <span>
              Explorer la région<span>{g.shortName}</span>
            </span>
            <ChevronRight size={15} />
          </button>
          <div className="bone-mastery">
            <div>
              <span>Maîtrise de la structure</span>
              <strong>{mastery}%</strong>
            </div>
            <div className="progress-track">
              <i style={{ width: mastery + "%" }} />
            </div>
            <small>
              {p.records[b.id].lastReviewedAt
                ? mastery < 75
                  ? "À revoir · une nouvelle session t’attend."
                  : "Bien acquis · continue à réviser régulièrement."
                : "Pas encore révisée"}
            </small>
          </div>
          <button
            className={"save-button " + (saved ? "saved" : "")}
            onClick={() => p.toggleSaved(b.id)}
          >
            {saved ? <Check size={16} /> : <Bookmark size={16} />}
            <span>
              {saved ? "Ajoutée à mes révisions" : "Ajouter aux révisions"}
            </span>
          </button>
          {saved && (
            <button
              className="text-button"
              onClick={() => useQuiz.getState().start(p.saved)}
            >
              Réviser ma sélection ({p.saved.length})<ChevronRight size={14} />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="detail-footer">BIOLOGIE & PHYSIOPATHOLOGIE HUMAINES</div>
    </aside>
  );
}
