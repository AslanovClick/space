import { Ico, type IconName } from '../icons';
import type { SectionProps } from './types';

// иконки преимуществ — по порядку t.perks.items
const PERK_ICONS: IconName[] = ['globe', 'chip', 'comms', 'unlock'];

export function Perks({ t }: SectionProps) {
  return (
    <section className="perks" aria-labelledby="perks-title" data-perks="" data-rest="">
      <div className="container">
        <h2 className="sr-only" id="perks-title">
          {t.perks.title}
        </h2>
        <div className="perks__grid" role="list">
          {t.perks.items.map((p, i) => (
            <div key={p[0]} className="perk" role="listitem" data-perk="">
              <Ico name={PERK_ICONS[i]} />
              <div>
                <h3 className="perk__title">{p[0]}</h3>
                <p className="perk__text">{p[1]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
