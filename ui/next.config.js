/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      ws: false,
    };
    return config;
  },
  images: {
    domains: ['cdn-production-opera-website.operacdn.com'],
  },
};

module.exports = nextConfig;