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
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      'framer-motion',
      '@radix-ui/react-icons',
      'viem',
      'wagmi'
    ],
  },
};

module.exports = nextConfig;