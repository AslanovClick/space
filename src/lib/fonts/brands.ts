import {
  Audiowide,
  Bruno_Ace_SC,
  Chakra_Petch,
  Orbitron,
  Oxanium,
  Syncopate,
  Tektur,
  Unica_One,
} from 'next/font/google';

// Шрифты логотипов партнёров в бегущей ленте — ниже первого экрана, поэтому без preload.
// next/font принимает только литералы, поэтому опции повторяются
const orbitron = Orbitron({ weight: '700', subsets: ['latin'], display: 'swap', preload: false, variable: '--ff-orbitron' });
const audiowide = Audiowide({ weight: '400', subsets: ['latin'], display: 'swap', preload: false, variable: '--ff-audiowide' });
const syncopate = Syncopate({ weight: '700', subsets: ['latin'], display: 'swap', preload: false, variable: '--ff-syncopate' });
const oxanium = Oxanium({ weight: '600', subsets: ['latin'], display: 'swap', preload: false, variable: '--ff-oxanium' });
const tektur = Tektur({ weight: '600', subsets: ['latin'], display: 'swap', preload: false, variable: '--ff-tektur' });
const chakra = Chakra_Petch({ weight: '600', subsets: ['latin'], display: 'swap', preload: false, variable: '--ff-chakra' });
const unica = Unica_One({ weight: '400', subsets: ['latin'], display: 'swap', preload: false, variable: '--ff-unica' });
const bruno = Bruno_Ace_SC({ weight: '400', subsets: ['latin'], display: 'swap', preload: false, variable: '--ff-bruno' });

export const brandFonts = [orbitron, audiowide, syncopate, oxanium, tektur, chakra, unica, bruno]
  .map((f) => f.variable)
  .join(' ');
