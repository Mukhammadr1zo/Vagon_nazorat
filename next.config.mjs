/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
