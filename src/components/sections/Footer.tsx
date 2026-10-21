import { BRAND } from '@/lib/site';
import { Icon, Logo, Social } from '../icons';
import type { SectionProps } from './types';

export function Footer({ t }: SectionProps) {
  return (
    <footer className="footer" id="about">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand" data-fade="">
            <a className="logo" href="#home" aria-label={t.logoHome}>
              <span className="logo__icon">
                <Logo />
              </span>
              <span className="logo__text">
                <span className="logo__name">{BRAND}</span>
                <span className="logo__sub">{t.premium}</span>
              </span>
            </a>
            <p className="footer__note">{t.footer.note}</p>
          </div>
          <nav className="footer__col" aria-labelledby="f-company" data-fade="" data-delay=".08">
            <h2 className="footer__title" id="f-company">
              {t.footer.company}
            </h2>
            <ul className="footer__links">
              {t.footer.companyLinks.map((l) => (
                <li key={l}>
                  <a href="#">{l}</a>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="footer__col" aria-labelledby="f-resources" data-fade="" data-delay=".16">
            <h2 className="footer__title" id="f-resources">
              {t.footer.resources}
            </h2>
            <ul className="footer__links">
              {t.footer.resourceLinks.map((l) => (
                <li key={l}>
                  <a href="#">{l}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="footer__col footer__subscribe" data-fade="" data-delay=".24">
            <h2 className="footer__title">{t.footer.stay}</h2>
            <p className="footer__text" id="subscribe-hint">
              {t.footer.stayText}
            </p>
            <form className="subscribe" data-subscribe="" noValidate>
              <label className="sr-only" htmlFor="subscribe-email">
                {t.footer.email}
              </label>
              <input
                id="subscribe-email"
                type="email"
                name="email"
                placeholder={t.footer.emailPh}
                autoComplete="email"
                required
                aria-describedby="subscribe-hint subscribe-status"
              />
              <button type="submit" aria-label={t.footer.subscribe}>
                <Icon name="send" />
                <Icon name="check" />
              </button>
              <p className="sr-only" id="subscribe-status" role="status" aria-live="polite" data-subscribe-status="" />
            </form>
            <nav className="socials" aria-label={t.footer.social}>
              <a href="#" aria-label="X">
                <Social name="x" />
              </a>
              <a href="#" aria-label="Facebook">
                <Social name="facebook" />
              </a>
              <a href="#" aria-label="Instagram">
                <Social name="instagram" />
              </a>
              <a href="#" aria-label="YouTube">
                <Social name="youtube" />
              </a>
            </nav>
          </div>
        </div>
        <div className="footer__bottom">
          {/* год при сборке; движок обновляет [data-year] в браузере */}
          <p>
            {'© '}
            <span data-year="">{new Date().getFullYear()}</span>
            {` ${BRAND}. ${t.footer.rights}`}
          </p>
          <p className="footer__coords">{`51.4778° N · 0.0015° W · ${t.footer.nominal}`}</p>
        </div>
      </div>
    </footer>
  );
}
