"use client";
import { useLocale } from "@/store/localeStore";
import { anatomyContent, questionPrompt, translate } from "./i18n";
import type { Question } from "./quiz";
export function useI18n() {
  const locale = useLocale((state) => state.locale);
  return { ...anatomyContent[locale], locale, t: (text: string, values?: Record<string, string | number>) => translate(text, locale, values), prompt: (question: Question) => questionPrompt(question, locale) };
}
