/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable font optimization to avoid lightningcss native binary issues on Vercel
  optimizeFonts: false,
  
  // Use SWC for better performance and compatibility
  swcMinify: true,
  
  // Transpile dependencies if needed
  transpilePackages: ['@selfxyz/core', '@selfxyz/qrcode'],
  
  // Configure webpack for better ESM handling
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
