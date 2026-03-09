import { auth } from "@/lib/auth";
import { SignJWT, importPKCS8 } from "jose";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const privateKeyPem = Buffer.from(
    process.env.CONVEX_AUTH_PRIVATE_KEY!,
    "base64"
  ).toString("utf-8");

  const privateKey = await importPKCS8(privateKeyPem, "RS256");

  const token = await new SignJWT({
    sub: session.user.id,
    name: session.user.name ?? undefined,
    email: session.user.email ?? undefined,
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .setAudience("convex")
    .setIssuer(
      process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
        process.env.CONVEX_SITE_URL ??
        "https://strong-zebra-965.eu-west-1.convex.site"
    )
    .sign(privateKey);

  return NextResponse.json({ token });
}
