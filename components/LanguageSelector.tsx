"use client";
import { useEffect } from "react";
import { Languages, ChevronDown } from "lucide-react";
import { useLocale, type Locale } from "@/store/localeStore";
export function LanguageSelector() {
  const { locale, setLocale, hydrate } = useLocale();
  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = locale === "uk" ? "Oscar — Скелет людини · ST2S" : "Oscar — Le squelette humain · ST2S";
  }, [locale]);
  return <label className="language-selector"><Languages size={17} aria-hidden="true" /><select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label={locale === "uk" ? "Мова" : "Langue"}><option value="fr" lang="fr">Français</option><option value="uk" lang="uk">Українська</option></select><ChevronDown size={13} aria-hidden="true" /></label>;
}
