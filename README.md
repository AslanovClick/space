# DOMAIN — лендинг «интернет из другого измерения»

Одностраничный сайт на трёх языках (`/` — en, `/ru/`, `/uk/`) со скролл-анимациями: покадровое видео на canvas,
WebGL-прелоадер, пины GSAP ScrollTrigger, плавный скролл Lenis.

## Стек

- **Next.js 16 (App Router)**: все страницы статические (SSG), вёрстка — серверные компоненты.
- **TypeScript**, **SCSS** (глобальные стили по БЭМ, `src/styles`).
- **GSAP + ScrollTrigger**, **Lenis** — движок анимаций в `src/engine`.
- Шрифты — `next/font/google` (самохостинг, без запросов к Google из браузера).

## Команды

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # продакшен-сборка
npm run start      # запуск собранного сайта
npm run typecheck  # проверка типов
```

## Структура

```
src/
  app/
    (en)/            корневой layout и страница «/»
    (ru)/ru/, (uk)/uk/  то же для /ru/ и /uk/ (у каждого языка свой <html lang> и свои шрифты)
    robots.ts, sitemap.ts, manifest.ts
  components/
    LandingPage.tsx  сборка страницы из секций
    sections/        секции страницы (серверные компоненты)
    icons.tsx        SVG-иконки
    Engine.tsx       клиентский компонент: запускает движок анимаций
    RootDocument.tsx общий <html>/<head> для трёх языков
  engine/            движок анимаций (императивный TS: ищет элементы по классам и data-атрибутам)
  i18n/              языки и словари (en — эталон, его форма задаёт тип для ru/uk)
  lib/               адрес сайта, данные тарифов, SEO (metadata, JSON-LD), шрифты
  styles/            SCSS
public/
  img/               картинки, иконки, og-image
  seq/               кадры видео: void-*/orbit-* × hd (1920, десктоп) / sd (1280, остальные)
```

### Как устроен движок

Разметка рендерится на сервере, а после гидратации `<Engine>` один раз запускает `src/engine/index.ts`.
Движок находит элементы по классам и `data-*` атрибутам, поэтому при правке разметки секций их нужно сохранять.
Порядок запуска (прелоадер → шрифты → ScrollTrigger'ы по порядку секций) — в `src/engine/index.ts`.

### Кадры видео

При перенарезке кадров в `public/seq/*` поменяйте `SEQ_V` в `src/lib/site.ts`: имена файлов те же,
а кадры кэшируются браузером на год (см. `headers()` в `next.config.ts`).

## Деплой на Vercel

1. Импортируйте репозиторий в Vercel (New Project → Import Git Repository). Framework Preset определится как Next.js,
   настройки сборки менять не нужно.
2. Адрес сайта для canonical, hreflang, Open Graph, `robots.txt` и `sitemap.xml` берётся автоматически
   из продакшен-домена проекта (`*.vercel.app`). Для своего домена задайте переменную окружения
   `NEXT_PUBLIC_SITE_URL` (например, `https://example.com`) и пересоберите проект.
