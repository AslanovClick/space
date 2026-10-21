import Image from 'next/image';
import { Icon } from '../icons';
import type { SectionProps } from './types';

// кадр занимает 72% блока справа (на планшете — всю ширину) и увеличен scale(1.15) (_cta.scss); блок — ширина контейнера до 1280px
const CTA_SIZES = '(max-width: 1024px) 100vw, (max-width: 1320px) 83vw, 1060px';

export function Cta({ t }: SectionProps) {
  return (
    <section className="cta" aria-labelledby="cta-title" data-rest="">
      <div className="container">
        <div className="cta__box" data-cta="">
          <div className="cta__media">
            <Image
              className="cta__img"
              src="/img/cta-moon.webp"
              alt=""
              width={1920}
              height={1080}
              sizes={CTA_SIZES}
              data-cta-img=""
            />
          </div>
          <div className="cta__content">
            <p className="label" data-scramble="">
              {t.cta.label}
            </p>
            <h2 className="title" id="cta-title" data-type="">
              {t.cta.t1}
              <br />
              <span className="grad">{t.cta.t2}</span>
            </h2>
            <p className="text" data-fade="">
              {t.cta.text}
            </p>
            <div className="cta__actions" data-fade="">
              <a className="btn btn--primary" href="#plans" data-magnetic="">
                <span>{t.cta.connect}</span>
                <Icon name="arrow" />
              </a>
              <a className="btn btn--ghost" href="#" data-magnetic="">
                <span>{t.cta.talk}</span>
                <Icon name="comms" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
