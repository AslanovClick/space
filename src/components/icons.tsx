import type { ReactElement } from 'react';
import type { Plan } from '@/lib/site';

// Иконки сайта: содержимое <svg> у каждой своё, обёртка — в компонентах ниже

export type IconName =
  | 'bolt'
  | 'uptime'
  | 'orbit'
  | 'gauge'
  | 'pulse'
  | 'fiber'
  | 'shield'
  | 'core'
  | 'route'
  | 'satellite'
  | 'globe'
  | 'home'
  | 'chip'
  | 'comms'
  | 'unlock'
  | 'arrow'
  | 'check'
  | 'pin'
  | 'user'
  | 'send'
  | 'spark'
  | 'scan';

const ICONS: Record<IconName, ReactElement> = {
  bolt: <path d="M13.5 2.5 5 13.5h6.2l-.7 8 8.5-11h-6.2z" />,
  uptime: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="m8.6 12.2 2.4 2.4 4.5-4.8" />
      <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2" />
    </>
  ),
  orbit: (
    <>
      <circle cx="12" cy="12" r="2.2" />
      <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-30 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(30 12 12)" />
    </>
  ),
  gauge: (
    <>
      <path d="M4.21 17.5A9 9 0 1 1 19.79 17.5" />
      <path d="m12 13 4.6-4.6" />
      <path d="M12 4v2M5.64 6.64l1.41 1.41M3 13h2M21 13h-2M18.36 6.64l-1.41 1.41" />
      <circle cx="12" cy="13" r="1.3" />
    </>
  ),
  pulse: <path d="M2 12h4.5l2-5.5 3.5 11 2.5-8 1.5 2.5H22" />,
  fiber: (
    <>
      <path d="M2 6.5h6.5l5 5.5M2 17.5h6.5l5-5.5M2 12h20" />
      <path d="M18.5 8.5 22 12l-3.5 3.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 19.5 5.5v6c0 4.6-3.1 8.3-7.5 9.9-4.4-1.6-7.5-5.3-7.5-9.9v-6z" />
      <path d="m8.6 12.1 2.4 2.4 4.4-4.6" />
    </>
  ),
  core: (
    <>
      <path d="m12 2.2 8.5 4.9v9.8L12 21.8l-8.5-4.9V7.1z" />
      <path d="m12 7.6 3.8 2.2v4.4L12 16.4l-3.8-2.2V9.8z" />
      <path d="M12 2.2v5.4M12 16.4v5.4" />
    </>
  ),
  route: (
    <>
      <path d="M2.5 3.5h5v5h-5zM16.5 3.5h5v5h-5zM9.5 15.5h5v5h-5z" />
      <path d="M7.5 6h9M5 8.5V12h14V8.5M12 12v3.5" />
    </>
  ),
  satellite: (
    <>
      <path d="M9.5 9.5h5v5h-5zM2.5 9.5h5v5h-5zM16.5 9.5h5v5h-5z" />
      <path d="M7.5 12h2M14.5 12h2M12 9.5v-3" />
      <path d="M9 4.5a4.2 4.2 0 0 1 6 0" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <ellipse cx="12" cy="12" rx="4" ry="9.5" />
      <path d="M2.5 12h19M3.8 7.2h16.4M3.8 16.8h16.4" />
    </>
  ),
  home: (
    <>
      <path d="M3 11.5 12 3.5l9 8" />
      <path d="M5.5 9.5v11h13v-11" />
      <path d="M10 20.5V15h4v5.5" />
    </>
  ),
  chip: (
    <>
      <path d="M6 6h12v12H6zM9.5 9.5h5v5h-5z" />
      <path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5" />
    </>
  ),
  comms: (
    <>
      <path d="M12 10.5v11M8.5 21.5h7" />
      <circle cx="12" cy="8.5" r="2" />
      <path d="M8.2 4.7a5.4 5.4 0 0 0 0 7.6M15.8 4.7a5.4 5.4 0 0 1 0 7.6M5.35 1.85a9.4 9.4 0 0 0 0 13.3M18.65 1.85a9.4 9.4 0 0 1 0 13.3" />
    </>
  ),
  unlock: (
    <>
      <path d="M4 11h16v10.5H4z" />
      <path d="M8 11V7.5a4 4 0 0 1 7.6-1.7" />
      <path d="M12 15v3" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h15.5" />
      <path d="m13.5 6 6 6-6 6" />
    </>
  ),
  check: <path d="m4.5 12.5 4.8 4.8L19.5 7" />,
  pin: (
    <>
      <path d="M12 21.5s-7-6.3-7-12a7 7 0 0 1 14 0c0 5.7-7 12-7 12z" />
      <path d="M10 7.5h4v4h-4z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4.5" />
      <path d="M3.5 21.5c.8-4.3 4.3-7 8.5-7s7.7 2.7 8.5 7" />
    </>
  ),
  send: (
    <>
      <path d="M21.5 2.5 2.5 10l7.5 3.5 3.5 7.5z" />
      <path d="M21.5 2.5 10 13.5" />
    </>
  ),
  spark: <path fill="currentColor" stroke="none" d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />,
  scan: (
    <>
      <path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
      <path d="M7 12h10" />
    </>
  ),
};

export type SocialName = 'x' | 'facebook' | 'instagram' | 'youtube';

const SOCIALS: Record<SocialName, ReactElement> = {
  x: <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z" />,
  facebook: <path d="M14 8h3V4h-3c-2.76 0-4.5 1.83-4.5 4.6V11H7v4h2.5v7h4v-7h3l.5-4h-3.5V8.9c0-.6.32-.9 1-.9z" />,
  instagram: <path fillRule="evenodd" d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8zm4 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm5-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />,
  youtube: <path fillRule="evenodd" d="M21.6 7.2a2.5 2.5 0 0 0-1.77-1.77C18.27 5 12 5 12 5s-6.27 0-7.83.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.77 1.77C5.73 19 12 19 12 19s6.27 0 7.83-.43a2.5 2.5 0 0 0 1.77-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.1V8.9l5.3 3.1L10 15.1z" />,
};

export type MarkName = 'ring' | 'arcs' | 'burst' | 'slash' | 'chevron' | 'tri' | 'hex' | 'horizon';

// геометрические знаки вымышленных партнёров
const MARKS: Record<MarkName, ReactElement> = {
  ring: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="19" cy="6" r="2" fill="currentColor" stroke="none" />
    </>
  ),
  arcs: (
    <>
      <path d="M4 18a10 10 0 0 1 16 0" />
      <path d="M7.5 18a6 6 0 0 1 9 0" />
      <path d="M11 18a1.5 1.5 0 0 1 2 0" />
    </>
  ),
  burst: <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" />,
  slash: <path d="M9 3 4 21M15 3l-5 18M20 3l-5 18" />,
  chevron: (
    <>
      <path d="m3 5 9 14 9-14" />
      <path d="m8 5 4 6.3L16 5" />
    </>
  ),
  tri: (
    <>
      <path d="M12 3 21.5 20h-19z" />
      <path d="M12 10.5 16 17.5H8z" />
    </>
  ),
  hex: (
    <>
      <path d="m12 2.5 8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z" />
      <path d="M12 2.5v19" />
    </>
  ),
  horizon: (
    <>
      <path d="M3 15.5a9 9 0 0 1 18 0" />
      <path d="M1.5 15.5h21M5.5 19h13" />
    </>
  ),
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className={`icon icon--${name}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

// иконка в HUD-рамке с уголками
export function Ico({ name }: { name: IconName }) {
  return (
    <span className="ico">
      <Icon name={name} />
    </span>
  );
}

export function Social({ name }: { name: SocialName }) {
  return (
    <svg className={`icon icon--${name}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      {SOCIALS[name]}
    </svg>
  );
}

export function Mark({ name }: { name: MarkName }) {
  return (
    <svg
      className="mark"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {MARKS[name]}
    </svg>
  );
}

// знак бренда: горизонт событий и аккреционный диск
export function Logo() {
  return (
    <svg className="logo-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        d="M5.2 27.6C3.6 23.4 13 18.6 26.2 16.8c11.6-1.6 18.4.6 16.6 4.6"
        fill="none"
        stroke="url(#g-line)"
        strokeWidth="2"
      />
      <circle cx="24" cy="24" r="9.5" fill="#05040b" stroke="#f4f2ff" strokeWidth="2" />
      <path
        d="M42.8 21.4c-1.6 4-11.4 8.4-23.4 9.8-9.4 1.1-13.2-.6-14.2-3.6"
        fill="none"
        stroke="url(#g-line)"
        strokeWidth="2"
      />
    </svg>
  );
}

export type PlanIconType = Plan['id'];

export function PlanIcon({ type }: { type: PlanIconType }) {
  return (
    <svg
      className="plan__glyph"
      viewBox="0 0 48 48"
      fill="none"
      stroke="url(#g-line)"
      strokeWidth="1.6"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      {type === 'cosmic' ? (
        <>
          <circle cx="24" cy="24" r="9" />
          <ellipse cx="24" cy="24" rx="20" ry="6" transform="rotate(-18 24 24)" />
        </>
      ) : type === 'galactic' ? (
        <>
          <circle cx="24" cy="24" r="7" />
          <ellipse cx="24" cy="24" rx="20" ry="6.5" transform="rotate(25 24 24)" />
          <ellipse cx="24" cy="24" rx="20" ry="6.5" transform="rotate(-25 24 24)" />
        </>
      ) : (
        <>
          <path d="m24 15 3 9-3 9-3-9z" />
          <path d="M24 3v7M24 38v7M3 24h7M38 24h7M9.2 9.2l5 5M33.8 33.8l5 5M38.8 9.2l-5 5M14.2 33.8l-5 5" />
        </>
      )}
    </svg>
  );
}

// общий градиент для обводок (url(#g-line)) — один на страницу
export function SvgDefs() {
  return (
    <svg className="svg-defs" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="g-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9a2ff" />
          <stop offset="1" stopColor="#5d8dff" />
        </linearGradient>
      </defs>
    </svg>
  );
}
