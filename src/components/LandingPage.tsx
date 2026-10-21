import { getDictionary, LANGS, type Lang } from '@/i18n';
import { buildJsonLd, serializeJsonLd } from '@/lib/seo';
import { Engine } from './Engine';
import { SvgDefs } from './icons';
import { ChapterOrbit } from './sections/ChapterOrbit';
import { ChapterVoid } from './sections/ChapterVoid';
import { Cta } from './sections/Cta';
import { Footer } from './sections/Footer';
import { Header } from './sections/Header';
import { Layers } from './sections/Layers';
import { Perks } from './sections/Perks';
import { Plans } from './sections/Plans';
import { Tech } from './sections/Tech';

// Вся страница — серверные компоненты (готовый HTML без JS); оживляет её движок анимаций в <Engine>
export function LandingPage({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const props = { lang, t };

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <SvgDefs />
      <Layers {...props} />
      <Header {...props} />
      <main className="body-wrap" id="main" tabIndex={-1}>
        <ChapterVoid {...props} />
        <Tech {...props} />
        <ChapterOrbit {...props} />
        <Plans {...props} />
        <Perks {...props} />
        <Cta {...props} />
      </main>
      <Footer {...props} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildJsonLd(lang)) }} />
      <Engine intl={LANGS[lang].intl} strings={t.js} />
    </>
  );
}
