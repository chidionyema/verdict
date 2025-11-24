/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Turbopack config (required for Next.js 16+)
  turbopack: {
    // Enable Turbopack optimizations
  },
  
  // Image optimization - updated for Next.js 16
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // API response caching
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=10, stale-while-revalidate=59'
          },
          // Security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      },
      {
        source: '/static/:path*',
        headers: [
          // Long-term caching for static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/:path*',
        headers: [
          // Page caching
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=600'
          }
        ]
      }
    ]
  },

  // Note: webpack config removed for Turbopack compatibility
  // Bundle optimization is now handled by Turbopack automatically
}

module.exports = nextConfig