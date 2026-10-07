"use client";
import { useEffect, useMemo, useState } from "react";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { structures } from "@/data/anatomy/skeleton";
import { useAnatomy } from "@/store/anatomyStore";
import { BoneMesh } from "./BoneMesh";
import { createProceduralSkeleton, type ModelPart } from "./proceduralGeometry";
// Match exact names, descendants of a mapped node, or names with Blender's
// numeric suffix. All other application code refers only to educational IDs.
export function mapModel(gltf: GLTF): {
  parts: ModelPart[];
  unmatched: string[];
} {
  const parts: ModelPart[] = [];
  const unmatched: string[] = [];
  gltf.scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(gltf.scene);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const factor = 8.3 / Math.max(size.y, 0.001);
  gltf.scene.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const names: string[] = [];
    let parent: THREE.Object3D | null = node;
    while (parent && parent !== gltf.scene) {
      names.push(parent.name.replace(/\.\d+$/, ""));
      parent = parent.parent;
    }
    const bone = structures.find((b) =>
      b.modelMeshNames.some((n) => names.includes(n)),
    );
    if (!bone) {
      unmatched.push(node.name);
      return;
    }
    // Geometry is shared with the loader. Position transforms are baked once
    // per source mesh, never cloned on hover or selection.
    const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
    geometry.translate(-center.x, -bounds.min.y, -center.z);
    geometry.scale(factor, factor, factor);
    geometry.translate(0, 0.15, 0);
    parts.push({ id: bone.id, geometry });
  });
  return { parts, unmatched };
}
function mergeParts(parts: ModelPart[]): ModelPart[] {
  const batches = new Map<
    string,
    {
      id: string;
      shade?: ModelPart["shade"];
      geometries: THREE.BufferGeometry[];
    }
  >();
  for (const part of parts) {
    const key = part.id + ":" + (part.shade ?? "bone");
    if (!batches.has(key))
      batches.set(key, { id: part.id, shade: part.shade, geometries: [] });
    const g = part.geometry.index
      ? part.geometry.toNonIndexed()
      : part.geometry.clone();
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...(part.position ?? [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...(part.rotation ?? [0, 0, 0])),
      ),
      new THREE.Vector3(...(part.scale ?? [1, 1, 1])),
    );
    g.applyMatrix4(m);
    batches.get(key)!.geometries.push(g);
  }
  return [...batches.values()].map((b) => {
    const geometry = mergeGeometries(b.geometries, false)!;
    b.geometries.forEach((g) => g.dispose());
    return { id: b.id, shade: b.shade, geometry };
  });
}
const gltfCache = new Map<string, Promise<GLTF>>();
function loadModel(url: string) {
  if (!gltfCache.has(url)) gltfCache.set(url, new GLTFLoader().loadAsync(url));
  return gltfCache.get(url)!;
}
export function SkeletonModel() {
  const fallback = useMemo(() => mergeParts(createProceduralSkeleton()), []);
  const [loaded, setLoaded] = useState<ModelPart[] | null>(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetch("/models/oscar-skeleton.glb", {
      method: "HEAD",
      signal: controller.signal,
    })
      .then(async (r) => {
        if (
          !r.ok ||
          (r.headers.get("content-type") ?? "").includes("text/html")
        )
          return;
        const gltf = await loadModel("/models/oscar-skeleton.glb");
        if (!active) return;
        const mapped = mapModel(gltf);
        const represented = new Set(mapped.parts.map((p) => p.id));
        const missing = structures.filter(
          (b) => b.id !== "coxal" && !represented.has(b.id),
        );
        if (missing.length) {
          useAnatomy.setState({
            modelNotice: `Modèle GLB incomplet : ${missing.length} structures non associées. Le modèle simplifié reste actif.`,
          });
          return;
        }
        setLoaded(mergeParts(mapped.parts));
        useAnatomy.setState({
          modelKind: "glb",
          modelNotice: mapped.unmatched.length
            ? `${mapped.unmatched.length} maillages non associés ont été ignorés.`
            : null,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.abort();
    };
  }, []);
  const grouped = useMemo(() => {
    const m = new Map<string, ModelPart[]>();
    for (const part of loaded ?? fallback) {
      if (!m.has(part.id)) m.set(part.id, []);
      m.get(part.id)!.push(part);
    }
    return [...m.entries()];
  }, [loaded, fallback]);
  return (
    <group>
      {grouped.map(([id, parts]) => (
        <BoneMesh key={id} id={id} parts={parts} />
      ))}
    </group>
  );
}
