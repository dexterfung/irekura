const authConfig = {
  providers: [
    {
      domain:
        process.env.CONVEX_SITE_URL ??
        "https://strong-zebra-965.eu-west-1.convex.site",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
