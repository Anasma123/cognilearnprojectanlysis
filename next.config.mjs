import fs from 'fs';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push({
        apply(compiler) {
          compiler.hooks.afterEmit.tap('FixChunkPathsPlugin', () => {
            try {
              const serverDir = path.resolve(process.cwd(), '.next/server');
              const chunksDir = path.resolve(serverDir, 'chunks');
              if (fs.existsSync(chunksDir)) {
                const files = fs.readdirSync(chunksDir);
                for (const file of files) {
                  if (file.endsWith('.js')) {
                    const src = path.join(chunksDir, file);
                    const dest = path.join(serverDir, file);
                    try {
                      fs.copyFileSync(src, dest);
                    } catch {}
                  }
                }
              }
            } catch (err) {
              // ignore
            }
          });
        },
      });
    }
    return config;
  },
};

export default nextConfig;
