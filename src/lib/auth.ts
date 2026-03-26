import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development-only";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  userId: number;
  email: string;
  role: string;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}
