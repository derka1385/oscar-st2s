"use client";
import { Check, X, ScanLine } from "lucide-react";
import { groups } from "@/data/anatomy/groups";
import { useAnatomy } from "@/store/anatomyStore";
export function VisibilityPanel() {
  const a = useAnatomy();
  return (
    <div className="visibility-panel">
      <div className="popover-heading">
        <strong>Visibilité</strong>
        <button
          className="icon-button"
          aria-label="Fermer la visibilité"
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
        >
          Tout afficher
        </button>
        <button
          onClick={() =>
            useAnatomy.setState({ hiddenGroups: groups.map((g) => g.id) })
          }
        >
          Tout masquer
        </button>
      </div>
      <button
        className={"xray-button " + (a.xray ? "active" : "")}
        onClick={() => useAnatomy.setState({ xray: !a.xray })}
      >
        <ScanLine size={16} />
        Rayon X<span className="mini-switch" />
      </button>
    </div>
  );
}
