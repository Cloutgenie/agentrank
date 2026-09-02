/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async redirects() {
    return [
      {
        source: "/vs/agentrank-vs-profound",
        destination: "/vs/profound-vs-agentrank",
        permanent: true,
      },
      {
        source: "/agentrank-vs-profound",
        destination: "/vs/profound-vs-agentrank",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
