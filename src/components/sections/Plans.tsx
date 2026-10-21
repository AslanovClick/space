import { formatNum } from '@/i18n';
import { getPlans, type Plan } from '@/lib/site';
import { Icon, PlanIcon } from '../icons';
import type { SectionProps } from './types';

function PlanCard({ o, lang, t }: SectionProps & { o: Plan }) {
  return (
    <article
      className={o.featured ? 'plan plan--featured' : 'plan'}
      aria-labelledby={`plan-${o.id}`}
      data-plan=""
      data-tilt=""
    >
      {o.featured && (
        <>
          <span className="plan__ring" aria-hidden="true" />
          <p className="plan__badge" data-plan-badge="">
            <Icon name="spark" />
            {t.plans.popular}
          </p>
        </>
      )}
      <div className="plan__head">
        <span className="plan__code" aria-hidden="true">
          {o.code}
        </span>
        <PlanIcon type={o.id} />
      </div>
      <h3 className="plan__name" id={`plan-${o.id}`}>
        {o.name}
      </h3>
      <p className="plan__desc">{o.desc}</p>
      <p className="plan__price">
        <span className="plan__currency">$</span>
        <span className="plan__amount" data-count={o.price} data-decimals="2">
          {formatNum(lang, o.price, 2)}
        </span>
        <span className="plan__period">
          <span aria-hidden="true">{t.plans.mo}</span>
          <span className="sr-only">{` ${t.plans.perMonth}`}</span>
        </span>
      </p>
      <p className="plan__speed">
        <Icon name="bolt" />
        <span>{o.speed}</span>
      </p>
      <ul className="plan__list">
        {o.list.map((item) => (
          <li key={item}>
            <Icon name="check" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <a className={`btn btn--block ${o.featured ? 'btn--primary' : 'btn--ghost'}`} href="#" data-magnetic="">
        <span>
          {t.plans.start}
          <span className="sr-only">{` ${t.plans.startSr.replace('{name}', o.name)}`}</span>
        </span>
        <Icon name="arrow" />
      </a>
    </article>
  );
}

// Пин: тарифы собираются по скроллу
export function Plans({ lang, t }: SectionProps) {
  return (
    <section className="plans" id="plans" aria-labelledby="plans-title" data-plans="">
      <div className="container">
        <div className="section-head">
          <p className="label" data-scramble="">
            {t.plans.label}
          </p>
          <h2 className="title" id="plans-title" data-type="">
            <span className="grad">{t.plans.title}</span>
          </h2>
        </div>
        <div className="plans__grid" data-plans-grid="">
          {getPlans(t).map((pl) => (
            <PlanCard key={pl.id} o={pl} lang={lang} t={t} />
          ))}
        </div>
        <ul className="plans__note" aria-label={t.plans.noteAria}>
          {t.plans.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
