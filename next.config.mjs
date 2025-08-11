/** @type {import('next').NextConfig} */
const nextConfig = {
  // Общая оптимизация
  webpack: (config, { isServer, dev }) => {
    // Оптимизация разделения chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    };

    // Fallback для серверных модулей
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Дополнительные настройки для dev-режима
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    return config;
  },

  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    domains: [
      'localhost',
      'supabase.co',
      'supabase.com',
      'blob.v0.dev',
      'images.unsplash.com',
      'via.placeholder.com',
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',

  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  poweredByHeader: false,
  compress: true,

  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
