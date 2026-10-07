"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { boneById, labelIds } from "@/data/anatomy/skeleton";
import { useAnatomy } from "@/store/anatomyStore";
import { useSheet } from "@/store/sheetStore";
export class AnnotationBridge {
  private nodes: Record<string, HTMLDivElement | null> = {};
  private paths: Record<string, SVGPolylineElement | null> = {};
  private hover: HTMLDivElement | null = null;
  setNode(id: string, node: HTMLDivElement | null) {
    this.nodes[id] = node;
  }
  setPath(id: string, node: SVGPolylineElement | null) {
    this.paths[id] = node;
  }
  setHover(node: HTMLDivElement | null) {
    this.hover = node;
  }
  place(id: string, x: number, y: number, width: number, points: string) {
    const node = this.nodes[id];
    if (node) {
      node.style.transform = `translate(${x}px, ${y - 12}px)`;
      node.style.width = width + "px";
    }
    this.paths[id]?.setAttribute("points", points);
  }
  placeHover(x: number, y: number) {
    if (this.hover)
      this.hover.style.transform = `translate(${x}px,${y - 40}px) translateX(-50%)`;
  }
}
// DOM stays in React's regular root, while a small canvas bridge projects the
// anatomical anchors each frame. This avoids a separate DOM root per label.
export function AnnotationProjector({ bridge }: { bridge: AnnotationBridge }) {
  const { camera, size } = useThree();
  useFrame(() => {
    const a = useAnatomy.getState(),
      s = useSheet.getState();
    const isSheet = a.mode === "sheet";
    const ids = isSheet ? s.ids : labelIds;
    if (isSheet || (a.mode === "explore" && a.labels)) {
      const rows = ids
        .filter(
          (id) =>
            !a.hiddenGroups.includes(boneById[id].category) &&
            !a.hiddenBones.includes(id),
        )
        .map((id, i) => {
          const p = new Vector3(...boneById[id].anchor).project(camera);
          return {
            id,
            x: ((p.x + 1) * size.width) / 2,
            y: ((1 - p.y) * size.height) / 2,
            side: i % 2 === 0 ? "left" : "right",
          };
        });
      for (const side of ["left", "right"]) {
        const items = rows
          .filter((x) => x.side === side)
          .sort((b, c) => b.y - c.y);
        const top = 155,
          bottom = size.height - 135;
        const spacing = Math.min(
          isSheet ? 56 : 44,
          Math.max(29, (bottom - top) / Math.max(1, items.length - 1)),
        );
        let prev = top - spacing;
        for (let j = 0; j < items.length; j++) {
          const r = items[j];
          const y = Math.max(
            prev + spacing,
            Math.min(r.y, bottom - (items.length - 1 - j) * spacing),
          );
          prev = y;
          const width =
            size.width < 450 ? (isSheet ? 98 : 79) : isSheet ? 126 : 110;
          const x =
            side === "left"
              ? size.width < 450
                ? 9
                : 25
              : size.width - width - (size.width < 450 ? 9 : 25);
          const startX = side === "left" ? x + width + 5 : x - 5;
          const elbowX =
            side === "left"
              ? Math.min(startX + 23, r.x - 8)
              : Math.max(startX - 23, r.x + 8);
          bridge.place(
            r.id,
            x,
            y,
            width,
            `${startX},${y} ${elbowX},${y} ${r.x},${r.y}`,
          );
        }
      }
    }
    if (a.hovered && a.mode === "explore") {
      const p = new Vector3(...boneById[a.hovered].anchor).project(camera);
      bridge.placeHover(
        ((p.x + 1) * size.width) / 2,
        ((1 - p.y) * size.height) / 2,
      );
    }
  });
  return null;
}
export function AnatomyLabels({ bridge }: { bridge: AnnotationBridge }) {
  const a = useAnatomy();
  const sheet = useSheet();
  const isSheet = a.mode === "sheet";
  const ids = isSheet ? sheet.ids : labelIds;
  const visible = isSheet || (a.mode === "explore" && a.labels);
  return (
    <div className="annotations-overlay">
      {visible && (
        <div className={"anatomy-labels " + (isSheet ? "sheet-labels" : "")}>
          <svg width="100%" height="100%" aria-hidden="true">
            {ids.map((id) => (
              <polyline
                key={id}
                ref={(el) => bridge.setPath(id, el)}
                fill="none"
                stroke={a.selected === id ? "#718e79" : "#aeb4a6"}
                strokeWidth="1"
                opacity=".65"
              />
            ))}
          </svg>
          {ids.map((id, i) => {
            const b = boneById[id];
            const hidden =
              a.hiddenGroups.includes(b.category) || a.hiddenBones.includes(id);
            return (
              <div
                key={id}
                ref={(el) => bridge.setNode(id, el)}
                className={"annotation " + (a.selected === id ? "active" : "")}
                style={{ display: hidden ? "none" : undefined }}
              >
                {isSheet ? (
                  <label
                    className={
                      sheet.corrected
                        ? sheet.results[id]
                          ? "answer-good"
                          : "answer-wrong"
                        : ""
                    }
                  >
                    <span>{i + 1}</span>
                    <input
                      aria-label={`Légende ${i + 1}`}
                      placeholder="Nom de l’os…"
                      value={sheet.answers[id] ?? ""}
                      onChange={(e) => sheet.setAnswer(id, e.target.value)}
                      disabled={sheet.corrected}
                    />
                    {sheet.corrected && (
                      <small>{sheet.results[id] ? "Correct" : b.name}</small>
                    )}
                  </label>
                ) : (
                  <button onClick={() => a.select(id)}>{b.name}</button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {a.hovered && a.mode === "explore" && (
        <div className="hover-bone" ref={(el) => bridge.setHover(el)}>
          {boneById[a.hovered].name}
        </div>
      )}
    </div>
  );
}
