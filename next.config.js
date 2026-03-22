/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  transpilePackages: ['d3-force', 'd3-selection', 'd3-dispatch', 'd3-quadtree', 'd3-timer'],
};

module.exports = nextConfig;
