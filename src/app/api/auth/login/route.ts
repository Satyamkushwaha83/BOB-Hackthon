import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db";
import { dbUserToUser } from "@/lib/mappers";
import { signSession, sessionCookieHeader } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const dbUser = getUserByEmail(email);
  if (!dbUser || !bcrypt.compareSync(password, dbUser.password_hash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = await signSession(dbUser.id);
  const user = dbUserToUser(dbUser);
  const res = NextResponse.json({ user });
  res.headers.set("Set-Cookie", sessionCookieHeader(token));
  return res;
}
