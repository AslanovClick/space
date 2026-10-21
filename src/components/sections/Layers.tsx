import { BRAND } from '@/lib/site';
import { Logo } from '../icons';
import type { SectionProps } from './types';

// Фоновые слои: прелоадер, звёзды, шум
export function Layers({ t }: SectionProps) {
  return (
    <>
      {/* Прелоадер: WebGL-планета + орбиты/спутники на canvas + HUD */}
      <div className="preloader" data-preloader="" aria-hidden="true">
        <canvas className="preloader__gl" data-pre-gl="" aria-hidden="true" />
        <canvas className="preloader__hud" data-pre-hud="" aria-hidden="true" />
        <div className="preloader__ui" data-pre-ui="">
          <span className="preloader__corner preloader__corner--tl" />
          <span className="preloader__corner preloader__corner--tr" />
          <span className="preloader__corner preloader__corner--bl" />
          <span className="preloader__corner preloader__corner--br" />
          <div className="preloader__top">
            <span className="preloader__brand">
              <Logo />
              {BRAND}
            </span>
            <span className="preloader__meta">{t.pre.meta}</span>
          </div>
          <p className="preloader__coords">
            RA 17h 45m 40s
            <br />
            DEC −29° 00′ 28″
          </p>
          <div className="preloader__log" data-pre-log="" aria-hidden="true" />
          <div className="preloader__center">
            <p className="preloader__count">
              <span data-preloader-count="">000</span>
              <small>%</small>
            </p>
            <p className="preloader__status" data-pre-status="">
              {t.js.status[0]}
            </p>
          </div>
          <p className="preloader__buf" data-pre-buf="">
            {`${t.js.buffer} 000 / 000`}
          </p>
          <div className="preloader__bar">
            <span data-preloader-bar="" />
          </div>
        </div>
      </div>

      <canvas className="stars" data-stars="" aria-hidden="true" />

      <div className="noise" aria-hidden="true" />
    </>
  );
}
