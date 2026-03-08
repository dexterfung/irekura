#!/usr/bin/env node
// Generates the RSA key pair needed for Convex JWT authentication.
// Run: node scripts/generate-auth-keys.js
// Then add the output values to .env.local and run:
//   npx convex env set CONVEX_AUTH_PUBLIC_KEY "<value>"

const { generateKeyPairSync } = require("crypto");

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const privB64 = Buffer.from(privateKey).toString("base64");
const pubB64 = Buffer.from(publicKey).toString("base64");

console.log("Add these to your .env.local:\n");
console.log(`CONVEX_AUTH_PRIVATE_KEY=${privB64}`);
console.log(`CONVEX_AUTH_PUBLIC_KEY=${pubB64}`);
console.log("\nAlso run:");
console.log(`npx convex env set CONVEX_AUTH_PUBLIC_KEY "${pubB64}"`);
