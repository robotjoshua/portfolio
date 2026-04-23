/** @type {import('next').NextConfig} */
const isExport = process.env.BUILD_TARGET === 'export';

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['sharp'],
  ...(isExport && {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,
  }),
};

export default nextConfig;
