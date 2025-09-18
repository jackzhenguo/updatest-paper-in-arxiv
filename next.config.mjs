/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: false,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
