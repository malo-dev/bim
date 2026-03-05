import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import fr from "./fr";
import en from "./en";
import ln from "./ln";
import sw from "./sw";

const LANG_KEY = "lang";

const loadSavedLanguage = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(LANG_KEY);
    return saved ?? "fr";
  } catch {
    return "fr";
  }
};

export const changeLanguage = async (lang: string) => {
  await AsyncStorage.setItem(LANG_KEY, lang);
  await i18n.changeLanguage(lang);
};

const initI18n = async () => {
  const savedLang = await loadSavedLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ln: { translation: ln },
      sw: { translation: sw },
    },
    lng:           savedLang,
    fallbackLng:   "fr",
    interpolation: { escapeValue: false },
  });
};

initI18n();

export default i18n;
