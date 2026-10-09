"use client";
import { create } from "zustand";
export type AccountUser = { uid: string; email: string | null; emailVerified: boolean };
export type SyncStatus = "guest" | "loading" | "saving" | "saved" | "offline" | "error";
export const useAccount = create<{
  user: AccountUser | null; ready: boolean; open: boolean; sync: SyncStatus; error: string | null;
  show: () => void; close: () => void;
}>((set) => ({ user: null, ready: false, open: false, sync: "guest", error: null, show: () => set({ open: true }), close: () => set({ open: false }) }));
