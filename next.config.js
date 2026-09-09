const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep AgentRank tracing rooted here so the nested edgeslate/ app
  // (separate Next.js project) does not confuse Vercel / file tracing.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // @react-pdf/renderer ships a `browser` field remapping its entry point;
  // Next's default webpack bundling resolves that browser build even for
  // server code, which breaks its reconciler at runtime ("Objects are not
  // valid as a React child"). Marking it external makes Next `require()` it
  // natively via Node, which ignores the `browser` field and picks `main`.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Nested EdgeSlate frontend must not be treated as part of this app.
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**", "**/edgeslate/**"],
    };
    return config;
  },
};

module.exports = nextConfig;
