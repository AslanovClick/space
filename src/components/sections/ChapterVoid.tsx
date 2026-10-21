import type { CSSProperties } from 'react';
import { formatNum } from '@/i18n';
import { SEQ_V } from '@/lib/site';
import { Icon, Ico, Mark, type MarkName } from '../icons';
import type { SectionProps } from './types';

type BrandInfo = { name: string; font: string; mark: MarkName };

// вымышленные партнёры: у каждого свой шрифт (класс brand--*) и геометрический знак
const BRANDS: BrandInfo[] = [
  { name: 'ORBITA', font: 'orbitron', mark: 'ring' },
  { name: 'NEBULON', font: 'audiowide', mark: 'arcs' },
  { name: 'QUASAR', font: 'syncopate', mark: 'burst' },
  { name: 'HELIX/9', font: 'oxanium', mark: 'slash' },
  { name: 'VANTA', font: 'tektur', mark: 'chevron' },
  { name: 'AXIOM', font: 'chakra', mark: 'tri' },
  { name: 'KRONOS', font: 'unica', mark: 'hex' },
  { name: 'ZENITH', font: 'bruno', mark: 'horizon' },
];

function Brand({ b }: { b: BrandInfo }) {
  return (
    <li className={`brand brand--${b.font}`} data-brand="">
      <span className="brand__plate">
        <Mark name={b.mark} />
        <span className="sr-only">{b.name}</span>
        <span className="brand__name" aria-hidden="true">
          {b.name.split('').map((ch, i) => (
            <span key={i} className="brand__ch" style={{ '--i': i } as CSSProperties}>
              {ch}
            </span>
          ))}
        </span>
      </span>
    </li>
  );
}

// Глава 1: видео «полёт к чёрной дыре» прокручивается скроллом, секции появляются поверх него
export function ChapterVoid({ lang, t }: SectionProps) {
  return (
    <section
      className="chapter chapter--void"
      id="home"
      aria-labelledby="hero-title"
      data-chapter="void"
      data-seq="/seq/void-sd/"
      data-seq-hd="/seq/void-hd/"
      data-seq-v={SEQ_V}
      data-count="477"
      data-map="0:0,.13:.12,.17:.34,.42:.52,.47:.58,.72:.84,.77:.88,1:1"
      data-focus=".5"
    >
      <div className="chapter__stage">
        <canvas className="chapter__canvas" data-canvas="" />
        <div className="chapter__veil" />

        {/* 1 — hero */}
        <div className="panel panel--hero" data-panel="" data-in="0" data-out=".13" data-cursor={t.hero.cursor}>
          <div className="panel__shade panel__shade--hero" />
          <div className="container hero">
            <h1 className="sr-only" id="hero-title">
              {t.hero.h1}
            </h1>
            <div className="hero__top">
              <p className="label">
                <span className="label__dot" />
                <span data-hero-kicker="">{t.hero.kicker}</span>
              </p>
              <p className="hero__t1" aria-hidden="true" data-hero-t1="">
                {t.hero.t1}
              </p>
            </div>
            <ul className="hero__hud" data-hero-hud="" aria-label={t.hero.hud}>
              <li className="hud-row">
                <Icon name="bolt" />
                <span className="hud-row__k">{t.hero.signal}</span>
                <span className="hud-row__v">{`10 ${t.u.gbps}`}</span>
              </li>
              <li className="hud-row">
                <Icon name="uptime" />
                <span className="hud-row__k">{t.hero.uptime}</span>
                <span className="hud-row__v">{`${formatNum(lang, '99.99', 2)}%`}</span>
              </li>
              <li className="hud-row">
                <Icon name="orbit" />
                <span className="hud-row__k">{t.hero.latency}</span>
                <span className="hud-row__v">{`< 5 ${t.u.ms}`}</span>
              </li>
            </ul>
            <div className="hero__bottom">
              <div className="hero__lead" data-hero-lead="">
                <p className="hero__text">{t.hero.text}</p>
                <div className="hero__actions">
                  <a className="btn btn--primary" href="#plans" data-magnetic="">
                    <span>{t.hero.plans}</span>
                    <Icon name="arrow" />
                  </a>
                  <a className="btn btn--ghost" href="#coverage" data-magnetic="">
                    <span>{t.hero.coverage}</span>
                    <Icon name="pin" />
                  </a>
                </div>
              </div>
              <p className="hero__t2" aria-hidden="true" data-hero-t2="">
                <span className="hero__line">{t.hero.t2a}</span>
                <span className="hero__line">
                  <span className="grad">{t.hero.t2b}</span>
                </span>
              </p>
            </div>
          </div>
          <div className="hero__hint" data-hero-hint="" aria-hidden="true">
            <span className="hero__hint-line" />
            <span className="hero__hint-text">{t.hero.hint}</span>
          </div>
        </div>

        {/* 2 — сеть: контент на тёмной тени горизонта событий */}
        <section className="panel panel--network" aria-labelledby="network-title" data-panel="" data-in=".17" data-out=".42">
          <div className="panel__shade panel__shade--left" />
          <div className="container split">
            <div className="split__col">
              <p className="label" data-scramble="">
                {t.net.label}
              </p>
              <h2 className="title" id="network-title" data-type="">
                {t.net.t1}
                <br />
                <span className="grad">{t.net.t2}</span>
              </h2>
              <p className="text" data-fade="">
                {t.net.text}
              </p>
              <div className="metrics" role="list">
                <div className="metric" role="listitem" data-card="" data-tilt="">
                  <div className="metric__top">
                    <Ico name="gauge" />
                    <span className="metric__label">{t.net.m1}</span>
                  </div>
                  <p className="metric__value">
                    <span data-count="10">10</span>
                    <span className="metric__unit">{t.u.gbps}</span>
                  </p>
                  <p className="metric__text">{t.net.m1t}</p>
                </div>
                <div className="metric" role="listitem" data-card="" data-tilt="">
                  <div className="metric__top">
                    <Ico name="pulse" />
                    <span className="metric__label">{t.net.m2}</span>
                  </div>
                  <p className="metric__value">
                    <span className="metric__unit metric__unit--pre">{'<'}</span>
                    <span data-count="5" data-from="99">5</span>
                    <span className="metric__unit">{t.u.ms}</span>
                  </p>
                  <p className="metric__text">{t.net.m2t}</p>
                </div>
                <div className="metric" role="listitem" data-card="" data-tilt="">
                  <div className="metric__top">
                    <Ico name="fiber" />
                    <span className="metric__label">{t.net.m3}</span>
                  </div>
                  <p className="metric__value">
                    <span data-count="100">100</span>
                    <span className="metric__unit">%</span>
                  </p>
                  <p className="metric__text">{t.net.m3t}</p>
                </div>
                <div className="metric" role="listitem" data-card="" data-tilt="">
                  <div className="metric__top">
                    <Ico name="shield" />
                    <span className="metric__label">{t.net.m4}</span>
                  </div>
                  <p className="metric__value">
                    <span data-scramble-value="">TIER IV</span>
                  </p>
                  <p className="metric__text">{t.net.m4t}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 — манифест: пролёт сквозь диск, слова подсвечиваются скроллом */}
        <section
          className="panel panel--manifesto"
          aria-label={t.man.aria}
          data-panel=""
          data-in=".47"
          data-out=".72"
          data-rest-at=".9"
        >
          <div className="panel__shade panel__shade--center" />
          <div className="container manifesto">
            <p className="label">{t.man.label}</p>
            <p className="manifesto__text" data-words="">
              {t.man.text}
            </p>
            <ul className="manifesto__meta">
              <li>
                <span>{t.man.latency}</span>
                <strong>{`< 5 ${t.u.ms}`}</strong>
              </li>
              <li>
                <span>{t.man.throughput}</span>
                <strong>{`10 ${t.u.gbps}`}</strong>
              </li>
              <li>
                <span>{t.man.medium}</span>
                <strong>{t.man.fiber}</strong>
              </li>
            </ul>
          </div>
        </section>

        {/* 4 — партнёры: спокойная галактика, 3D-логотипы */}
        <section className="panel panel--partners" aria-labelledby="partners-title" data-panel="" data-in=".77" data-out="1">
          <div className="panel__shade panel__shade--bottom" />
          <div className="partners">
            <div className="container partners__head">
              <p className="label" data-scramble="">
                {t.partners.label}
              </p>
              <h2 className="title" id="partners-title" data-type="">
                {t.partners.t1}
                <br />
                <span className="grad">{t.partners.t2}</span>
              </h2>
            </div>
            <div className="marquee" data-marquee="">
              <div className="marquee__row" data-dir="-1">
                <ul className="marquee__track" aria-label={t.partners.aria}>
                  {BRANDS.map((b) => (
                    <Brand key={b.name} b={b} />
                  ))}
                </ul>
              </div>
              {/* второй ряд — визуальный дубль, скринридерам не нужен */}
              <div className="marquee__row" data-dir="1" aria-hidden="true">
                <ul className="marquee__track">
                  {BRANDS.slice()
                    .reverse()
                    .map((b) => (
                      <Brand key={b.name} b={b} />
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
