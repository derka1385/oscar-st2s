"use client";
import { useI18n } from "@/lib/useI18n";
import { Check, X, ScanLine } from "lucide-react";
import { useAnatomy } from "@/store/anatomyStore";
export function VisibilityPanel() {
  const { t, groups } = useI18n();
  const a = useAnatomy();
  return (
    <div className="visibility-panel">
      <div className="popover-heading">
        <strong>{t("Visibilité")}</strong>
        <button
          className="icon-button"
          aria-label={t("Fermer la visibilité")}
          onClick={() => useAnatomy.setState({ visibilityOpen: false })}
        >
          <X size={15} />
        </button>
      </div>
      {groups.map((g) => (
        <label className="visibility-row" key={g.id}>
          <input
            type="checkbox"
            checked={!a.hiddenGroups.includes(g.id)}
            onChange={() => a.toggleGroup(g.id)}
          />
          <span className="custom-checkbox">
            {!a.hiddenGroups.includes(g.id) && <Check size={12} />}
          </span>
          <i style={{ background: g.color }} />
          <span>{g.shortName}</span>
        </label>
      ))}
      <div className="visibility-all">
        <button
          onClick={() =>
            useAnatomy.setState({ hiddenGroups: [], hiddenBones: [] })
          }
        >{t("Tout afficher ")}</button>
        <button
          onClick={() =>
            useAnatomy.setState({ hiddenGroups: groups.map((g) => g.id) })
          }
        >{t("Tout masquer ")}</button>
      </div>
      <button
        className={"xray-button " + (a.xray ? "active" : "")}
        onClick={() => useAnatomy.setState({ xray: !a.xray })}
      >
        <ScanLine size={16} />{t("Rayon X")}<span className="mini-switch" />
      </button>
    </div>
  );
}
