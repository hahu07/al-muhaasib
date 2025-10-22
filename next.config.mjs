import { withJuno } from "@junobuild/nextjs-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for static export (CSR only) - required for Juno platform
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  // Disable server-side features not supported by Juno
  experimental: {
    esmExternals: "loose",
  },
};

export default withJuno(nextConfig);
