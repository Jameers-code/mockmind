/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for pdf-parse to work in Next.js API routes (it uses fs internals)
  serverExternalPackages: ["pdf-parse"],

  // Suppress eval() warning from pdf-parse in development
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pdf-parse uses dynamic require — mark as external to avoid bundling issues
      config.externals = [...(config.externals || []), "pdf-parse"];
    }
    return config;
  },
};

export default nextConfig;
