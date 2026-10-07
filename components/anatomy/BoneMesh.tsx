"use client";
import { memo } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import { useAnatomy } from "@/store/anatomyStore";
import { useQuiz } from "@/store/quizStore";
import { boneById } from "@/data/anatomy/skeleton";
import { groupById } from "@/data/anatomy/groups";
import type { ModelPart } from "./proceduralGeometry";
export const BoneMesh = memo(function BoneMesh({
  id,
  parts,
}: {
  id: string;
  parts: ModelPart[];
}) {
  const a = useAnatomy();
  const q = useQuiz();
  const bone = boneById[id];
  const group = groupById[bone.category];
  const question = q.questions[q.index];
  const learning = a.mode === "quiz";
  const aggregate =
    a.selected === "coxal" && ["ilium", "ischion", "pubis"].includes(id);
  const selected = learning
    ? question?.type === "identify" || question?.type === "group"
      ? question.targetId === id
      : q.picks.includes(id)
    : a.selected === id || aggregate;
  const hint =
    learning &&
    q.attempts >= 2 &&
    question &&
    bone.category === boneById[question.targetId].category;
  const hovered =
    !learning && (a.hovered === id || a.hoveredGroup === bone.category);
  const hidden =
    a.hiddenGroups.includes(bone.category) ||
    a.hiddenBones.includes(id) ||
    (a.hiddenBones.includes("coxal") && bone.category === "pelvic");
  const isolated =
    a.isolation &&
    (a.isolation.type === "group"
      ? bone.category !== a.isolation.id
      : !(
          a.isolation.id === id ||
          (a.isolation.id === "coxal" &&
            ["ilium", "ischion", "pubis"].includes(id))
        ));
  const faded = Boolean(isolated || (a.xray && !selected));
  let color = selected
    ? "#88ad94"
    : hovered
      ? "#c3d2c4"
      : hint
        ? "#dac78e"
        : a.groupColors
          ? group.color
          : "#dfd7c3";
  if (learning && q.flash === id)
    color = q.flashCorrect ? "#62a786" : "#d87465";
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (a.mode === "quiz") q.answer(id);
    else if (a.mode === "explore" || a.mode === "dashboard") {
      if (a.mode === "dashboard") a.setMode("explore");
      a.select(id);
    }
  };
  return (
    <group
      visible={!hidden}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (a.mode === "explore") {
          useAnatomy.setState({ hovered: id });
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => {
        useAnatomy.setState({ hovered: null });
        document.body.style.cursor = "";
      }}
      onClick={click}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (a.mode === "explore") a.isolate(id);
      }}
    >
      {parts.map((part, i) => (
        <mesh
          key={i}
          geometry={part.geometry}
          position={part.position}
          rotation={part.rotation}
          scale={part.scale}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            side={2}
            color={
              part.shade === "cavity" && !selected
                ? "#625e53"
                : part.shade === "tooth" && !selected
                  ? "#eee8d7"
                  : color
            }
            roughness={0.68}
            metalness={0}
            transparent={faded}
            opacity={faded ? 0.12 : 1}
            depthWrite={!faded}
            emissive={selected ? "#203a2b" : "#000000"}
            emissiveIntensity={selected ? 0.07 : 0}
          />
        </mesh>
      ))}
    </group>
  );
});
