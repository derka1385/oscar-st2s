"use client";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import config from "@/data/firebase-config.json";
let client: Promise<{ auth: ReturnType<typeof getAuth>; db: ReturnType<typeof getFirestore> }> | undefined;
export function getFirebase() {
  if (typeof window === "undefined") throw new Error("Firebase is browser-only");
  if (!config.apiKey || !config.projectId || !config.appId) throw new Error("auth/not-configured");
  return client ??= (async () => {
    const app = getApps().find((item) => item.name === "oscar") ?? initializeApp(config, "oscar");
    const auth = getAuth(app);
    try { await setPersistence(auth, browserLocalPersistence); } catch { await setPersistence(auth, inMemoryPersistence); }
    return { auth, db: getFirestore(app) };
  })();
}
