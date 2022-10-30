/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["ipfs.infura.io", "infura-ipfs.io"],
  },
};

module.exports = nextConfig;
