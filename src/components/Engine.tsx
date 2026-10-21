'use client';

import { useEffect } from 'react';
import type { EngineStrings } from '@/i18n';
import { boot } from '@/engine';

type Props = { intl: string; strings: EngineStrings };

// Движок анимаций — общий на всю страницу (Lenis на <html>, ScrollTrigger'ы, курсор в <body>, слушатели window),
// поэтому запускается один раз на загрузку документа, а не на каждое монтирование компонента
// (так React советует инициализировать приложение: https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application).
// Смена языка — переход между корневыми layout, это всегда полная перезагрузка страницы.
let started = false;

export function Engine({ intl, strings }: Props) {
  useEffect(() => {
    if (started) return;
    started = true;
    boot({ intl, strings });
  }, [intl, strings]);

  return null;
}
