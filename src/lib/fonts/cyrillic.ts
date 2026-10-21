import { JetBrains_Mono, Manrope, Michroma, Unbounded } from 'next/font/google';

// Русская и украинская версии: у Michroma и Space Grotesk нет кириллицы — Unbounded + Manrope; Michroma — только для логотипа
const unbounded = Unbounded({ weight: ['400', '500'], subsets: ['latin', 'cyrillic'], display: 'swap', variable: '--ff-unbounded' });
const manrope = Manrope({ weight: ['400', '500', '600'], subsets: ['latin', 'cyrillic'], display: 'swap', variable: '--ff-manrope' });
const mono = JetBrains_Mono({ weight: ['400', '500'], subsets: ['latin', 'cyrillic'], display: 'swap', variable: '--ff-mono' });
const michroma = Michroma({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--ff-michroma' });

export const cyrillicFonts = [unbounded.variable, manrope.variable, mono.variable, michroma.variable].join(' ');
