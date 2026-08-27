import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // There is a pnpm-lock.yaml in the home directory above this project, so Next
  // infers /Users/<you> as the workspace root and traces the whole home tree.
  // Pin the root to this directory instead.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
