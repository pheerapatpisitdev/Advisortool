/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // sharp is installed, so let next/image resize + serve WebP/AVIF instead of
  // shipping the raw multi-MB PNGs. (Was unoptimized:true, which disabled all that.)
  images: {
    formats: ["image/avif", "image/webp"],
  },
};
module.exports = nextConfig;
