/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      'framer-motion',
      '@radix-ui/react-icons',
      'viem',
      'wagmi',
      '@rainbow-me/rainbowkit',
      '@celo/abis',
      '@celo/identity',
    ],
  },
  turbopack: {},
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      ws: false,
    };
    return config;
  },
};

export default nextConfig;
