import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND + ' — Premium internet',
    short_name: BRAND,
    start_url: '/',
    display: 'standalone',
    background_color: '#05040b',
    theme_color: '#05040b',
    icons: [
      { src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
