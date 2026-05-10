/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  allowedDevOrigins: ['192.168.1.2'],
  pageExtensions: ['ts', 'tsx'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
