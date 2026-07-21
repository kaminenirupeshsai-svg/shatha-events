/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@app/shared'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  webpack: (config) => {
    // packages/shared ships raw TypeScript with NodeNext-style ".js" import
    // specifiers (e.g. "./schemas/common.schema.js" pointing at a .ts file) —
    // correct for tsc/Vitest's "Bundler" moduleResolution, but webpack needs
    // an explicit hint to also try .ts/.tsx when it sees a ".js" import that
    // doesn't exist on disk. This only affects module resolution in this
    // app's build, not packages/shared itself.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

module.exports = nextConfig;
