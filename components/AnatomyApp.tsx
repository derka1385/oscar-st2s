"use client";
import Link from "next/link";
import { useMobileLayout } from "@/lib/useMobileLayout";
import { MobileUI } from "./mobile/MobileUI";
import { useClientReady } from "@/lib/useClientReady";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Layers3,
  ChartNoAxesCombined,
  CircleHelp,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  MousePointer2,
  RotateCcw,
  Plus,
  Minus,
  Maximize,
  ListFilter,
  Tags,
  FilePenLine,
  X,
  Box,
  Rotate3D,
  Move,
  Search,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { SkeletonScene } from "./anatomy/SkeletonScene";
import { AnatomyTree } from "./learning/AnatomyTree";
import { BoneInfoPanel } from "./learning/BoneInfoPanel";
import { VisibilityPanel } from "./learning/VisibilityPanel";
import { Dashboard } from "./learning/Dashboard";
import { QuizPanel } from "./quiz/QuizPanel";
import { StudySheetPanel } from "./quiz/StudySheetPanel";
import { useAnatomy, type CameraRequest } from "@/store/anatomyStore";
import { useQuiz } from "@/store/quizStore";
import { useProgress } from "@/store/progressStore";
import { useSheet } from "@/store/sheetStore";
import { groups } from "@/data/anatomy/groups";
import { boneById, type Vec3 } from "@/data/anatomy/skeleton";
const views: { label: string; direction: CameraRequest["direction"] }[] = [
  { label: "Face", direction: "front" },
  { label: "Dos", direction: "back" },
  { label: "Profil gauche", direction: "left" },
  { label: "Profil droit", direction: "right" },
];
const areas: { label: string; target: Vec3; distance: number }[] = [
  { label: "Corps entier", target: [0, 4.0, 0], distance: 16.5 },
  { label: "Tête", target: [0, 7.91, 0], distance: 2.9 },
  { label: "Thorax", target: [0, 6.25, 0], distance: 5.2 },
  { label: "Bassin", target: [0, 4.55, 0], distance: 4.2 },
  { label: "Membres supérieurs", target: [0, 5.5, 0], distance: 8.6 },
  { label: "Membres inférieurs", target: [0, 2.3, 0], distance: 7.6 },
];
function Help({ close }: { close: () => void }) {
  const mobile = useMobileLayout();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
  return (
    <dialog
      className="help-dialog"
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="popover-heading">
        <h2>Prendre Oscar en main</h2>
        <button
          className="icon-button"
          autoFocus
          aria-label="Fermer l’aide"
          onClick={close}
        >
          <X size={19} />
        </button>
      </div>
      <p>Observe, manipule et apprends à ton rythme.</p>
      <div className="help-row">
        <Rotate3D />
        <div>
          <strong>Tourner le squelette</strong>
          <span>{mobile ? "Glisse avec un doigt sur le modèle." : "Glisser avec le bouton gauche · un doigt sur tablette"}</span>
        </div>
      </div>
      <div className="help-row">
        <Search />
        <div>
          <strong>Se rapprocher</strong>
          <span>{mobile ? "Pince avec deux doigts ou utilise + et −." : "Molette ou pincement à deux doigts"}</span>
        </div>
      </div>
      <div className="help-row">
        <Move />
        <div>
          <strong>Déplacer la vue</strong>
          <span>{mobile ? "Glisse avec deux doigts." : "Glisser avec le bouton droit · deux doigts"}</span>
        </div>
      </div>
      <div className="help-row">
        <MousePointer2 />
        <div>
          <strong>Explorer une structure</strong>
          <span>
            {mobile ? "Touche un os, puis ouvre sa fiche en bas de l’écran." : "Cliquer pour ouvrir sa fiche · double-cliquer pour l’isoler"}
          </span>
        </div>
      </div>
      <div className="help-row">
        <Maximize />
        <div>
          <strong>Retrouver le squelette entier</strong>
          <span>{mobile ? "Vue 3D → Retrouver le squelette entier." : "Échap ou le bouton Réinitialiser"}</span>
        </div>
      </div>
      <p className="help-accessibility">
        {mobile ? "Choisir un os ouvre la recherche. En révision, la liste permet aussi de répondre sans viser le modèle." : "Au clavier, utilise l’index anatomique pour sélectionner une structure. En révision, l’index propose aussi les réponses au clavier."}
      </p>
      <div className="help-model">
        <Box size={17} />
        <p>
          Oscar utilise les maillages anatomiques BodyParts3D. Le coccyx et la
          symphyse pubienne sont schématisés. Les zones de sélection de
          l’ilium, de l’ischion et du pubis sont approximatives sur l’os coxal fusionné.
        </p>
      </div>
      <a href="/models/ATTRIBUTION.md" target="_blank" rel="noreferrer" className="text-button">
        Modèle 3D : sources et licence <ArrowUpRight size={14} />
      </a>
      <a
        href="https://openstax.org/books/anatomy-and-physiology-2e/pages/7-1-divisions-of-the-skeletal-system"
        target="_blank"
        rel="noreferrer"
        className="text-button"
      >
        Référence anatomique : OpenStax
        <ArrowUpRight size={14} />
      </a>
    </dialog>
  );
}
export function AnatomyApp() {
  const a = useAnatomy();
  const mobile = useMobileLayout();
  const quiz = useQuiz();
  const p = useProgress();
  const [help, setHelp] = useState(false);
  const [area, setArea] = useState(0);
  const mounted = useClientReady();
  const [fullscreen, setFullscreen] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const showExplore = a.mode === "explore" || a.mode === "dashboard";
  useEffect(() => {
    void useProgress.persist.rehydrate();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) {
        useAnatomy.getState().reset();
        useAnatomy.setState({ visibilityOpen: false, indexOpen: false });
      }
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        useAnatomy.setState({ indexOpen: true });
        document
          .querySelector<HTMLInputElement>(".index-search input")
          ?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.cursor = "";
    };
  }, []);
  useEffect(() => {
    const f = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  const sheet = () => {
    useSheet.getState().restart();
    a.setMode("sheet");
    a.setCamera([0, 4.0, 0], 16.5, "front");
  };
  const allHidden = a.hiddenGroups.length === groups.length;
  return (
    <div className="oscar-app" data-mode={a.mode}>
      <a className="skip-link" href="#main-view">
        Aller au modèle et aux exercices
      </a>
      <header className="app-header">
        <Link className="brand" href="/" aria-label="Oscar, accueil">
          <span className="brand-mark">
            <i />
            <i />
          </span>
          oscar<span className="brand-dot">.</span>
        </Link>
        <div className="breadcrumb">
          <span>Bibliothèque</span>
          <ChevronRight size={13} />
          <span>Biologie & physiopathologie humaines</span>
          <ChevronRight size={13} />
          <strong>Le squelette humain</strong>
        </div>
        <div className="header-end">
          <span className="course-badge">ST2S</span>
          <span className="student-avatar" aria-label="Espace élève">
            É
          </span>
        </div>
      </header>
      <div className="app-body">
        <nav className="nav-rail" aria-label="Navigation principale">
          <div>
            <button
              title="Explorer"
              aria-label="Explorer"
              className={a.mode === "explore" ? "active" : ""}
              onClick={() => a.setMode("explore")}
            >
              <BookOpen size={21} />
            </button>
            <button
              title="Réviser"
              aria-label="Réviser"
              className={
                a.mode === "quiz" || a.mode === "sheet" ? "active" : ""
              }
              onClick={() => quiz.start()}
            >
              <Layers3 size={21} />
            </button>
            <button
              title="Ma progression"
              aria-label="Ma progression"
              className={a.mode === "dashboard" ? "active" : ""}
              onClick={() => a.setMode("dashboard")}
            >
              <ChartNoAxesCombined size={21} />
            </button>
          </div>
          <div className="rail-bottom">
            <button
              title="Aide et raccourcis"
              aria-label="Aide et raccourcis"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={21} />
            </button>
            <span className="rail-version">v.01</span>
          </div>
        </nav>
        <AnatomyTree />
        <div className="workspace">
          <div className="workspace-header">
            <div>
              <button
                className="index-toggle icon-button"
                aria-label="Ouvrir l’index anatomique"
                onClick={() => useAnatomy.setState({ indexOpen: !a.indexOpen })}
              >
                {a.indexOpen ? (
                  <PanelLeftClose size={19} />
                ) : (
                  <PanelLeftOpen size={19} />
                )}
              </button>
              <div>
                <div className="workspace-breadcrumb">ANATOMIE INTERACTIVE</div>
                <h1>
                  Le squelette humain<span className="lesson-pill">2.1</span>
                </h1>
              </div>
            </div>
            <div
              className="learning-tabs"
              role="tablist"
              aria-label="Mode d’apprentissage"
            >
              <button
                role="tab"
                aria-selected={a.mode === "explore" || a.mode === "dashboard"}
                className={showExplore ? "active" : ""}
                onClick={() => a.setMode("explore")}
              >
                <Box size={15} />
                Explorer
              </button>
              <button
                role="tab"
                aria-selected={a.mode === "quiz" || a.mode === "sheet"}
                className={!showExplore ? "active" : ""}
                onClick={() => quiz.start()}
              >
                <Sparkles size={15} />
                Réviser
              </button>
            </div>
          </div>
          <main id="main-view" className="main-view">
            <div className="stage" ref={stage}>
              <div className="stage-tools">
                <div className="tool-cluster">
                  <button
                    className={
                      "stage-tool " +
                      (a.labels && a.mode === "explore" ? "active" : "")
                    }
                    title="Afficher les légendes"
                    aria-pressed={a.labels && a.mode === "explore"}
                    disabled={!showExplore}
                    onClick={() => {
                      if (a.mode === "dashboard") a.setMode("explore");
                      useAnatomy.setState({ labels: !a.labels });
                    }}
                  >
                    <Tags size={16} />
                    <span>Légendes</span>
                  </button>
                  <span className="tool-divider" />
                  <button
                    className={"stage-tool " + (a.groupColors ? "active" : "")}
                    aria-pressed={a.groupColors}
                    disabled={!showExplore}
                    onClick={() =>
                      useAnatomy.setState({ groupColors: !a.groupColors })
                    }
                  >
                    <Layers3 size={16} />
                    <span>Voir les groupes</span>
                  </button>
                </div>
                <button
                  className={
                    "stage-tool sheet-tool " +
                    (a.mode === "sheet" ? "active" : "")
                  }
                  onClick={sheet}
                >
                  <FilePenLine size={16} />
                  <span>Mode fiche</span>
                </button>
              </div>
              <div className="model-caption">
                <strong>
                  Oscar<span className="model-status">3D</span>
                </strong>
                <span>
                  {views.find((v) => v.direction === a.camera.direction)
                    ?.label === "Face"
                    ? "Vue antérieure"
                    : views.find((v) => v.direction === a.camera.direction)
                          ?.label === "Dos"
                      ? "Vue postérieure"
                      : views.find((v) => v.direction === a.camera.direction)
                          ?.label}
                </span>
              </div>
              <div className="visibility-control">
                <button
                  className={
                    "visibility-trigger icon-button " +
                    (a.visibilityOpen ? "active" : "")
                  }
                  title="Visibilité des structures"
                  aria-label="Visibilité des structures"
                  aria-expanded={a.visibilityOpen}
                  disabled={!showExplore}
                  onClick={() =>
                    useAnatomy.setState({ visibilityOpen: !a.visibilityOpen })
                  }
                >
                  <ListFilter size={19} />
                </button>
                {a.visibilityOpen && <VisibilityPanel />}
              </div>
              <div className="canvas-wrap">
                <SkeletonScene />
              </div>
              {allHidden && (
                <div className="hidden-notice">
                  <Box size={22} />
                  <strong>Toutes les régions sont masquées.</strong>
                  <button className="primary-button" onClick={() => a.reset()}>
                    Tout afficher
                  </button>
                </div>
              )}
              {a.mode === "quiz" &&
                !quiz.complete &&
                quiz.questions[quiz.index] && (
                  <div className="model-quiz-prompt">
                    <span>{quiz.index + 1}</span>
                    {quiz.questions[quiz.index].prompt}
                  </div>
                )}
              <div className="zoom-controls">
                <button
                  aria-label="Zoomer"
                  title="Zoomer"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("oscar-zoom", { detail: 0.8 }),
                    )
                  }
                >
                  <Plus size={18} />
                </button>
                <button
                  aria-label="Dézoomer"
                  title="Dézoomer"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("oscar-zoom", { detail: 1.2 }),
                    )
                  }
                >
                  <Minus size={18} />
                </button>
                <span />
                <button
                  aria-label="Réinitialiser la vue"
                  title="Réinitialiser la vue"
                  onClick={() => {
                    a.reset();
                    setArea(0);
                  }}
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  aria-label={
                    fullscreen ? "Quitter le plein écran" : "Plein écran"
                  }
                  title="Plein écran"
                  onClick={async () => {
                    try {
                      if (document.fullscreenElement)
                        await document.exitFullscreen();
                      else await stage.current?.requestFullscreen();
                    } catch {
                      setHelp(true);
                    }
                  }}
                >
                  <Maximize size={17} />
                </button>
              </div>
              {a.groupColors && (
                <div className="group-legend">
                  {groups
                    .filter((g) => g.number)
                    .sort((x, y) => x.number! - y.number!)
                    .map((g) => (
                      <button
                        key={g.id}
                        onMouseEnter={() =>
                          useAnatomy.setState({ hoveredGroup: g.id })
                        }
                        onMouseLeave={() =>
                          useAnatomy.setState({ hoveredGroup: null })
                        }
                        onFocus={() =>
                          useAnatomy.setState({ hoveredGroup: g.id })
                        }
                        onBlur={() =>
                          useAnatomy.setState({ hoveredGroup: null })
                        }
                        onClick={() => a.isolate(g.id, "group")}
                      >
                        <span style={{ background: g.color }}>{g.number}</span>
                        {g.shortName}
                      </button>
                    ))}
                </div>
              )}
              {a.isolation && (
                <div className="isolation-bar">
                  <ScanIcon />
                  <span>
                    {a.isolation.type === "bone"
                      ? boneById[a.isolation.id]?.name
                      : groups.find((g) => g.id === a.isolation?.id)?.shortName}
                  </span>
                  {a.isolation.type === "bone" && (
                    <button
                      onClick={() =>
                        a.isolate(boneById[a.isolation!.id].category, "group")
                      }
                    >
                      Afficher le groupe
                    </button>
                  )}
                  <button onClick={() => a.reset()}>
                    <RotateCcw size={13} />
                    Réinitialiser
                  </button>
                </div>
              )}
              <div className="camera-presets">
                <div
                  className="view-buttons"
                  role="group"
                  aria-label="Orientation de la caméra"
                >
                  {views.map((v) => (
                    <button
                      key={v.direction}
                      className={
                        a.camera.direction === v.direction ? "active" : ""
                      }
                      aria-pressed={a.camera.direction === v.direction}
                      onClick={() =>
                        a.setCamera(
                          a.camera.target,
                          a.camera.distance,
                          v.direction,
                        )
                      }
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                <label className="area-select">
                  <select
                    aria-label="Zone à observer"
                    value={area}
                    onChange={(e) => {
                      const i = Number(e.target.value);
                      setArea(i);
                      a.setCamera(areas[i].target, areas[i].distance);
                    }}
                  >
                    {areas.map((v, i) => (
                      <option value={i} key={v.label}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </label>
              </div>
              <div className="stage-bottom">
                <span>
                  <MousePointer2 size={12} />
                  Glisser pour tourner<span className="hint-dot">·</span>Molette
                  pour zoomer
                </span>
                <button onClick={() => setHelp(true)}>
                  <Box size={12} />
                  {a.modelKind === "glb"
                    ? "Modèle anatomique"
                    : a.modelKind === "error" ? "Modèle indisponible" : "Chargement du modèle…"}
                  <CircleHelp size={12} />
                </button>
              </div>
            </div>
            {a.mode === "explore" ? (
              <BoneInfoPanel />
            ) : a.mode === "quiz" ? (
              <QuizPanel />
            ) : a.mode === "sheet" ? (
              <StudySheetPanel />
            ) : (
              <Dashboard />
            )}
          </main>
          <footer className="workspace-footer">
            <span>
              <span className="footer-dot" />
              Espace d’apprentissage<span className="footer-separator">/</span>
              Le squelette humain
            </span>
            <span>
              {mounted && p.storageError
                ? "Stockage local indisponible · progression temporaire"
                : mounted
                  ? "Progression sauvegardée sur cet appareil"
                  : "Préparation de votre espace…"}
              <Check size={12} />
            </span>
          </footer>
        </div>
      </div>
      {mobile && <MobileUI help={() => setHelp(true)} />}
      {a.indexOpen && (
        <button
          className="index-scrim"
          aria-label="Fermer l’index"
          onClick={() => useAnatomy.setState({ indexOpen: false })}
        />
      )}
      {help && <Help close={() => setHelp(false)} />}
      {a.modelNotice && (
        <div className="app-notice" role="status">
          {a.modelNotice}
          <button
            aria-label="Fermer"
            onClick={() => useAnatomy.setState({ modelNotice: null })}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function ScanIcon() {
  return <Box size={15} />;
}
