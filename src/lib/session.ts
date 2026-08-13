/**
 * JWT session helpers — server-side only.
 * Signs/verifies a compact JWT stored in an HttpOnly cookie named "ss_token".
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sehat-sarthi-dev-secret-change-in-production"
);
const COOKIE = "ss_token";
const TTL = 60 * 60 * 24 * 7; // 7 days

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL}s`)
    .sign(SECRET);
}

export async function getSession(): Promise<{ userId: string } | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.sub) return null;
    return { userId: payload.sub as string };
  } catch {
    return null;
  }
}

export function sessionCookieHeader(token: string): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL}`;
}

export function clearCookieHeader(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
