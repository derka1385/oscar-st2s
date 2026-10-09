"use client";
import { useI18n } from "@/lib/useI18n";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Search, SlidersHorizontal, ChevronRight, X, BookOpen, FilePenLine, ChartNoAxesCombined, RotateCcw, Tags, Layers3, CircleHelp } from "lucide-react";
import { useAnatomy, type CameraRequest } from "@/store/anatomyStore";
import { useQuiz } from "@/store/quizStore";
import { useSheet } from "@/store/sheetStore";
import { type Vec3 } from "@/data/anatomy/skeleton";
import { BoneInfoPanel } from "../learning/BoneInfoPanel";
import { VisibilityPanel } from "../learning/VisibilityPanel";

function MobileDialog({ title, close, children, className = "" }: { title: string; close: () => void; children: ReactNode; className?: string }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} className={"mobile-sheet " + className} onCancel={close} onClick={(event) => { if (event.target === ref.current) close(); }}>
      <div className="mobile-sheet-heading"><h2>{title}</h2><button autoFocus onClick={close} aria-label={t("Fermer {name}", { name: title })}><X size={21} /></button></div>
      {children}
    </dialog>
  );
}
const orientations: { label: string; direction: CameraRequest["direction"] }[] = [
  { label: "Face", direction: "front" }, { label: "Dos", direction: "back" }, { label: "Gauche", direction: "left" }, { label: "Droite", direction: "right" },
];
const regions: { name: string; target: Vec3; distance: number }[] = [
  { name: "Corps entier", target: [0, 4, 0], distance: 16.5 }, { name: "Tête", target: [0, 7.91, 0], distance: 2.9 }, { name: "Thorax", target: [0, 6.25, 0], distance: 5.2 }, { name: "Bassin", target: [0, 4.55, 0], distance: 4.2 }, { name: "Bras et mains", target: [0, 5.5, 0], distance: 8.6 }, { name: "Jambes et pieds", target: [0, 2.3, 0], distance: 7.6 },
];
export function MobileUI({ help }: { help: () => void }) {
  const { t, boneById } = useI18n();
  const a = useAnatomy();
  const q = useQuiz();
  const [panel, setPanel] = useState<"tools" | "info" | null>(null);
  const bone = a.selected ? boneById[a.selected] : null;
  const exploring = a.mode === "explore";
  const question = q.questions[q.index];
  const listAnswer = a.mode === "quiz" && !q.complete && (question?.type === "locate" || question?.type === "multi");
  const close = () => setPanel(null);
  return (
    <>
      <button className="mobile-help" onClick={help} aria-label={t("Aide")}><CircleHelp size={22} /></button>
      {a.mode !== "dashboard" && <div className="mobile-toolbar">
        {!exploring && !listAnswer ? <div className="mobile-sheet-title">{a.mode === "sheet" ? <FilePenLine size={19} /> : <BookOpen size={19} />}<span>{a.mode === "sheet" ? t("Ma fiche de révision") : t("Session de révision")}</span></div> : <button className="mobile-search" onClick={() => useAnatomy.setState({ indexOpen: true })}><Search size={19} /><span>{exploring ? t("Choisir un os") : t("Répondre par la liste")}</span><ChevronRight size={16} /></button>}
        <button className="mobile-view" onClick={() => setPanel("tools")}><SlidersHorizontal size={19} /><span>{t("Vue 3D")}</span></button>
      </div>}
      {exploring && <div className="mobile-selection">
        {bone ? <button className="mobile-bone-summary" onClick={() => setPanel("info")}><span className="mobile-bone-icon"><Box size={23} /></span><span><small>{t("Os sélectionné")}</small><strong>{bone.name}</strong></span><span className="mobile-read">{t("Fiche ")}<ChevronRight size={17} /></span></button> : <div className="mobile-empty-selection"><Box size={22} /><span>{t("Touche un os pour le découvrir.")}</span></div>}
      </div>}
      <nav className="mobile-navigation" aria-label={t("Navigation mobile")}>
        <button className={exploring ? "active" : ""} aria-current={exploring ? "page" : undefined} onClick={() => { a.setMode("explore"); close(); }}><Box size={22} /><span>{t("Explorer")}</span></button>
        <button className={a.mode === "quiz" ? "active" : ""} aria-current={a.mode === "quiz" ? "page" : undefined} onClick={() => { if (a.mode !== "quiz") q.start(); close(); }}><BookOpen size={22} /><span>{t("Réviser")}</span></button>
        <button className={a.mode === "sheet" ? "active" : ""} aria-current={a.mode === "sheet" ? "page" : undefined} onClick={() => { if (a.mode !== "sheet") { useSheet.getState().restart(); a.setMode("sheet"); a.setCamera([0, 4, 0], 16.5, "front"); } close(); }}><FilePenLine size={22} /><span>{t("Fiche")}</span></button>
        <button className={a.mode === "dashboard" ? "active" : ""} aria-current={a.mode === "dashboard" ? "page" : undefined} onClick={() => { a.setMode("dashboard"); close(); }}><ChartNoAxesCombined size={22} /><span>{t("Progression")}</span></button>
      </nav>
      {panel === "info" && bone && <MobileDialog title={t("Fiche de l’os")} close={close} className="mobile-info-sheet"><BoneInfoPanel onClose={close} /></MobileDialog>}
      {panel === "tools" && <MobileDialog title={t("Régler la vue 3D")} close={close}>
        <div className="mobile-settings-body">
          <fieldset><legend>{t("Voir le squelette de…")}</legend><div className="mobile-orientations">{orientations.map((view) => <button key={view.direction} aria-pressed={a.camera.direction === view.direction} onClick={() => a.setCamera(a.camera.target, a.camera.distance, view.direction)}>{t(view.label)}</button>)}</div></fieldset>
          <label className="mobile-region">{t("Se rapprocher d’une région")}<select aria-label={t("Région à observer")} defaultValue="" onChange={(event) => { const r = regions[Number(event.target.value)]; if (r) { a.setCamera(r.target, r.distance); close(); } }}><option value="" disabled>{t("Choisir une région")}</option>{regions.map((region, i) => <option value={i} key={region.name}>{t(region.name)}</option>)}</select></label>
          {exploring && <><div className="mobile-display-toggles"><button aria-pressed={a.mobileLabels} onClick={() => useAnatomy.setState({ mobileLabels: !a.mobileLabels })}><Tags size={19} />{t("Légendes")}<span>{a.mobileLabels ? t("Oui") : t("Non")}</span></button><button aria-pressed={a.groupColors} onClick={() => useAnatomy.setState({ groupColors: !a.groupColors })}><Layers3 size={19} />{t("Couleurs des groupes")}<span>{a.groupColors ? t("Oui") : t("Non")}</span></button></div><VisibilityPanel /></>}
          <button className="secondary-button mobile-reset" onClick={() => { a.reset(); close(); }}><RotateCcw size={18} />{t("Retrouver le squelette entier")}</button>
          <button className="primary-button" onClick={close}>{t("Voir le squelette")}</button>
        </div>
      </MobileDialog>}
    </>
  );
}
