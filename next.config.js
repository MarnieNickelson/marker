/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    PORT: 3030,
  },
  server: {
    port: 3030,
  },
};

module.exports = nextConfig;
