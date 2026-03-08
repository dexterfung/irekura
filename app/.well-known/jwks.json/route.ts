import { exportJWK, importSPKI } from "jose";
import { NextResponse } from "next/server";

export async function GET() {
  const publicKeyPem = Buffer.from(
    process.env.CONVEX_AUTH_PUBLIC_KEY!,
    "base64"
  ).toString("utf-8");

  const publicKey = await importSPKI(publicKeyPem, "RS256");
  const jwk = await exportJWK(publicKey);

  return NextResponse.json({
    keys: [{ ...jwk, use: "sig", alg: "RS256", kid: "convex-auth-key" }],
  });
}
