import type { Lang } from './config';
import { en, type Dictionary } from './dictionaries/en';
import { ru } from './dictionaries/ru';
import { uk } from './dictionaries/uk';

export type { Dictionary };
export * from './config';

const DICTIONARIES: Record<Lang, Dictionary> = { en, ru, uk };

export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}

// строки интерфейса, которые нужны движку анимаций в браузере (статусы прелоадера, сообщения форм, единицы)
export type EngineStrings = Dictionary['js'];
