/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ['i.pravatar.cc']
  }
}

module.exports = nextConfig
