const authConfig = {
  providers: [
    {
      domain:
        process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
