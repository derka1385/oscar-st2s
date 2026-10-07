"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3, MOUSE } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useAnatomy } from "@/store/anatomyStore";
export function CameraController() {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const height = useThree((s) => s.size.height);
  const request = useAnatomy((s) => s.camera);
  const moving = useRef(true);
  const reduced = useRef(false);
  const destination = useRef({
    position: new Vector3(0, 4, 16.5),
    target: new Vector3(0, 4, 0),
  });
  useEffect(() => {
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);
  useEffect(() => {
    const target = new Vector3(...request.target);
    const fullBody = request.distance === 16.5;
    const distance = fullBody && height < 630 ? 18.5 : request.distance;
    if (fullBody && height < 630) target.y = 3.7;
    const v =
      request.direction === "front"
        ? new Vector3(0, 0.01, 1)
        : request.direction === "back"
          ? new Vector3(0, 0.01, -1)
          : request.direction === "left"
            ? new Vector3(-1, 0.01, 0)
            : new Vector3(1, 0.01, 0);
    destination.current = {
      position: target.clone().add(v.multiplyScalar(distance)),
      target,
    };
    moving.current = true;
  }, [request, height]);
  useEffect(() => {
    const zoom = (e: Event) => {
      if (!controls.current) return;
      const target = controls.current.target.clone();
      const direction = camera.position.clone().sub(target);
      direction.setLength(
        Math.min(
          24,
          Math.max(2, direction.length() * (e as CustomEvent<number>).detail),
        ),
      );
      destination.current = { position: target.clone().add(direction), target };
      moving.current = true;
    };
    window.addEventListener("oscar-zoom", zoom);
    return () => window.removeEventListener("oscar-zoom", zoom);
  }, [camera]);
  useFrame((_, dt) => {
    if (!moving.current || !controls.current) return;
    const { target, position: desired } = destination.current;
    const alpha = reduced.current ? 1 : 1 - Math.exp(-dt * 6);
    camera.position.lerp(desired, alpha);
    controls.current.target.lerp(target, alpha);
    controls.current.update();
    if (camera.position.distanceTo(desired) < 0.008) {
      moving.current = false;
    }
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 4.0, 0]}
      minDistance={2}
      maxDistance={24}
      enableDamping
      dampingFactor={0.09}
      maxPolarAngle={Math.PI * 0.93}
      mouseButtons={{
        LEFT: MOUSE.ROTATE,
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.PAN,
      }}
      onStart={() => {
        moving.current = false;
      }}
    />
  );
}
