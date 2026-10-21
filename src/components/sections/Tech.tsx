import Image from 'next/image';
import { Ico, type IconName } from '../icons';
import type { SectionProps } from './types';

// картинки/иконки шагов общие, тексты — из словаря (t.tech.steps по тому же индексу)
const STEPS: { icon: IconName; img: string; w: number; h: number }[] = [
  { icon: 'core', img: 'step-core', w: 1280, h: 720 },
  { icon: 'route', img: 'step-routing', w: 1280, h: 720 },
  { icon: 'satellite', img: 'step-relay', w: 1600, h: 900 },
  { icon: 'fiber', img: 'step-fiber', w: 1600, h: 900 },
  { icon: 'home', img: 'step-home', w: 1280, h: 720 },
];

// ширина кадра = 124% карточки (_tech.scss): карточка 430px, на планшете min(420px, 78vw) → до 538px вьюпорта ~97vw
const STEP_SIZES = '(max-width: 538px) 97vw, 534px';

// Пин: секция прилипает, шаги едут горизонтально
export function Tech({ t }: SectionProps) {
  return (
    <section className="tech" id="technology" aria-labelledby="tech-title" data-tech="">
      <div className="tech__inner">
        <div className="container tech__head">
          <div>
            <p className="label" data-scramble="">
              {t.tech.label}
            </p>
            <h2 className="title" id="tech-title" data-type="">
              {t.tech.t1}
              <br />
              <span className="grad">{t.tech.t2}</span>
            </h2>
          </div>
          <div className="tech__meta">
            <p className="text" data-fade="">
              {t.tech.text}
            </p>
            <div className="tech__progress" data-fade="" aria-hidden="true">
              <span className="tech__count">
                <span data-tech-index="">01</span>
                {' / 05'}
              </span>
              <span className="tech__bar">
                <span data-tech-bar="" />
              </span>
            </div>
          </div>
        </div>
        <div className="tech__track" data-tech-track="">
          {STEPS.map((s, i) => {
            const step = t.tech.steps[i];
            return (
              <article key={s.img} className="step" data-step="">
                <div className="step__media">
                  <Image src={`/img/${s.img}.webp`} alt="" width={s.w} height={s.h} sizes={STEP_SIZES} data-step-img="" />
                  <span className="step__tag" aria-hidden="true">
                    {`${t.tech.hop} 0${i + 1}`}
                  </span>
                </div>
                <div className="step__body">
                  <div className="step__head">
                    <span className="step__num" aria-hidden="true">
                      {`0${i + 1}`}
                    </span>
                    <Ico name={s.icon} />
                  </div>
                  <h3 className="step__title">{step.title}</h3>
                  <p className="step__text">{step.text}</p>
                  <dl className="step__specs">
                    {step.specs.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
