import { NextResponse } from "next/server";

export async function GET() {
  const issuer = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return NextResponse.json({
    issuer,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
  });
}
