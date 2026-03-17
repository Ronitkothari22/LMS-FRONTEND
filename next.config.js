/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'res.cloudinary.com',
      'localhost',
      '127.0.0.1',
      'api.joiningdots.co.in'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'data.joiningdots.co.in',
        pathname: '/joining-dots-content/**',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; connect-src 'self' http://localhost:8080 https://localhost:8080 http://api.joiningdots.co.in https://api.joiningdots.co.in ws://api.joiningdots.co.in; img-src 'self' data: https: http: blob: https://data.joiningdots.co.in; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data: https:; frame-src 'self';"
          }
        ],
      },
    ];
  },
  async rewrites() {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
    return [
      // Proxy specific backend routes, excluding local API routes
      {
        source: '/api/auth/:path*',
        destination: apiBaseUrl + '/auth/:path*',
      },
      {
        source: '/api/sessions/:path*',
        destination: apiBaseUrl + '/sessions/:path*',
      },
      {
        source: '/api/teams/:path*',
        destination: apiBaseUrl + '/teams/:path*',
      },
      {
        source: '/api/quizzes/:path*',
        destination: apiBaseUrl + '/quizzes/:path*',
      },
      {
        source: '/api/polls/:path*',
        destination: apiBaseUrl + '/polls/:path*',
      },
      {
        source: '/api/dashboard/:path*',
        destination: apiBaseUrl + '/dashboard/:path*',
      },
      {
        source: '/api/content/:path*',
        destination: apiBaseUrl + '/content/:path*',
      },
      {
        source: '/api/feedback/:path*',
        destination: apiBaseUrl + '/feedback/:path*',
      },
      {
        source: '/api/survey/:path*',
        destination: apiBaseUrl + '/survey/:path*',
      },
      {
        source: '/api/survey-responses/:path*',
        destination: apiBaseUrl + '/survey-responses/:path*',
      },
      {
        source: '/api/surveys/:path*',
        destination: apiBaseUrl + '/surveys/:path*',
      },
      {
        source: '/api/users/:path*',
        destination: apiBaseUrl + '/users/:path*',
      },
      // All content and feedback routes will now be proxied to the backend
    ];
  },
  // Ensure trailing slashes are handled correctly
  trailingSlash: false,
  // Configure output for better static site generation
  output: 'standalone',
};

module.exports = nextConfig;
