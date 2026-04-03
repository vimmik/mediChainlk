import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@medichainlk/ui', '@medichainlk/shared-types'],
};

export default nextConfig;
