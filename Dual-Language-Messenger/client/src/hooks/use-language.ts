import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/lib/i18n';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'myntraq-language',
    }
  )
);
