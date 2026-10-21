import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // адреса языковых версий — /ru/ и /uk/, как на исходном статическом сайте
  trailingSlash: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        // кадры видео неизменны: при перенарезке меняется SEQ_V (?v=) в src/lib/site.ts
        source: '/seq/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
