/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'dist',  // This is okay to keep
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};
module.exports = nextConfig;