/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['sharp'],
  async redirects() {
    return [{ source: '/record', destination: '/catalog', permanent: true }];
  },
};

export default nextConfig;
