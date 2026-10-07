import { create } from "zustand";
import { boneById, type Vec3 } from "@/data/anatomy/skeleton";
import type { GroupId } from "@/data/anatomy/groups";
export type AppMode = "explore" | "quiz" | "sheet" | "dashboard";
export type CameraRequest = {
  target: Vec3;
  distance: number;
  direction: "front" | "back" | "left" | "right";
  tick: number;
};
type State = {
  mode: AppMode;
  selected: string | null;
  hovered: string | null;
  hoveredGroup: GroupId | null;
  hiddenGroups: GroupId[];
  hiddenBones: string[];
  isolation: { type: "bone" | "group"; id: string } | null;
  xray: boolean;
  groupColors: boolean;
  labels: boolean;
  visibilityOpen: boolean;
  indexOpen: boolean;
  camera: CameraRequest;
  modelKind: "procedural" | "glb";
  modelNotice: string | null;
  setMode: (m: AppMode) => void;
  select: (id: string, focus?: boolean) => void;
  isolate: (id: string, type?: "bone" | "group") => void;
  reset: () => void;
  toggleGroup: (id: GroupId) => void;
  hide: (id: string) => void;
  setCamera: (
    target: Vec3,
    distance: number,
    direction?: CameraRequest["direction"],
  ) => void;
};
export const useAnatomy = create<State>((set, get) => ({
  mode: "explore",
  selected: "clavicule",
  hovered: null,
  hoveredGroup: null,
  hiddenGroups: [],
  hiddenBones: [],
  isolation: null,
  xray: false,
  groupColors: false,
  labels: true,
  visibilityOpen: false,
  indexOpen: false,
  camera: { target: [0, 4.0, 0], distance: 16.5, direction: "front", tick: 0 },
  modelKind: "procedural",
  modelNotice: null,
  setMode: (mode) =>
    set({
      mode,
      selected: mode === "explore" ? get().selected : null,
      hovered: null,
      hiddenBones: [],
      hiddenGroups: [],
      isolation: null,
      xray: false,
      labels: mode === "explore",
      groupColors: false,
      visibilityOpen: false,
    }),
  select: (id, focus = false) => {
    const b = boneById[id];
    set((s) => ({
      selected: id,
      hiddenBones: s.hiddenBones.filter((x) => x !== id),
      hiddenGroups: s.hiddenGroups.filter((x) => x !== b.category),
      ...(focus
        ? {
            camera: {
              target: b.anchor,
              distance: 4.4,
              direction: s.camera.direction,
              tick: s.camera.tick + 1,
            },
          }
        : {}),
    }));
  },
  isolate: (id, type = "bone") =>
    set({
      isolation: { type, id },
      selected: type === "bone" ? id : get().selected,
    }),
  reset: () =>
    set((s) => ({
      hiddenGroups: [],
      hiddenBones: [],
      isolation: null,
      xray: false,
      hovered: null,
      camera: {
        target: [0, 4.0, 0],
        distance: 16.5,
        direction: "front",
        tick: s.camera.tick + 1,
      },
    })),
  toggleGroup: (id) =>
    set((s) => ({
      hiddenGroups: s.hiddenGroups.includes(id)
        ? s.hiddenGroups.filter((x) => x !== id)
        : [...s.hiddenGroups, id],
    })),
  hide: (id) =>
    set((s) => ({
      hiddenBones: [...new Set([...s.hiddenBones, id])],
      isolation: null,
    })),
  setCamera: (target, distance, direction = get().camera.direction) =>
    set((s) => ({
      camera: { target, distance, direction, tick: s.camera.tick + 1 },
    })),
}));
