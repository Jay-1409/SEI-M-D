/** @type {import('next').NextConfig} */
const backendApiOrigin =
  process.env.BACKEND_API_ORIGIN ||
  "http://backend-service.deployer-system.svc.cluster.local:8000";

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/service-details.html",
        destination: "/service-details",
        permanent: false,
      },
      {
        source: "/index.html",
        destination: "/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiOrigin}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
