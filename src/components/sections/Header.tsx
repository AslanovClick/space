import { LANG_ORDER, LANGS, langHref, type Lang } from '@/i18n';
import { BRAND } from '@/lib/site';
import { Icon, Logo } from '../icons';
import type { SectionProps } from './types';

// пункты меню: якорь = id секции, подпись — из словаря (t.nav[id])
const NAV = ['home', 'technology', 'coverage', 'plans', 'about'] as const;

// ссылки на языковые версии (в шапке и в мобильном меню); обычные <a>: смена языка — полная загрузка страницы
function LangLinks({ cls, lang }: { cls: string; lang: Lang }) {
  return (
    <>
      {LANG_ORDER.map((l) => (
        <li key={l}>
          <a
            className={cls}
            href={langHref(l)}
            hrefLang={l}
            lang={l}
            aria-current={l === lang ? 'true' : undefined}
            data-lang-link={l}
          >
            <span className={`${cls}-code`}>{LANGS[l].code}</span>
            <span className={`${cls}-name`}>{LANGS[l].name}</span>
          </a>
        </li>
      ))}
    </>
  );
}

export function Header({ lang, t }: SectionProps) {
  return (
    <>
      <header className="header" data-header="">
        <div className="container header__inner">
          <a className="logo" href="#home" aria-label={t.logoHome}>
            <span className="logo__icon">
              <Logo />
            </span>
            <span className="logo__text">
              <span className="logo__name">{BRAND}</span>
              <span className="logo__sub">{t.premium}</span>
            </span>
          </a>
          <nav className="nav" data-nav="" aria-label={t.nav.aria}>
            {NAV.map((id, i) => (
              <a key={id} className={i === 0 ? 'nav__link is-active' : 'nav__link'} href={`#${id}`}>
                {t.nav[id]}
              </a>
            ))}
            <span className="nav__indicator" data-nav-indicator="" />
          </nav>
          {/* выбор языка */}
          <div className="lang" data-lang="">
            <button
              className="lang__btn"
              type="button"
              aria-expanded="false"
              aria-controls="lang-list"
              aria-label={`${t.lang}: ${LANGS[lang].name}`}
              data-lang-btn=""
            >
              <Icon name="globe" />
              <span>{LANGS[lang].code}</span>
              <span className="lang__caret" aria-hidden="true" />
            </button>
            <ul className="lang__list" id="lang-list" data-lang-list="">
              <LangLinks cls="lang__opt" lang={lang} />
            </ul>
          </div>
          <a className="btn-account" href="#" data-magnetic="">
            <Icon name="user" />
            <span>{t.nav.account}</span>
          </a>
          <button
            className="burger"
            type="button"
            data-burger=""
            aria-label={t.nav.open}
            aria-expanded="false"
            aria-controls="menu"
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className="menu" id="menu" data-menu="" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
        <nav className="menu__nav" aria-label={t.nav.ariaMobile}>
          {NAV.map((id, i) => (
            <a key={id} className="menu__link" href={`#${id}`}>
              <span className="menu__num">{`0${i + 1}`}</span>
              {t.nav[id]}
            </a>
          ))}
        </nav>
        <ul className="menu__langs" aria-label={t.lang}>
          <LangLinks cls="menu__lang" lang={lang} />
        </ul>
        <a className="btn btn--ghost menu__account" href="#">
          <Icon name="user" />
          <span>{t.nav.account}</span>
        </a>
      </div>
    </>
  );
}
