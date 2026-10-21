import { formatNum } from '@/i18n';
import { SEQ_V } from '@/lib/site';
import { Icon } from '../icons';
import type { SectionProps } from './types';

// Глава 2: орбита — Земля, корабль-ретранслятор (его ведёт HUD-прицел), Луна
export function ChapterOrbit({ lang, t }: SectionProps) {
  return (
    <section
      className="chapter chapter--orbit"
      id="coverage"
      aria-label={t.orbit.aria}
      data-chapter="orbit"
      data-seq="/seq/orbit-sd/"
      data-seq-hd="/seq/orbit-hd/"
      data-seq-v={SEQ_V}
      data-count="417"
      data-duration="16.68"
      data-map="0:0,.28:.2,.34:.24,.62:.58,.68:.66,1:1"
      data-focus=".5"
      data-focus-m=".62"
    >
      <div className="chapter__stage">
        <canvas className="chapter__canvas" data-canvas="" />
        <div className="chapter__veil" />

        <div className="reticle" data-reticle="" aria-hidden="true">
          <span className="reticle__c reticle__c--tl" />
          <span className="reticle__c reticle__c--tr" />
          <span className="reticle__c reticle__c--bl" />
          <span className="reticle__c reticle__c--br" />
          <span className="reticle__cross" />
          <div className="reticle__label">
            <span className="reticle__id">{t.orbit.lock}</span>
            <span data-reticle-dist="">{`${t.js.dist} ${formatNum(lang, '1240', 0, true)} ${t.js.km}`}</span>
            <span className="reticle__ok">{t.orbit.stable}</span>
          </div>
        </div>

        {/* 1 — покрытие */}
        <section className="panel panel--coverage" aria-labelledby="coverage-title" data-panel="" data-in="0" data-out=".28">
          <div className="panel__shade panel__shade--left" />
          <div className="container split">
            <div className="split__col">
              <p className="label" data-scramble="">
                {t.orbit.label}
              </p>
              <h2 className="title" id="coverage-title" data-type="">
                {t.orbit.t1}
                <br />
                <span className="grad">{t.orbit.t2}</span>
              </h2>
              <p className="text" data-fade="">
                {t.orbit.text}
              </p>
              <div className="stats" role="list">
                <div className="stat-box" role="listitem" data-card="">
                  <p className="stat-box__v">
                    <span data-count="190">190</span>+
                  </p>
                  <p className="stat-box__k">{t.orbit.countries}</p>
                </div>
                <div className="stat-box" role="listitem" data-card="">
                  <p className="stat-box__v">
                    <span data-count="4200" data-format="comma">
                      {formatNum(lang, '4200', 0, true)}
                    </span>
                  </p>
                  <p className="stat-box__k">{t.orbit.nodes}</p>
                </div>
                <div className="stat-box" role="listitem" data-card="">
                  <p className="stat-box__v">
                    <span data-count="550">550</span>
                    <small>{t.u.km}</small>
                  </p>
                  <p className="stat-box__k">{t.orbit.altitude}</p>
                </div>
                <div className="stat-box" role="listitem" data-card="">
                  <p className="stat-box__v">
                    <span data-count="99.99" data-decimals="2">
                      {formatNum(lang, '99.99', 2)}
                    </span>
                    <small>%</small>
                  </p>
                  <p className="stat-box__k">{t.orbit.uptime}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2 — ретранслятор: телеметрия «живая» */}
        <section className="panel panel--relay" aria-labelledby="relay-title" data-panel="" data-in=".34" data-out=".62">
          <div className="panel__shade panel__shade--left" />
          <div className="container relay">
            <div className="relay__card" data-card="">
              <p className="label">{t.orbit.relayLabel}</p>
              <h2 className="title title--sm" id="relay-title" data-type="">
                {t.orbit.relayT1}
                <br />
                <span className="grad">{t.orbit.relayT2}</span>
              </h2>
              <p className="text">{t.orbit.relayText}</p>
              <dl className="telemetry">
                <div>
                  <dt>{t.orbit.velocity}</dt>
                  <dd data-tele="vel">{`${formatNum(lang, '7.6', 2)} ${t.js.kms}`}</dd>
                </div>
                <div>
                  <dt>{t.orbit.linkLatency}</dt>
                  <dd data-tele="lat">{`${formatNum(lang, '4.2', 1)} ${t.js.ms}`}</dd>
                </div>
                <div>
                  <dt>{t.orbit.throughput}</dt>
                  <dd data-tele="thr">{`${formatNum(lang, '9.8', 2)} ${t.js.gbps}`}</dd>
                </div>
                <div>
                  <dt>{t.orbit.status}</dt>
                  <dd className="telemetry__ok">{t.orbit.online}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* 3 — луна: проверка адреса */}
        <section className="panel panel--beyond" aria-labelledby="beyond-title" data-panel="" data-in=".68" data-out="1">
          <div className="panel__shade panel__shade--beyond" />
          <div className="container beyond">
            <div className="beyond__head">
              <p className="label" data-scramble="">
                {t.orbit.beyondLabel}
              </p>
              <h2 className="title" id="beyond-title" data-type="">
                {t.orbit.beyondT1}
                <br />
                <span className="grad">{t.orbit.beyondT2}</span>
              </h2>
            </div>
            <div className="beyond__check" data-card="">
              <p className="beyond__lead" id="check-lead">
                {t.orbit.checkLead}
              </p>
              <form className="check" data-check="" noValidate aria-labelledby="check-lead">
                <label className="sr-only" htmlFor="check-address">
                  {t.orbit.checkLabel}
                </label>
                <Icon name="pin" />
                <input
                  id="check-address"
                  type="text"
                  name="address"
                  placeholder={t.orbit.checkPh}
                  autoComplete="street-address"
                  required
                  aria-describedby="check-result"
                />
                <button className="btn btn--primary" type="submit">
                  <span>{t.js.scan}</span>
                  <Icon name="scan" />
                </button>
              </form>
              <p className="check__result" id="check-result" data-check-result="" role="status" aria-live="polite" />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
