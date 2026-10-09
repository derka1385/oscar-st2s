"use client";
import { create } from "zustand";
export type Locale = "fr" | "uk";
export const localeStorageKey = "oscar-language-v1";
type LocaleState = { locale: Locale; setLocale: (locale: Locale) => void; hydrate: () => void };
export const useLocale = create<LocaleState>((set) => ({
  locale: "fr",
  setLocale: (locale) => {
    set({ locale });
    try { window.localStorage.setItem(localeStorageKey, locale); } catch { /* Language remains usable without storage. */ }
  },
  hydrate: () => {
    try { const saved = window.localStorage.getItem(localeStorageKey); if (saved === "fr" || saved === "uk") set({ locale: saved }); } catch { /* Keep the French default when storage is unavailable. */ }
  },
}));
