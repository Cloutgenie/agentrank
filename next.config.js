/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // @react-pdf/renderer ships a `browser` field remapping its entry point;
  // Next's default webpack bundling resolves that browser build even for
  // server code, which breaks its reconciler at runtime ("Objects are not
  // valid as a React child"). Marking it external makes Next `require()` it
  // natively via Node, which ignores the `browser` field and picks `main`.
  serverExternalPackages: ["@react-pdf/renderer"],
};

module.exports = nextConfig;
