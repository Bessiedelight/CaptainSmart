import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "citinewsroom.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.citinewsroom.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.wordpress.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.gravatar.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.wp.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
    // Add more lenient settings for development
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    // Add formats for better compatibility
    formats: ["image/webp", "image/avif"],
    // Increase timeout for slow loading images
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
