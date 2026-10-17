import type { NextConfig } from "next";

const config: NextConfig = {
  // Workspace packages ship TypeScript source; let Next compile them.
  transpilePackages: ["@storyling/core", "@storyling/content", "@storyling/learner", "@storyling/ui-tokens"],
};

export default config;
