/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable font optimization to avoid lightningcss issues on Vercel
  optimizeFonts: false,
  
  // Transpile packages if needed
  transpilePackages: ['@selfxyz/core', '@selfxyz/qrcode'],
  
  // Configure webpack for Node.js modules
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
