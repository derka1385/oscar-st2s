"use client";
import { useI18n } from "@/lib/useI18n";
import { Component, Suspense, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { LoaderCircle, RotateCcw, Box } from "lucide-react";
import { SkeletonModel } from "./SkeletonModel";
import { CameraController } from "./CameraController";
import {
  AnatomyLabels,
  AnnotationProjector,
  AnnotationBridge,
} from "./AnatomyLabels";
import { useAnatomy } from "@/store/anatomyStore";
import { useClientReady } from "@/lib/useClientReady";
class SceneError extends Component<
  { children: ReactNode; t: (text: string) => string },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    const { t } = this.props;
    return this.state.error ? (
      <div className="scene-error">
        <Box size={32} />
        <h3>{t("Le rendu 3D est indisponible.")}</h3>
        <p>{t("Active l’accélération graphique ou essaie un navigateur récent. L’index et les fiches restent accessibles. ")}</p>
        <button
          className="secondary-button"
          onClick={() => window.location.reload()}
        >
          <RotateCcw size={15} />{t("Réessayer ")}</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function ModelLoading() {
  const { t } = useI18n();
  return (
    <div className="scene-loading" role="status" aria-live="polite">
      <LoaderCircle className="spin" size={28} aria-hidden="true" />
      <span>{t("Chargement du squelette 3D…")}</span>
      <small>{t("Préparation du modèle anatomique")}</small>
    </div>
  );
}
export function SkeletonScene() {
  const { t } = useI18n();
  const [bridge] = useState(() => new AnnotationBridge());
  const ready = useClientReady();
  const modelKind = useAnatomy((s) => s.modelKind);
  if (!ready) return <ModelLoading />;
  return (
    <SceneError t={t}>
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [0, 4.0, 16.5], fov: 37, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#efeee8", 0);
        }}
        aria-label={t("Oscar, squelette 3D interactif. Glisser pour tourner, molette pour zoomer. Utilisez l’index pour sélectionner au clavier.")}
      >
        <ambientLight intensity={0.7} />
        <hemisphereLight args={["#fffdf5", "#a9a491", 0.8]} />
        <directionalLight
          position={[3, 9, 7]}
          intensity={2.1}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-normalBias={0.03}
        />
        <directionalLight position={[-5, 7, -3]} intensity={0.9} />
        <Suspense fallback={null}>
          <SkeletonModel />
        </Suspense>
        <ContactShadows
          position={[0, 0.08, 0]}
          opacity={0.22}
          scale={12}
          blur={2.8}
          far={3}
          resolution={256}
          frames={1}
          color="#635d4b"
        />
        <CameraController />
        <AnnotationProjector bridge={bridge} />
      </Canvas>
      {modelKind === "glb" && <AnatomyLabels bridge={bridge} />}
      {modelKind === "loading" && <ModelLoading />}
      {modelKind === "error" && (
        <div className="scene-error" role="alert">
          <Box size={32} aria-hidden="true" />
          <h3>{t("Le squelette n’a pas pu être chargé.")}</h3>
          <p>{t("Vérifie ta connexion, puis réessaie.")}</p>
          <button className="secondary-button" onClick={() => window.location.reload()}>
            <RotateCcw size={15} />{t(" Réessayer ")}</button>
        </div>
      )}
    </SceneError>
  );
}
