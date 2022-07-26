/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: { images: { allowFutureImage: true } },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/receipts',
        permanent: false
      },
    ];
  }
}

module.exports = nextConfig
