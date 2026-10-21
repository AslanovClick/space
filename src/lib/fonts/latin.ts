import { JetBrains_Mono, Michroma, Space_Grotesk } from 'next/font/google';

// Английская версия: Michroma (заголовки, логотип) + Space Grotesk (текст) + JetBrains Mono (HUD-подписи)
const michroma = Michroma({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--ff-michroma' });
const space = Space_Grotesk({ weight: ['400', '500', '600'], subsets: ['latin'], display: 'swap', variable: '--ff-space' });
const mono = JetBrains_Mono({ weight: ['400', '500'], subsets: ['latin'], display: 'swap', variable: '--ff-mono' });

export const latinFonts = [michroma.variable, space.variable, mono.variable].join(' ');
