import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  experimental: {},
};

export default withSerwist(withNextIntl(nextConfig));
