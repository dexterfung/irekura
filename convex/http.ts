import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: httpAction(async () => {
    const siteUrl = process.env.CONVEX_SITE_URL!;
    return new Response(
      JSON.stringify({
        issuer: siteUrl,
        jwks_uri: `${siteUrl}/.well-known/jwks.json`,
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }),
});

http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async () => {
    const publicKeyB64 = process.env.CONVEX_AUTH_PUBLIC_KEY!;
    // Decode base64 PEM
    const pem = atob(publicKeyB64);

    // Parse the PEM to extract the DER-encoded key bytes
    const pemBody = pem
      .replace(/-----BEGIN PUBLIC KEY-----/, "")
      .replace(/-----END PUBLIC KEY-----/, "")
      .replace(/\s/g, "");
    const derBytes = atob(pemBody);

    // Build the JWK via SubtleCrypto (available in Convex's V8 runtime)
    const keyData = new Uint8Array(derBytes.length);
    for (let i = 0; i < derBytes.length; i++) {
      keyData[i] = derBytes.charCodeAt(i);
    }

    const key = await crypto.subtle.importKey(
      "spki",
      keyData,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      true,
      ["verify"]
    );
    const jwk = await crypto.subtle.exportKey("jwk", key);

    return new Response(
      JSON.stringify({
        keys: [{ ...jwk, use: "sig", alg: "RS256", kid: "convex-auth-key" }],
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }),
});

export default http;
