import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/db";
import { dbUserToUser } from "@/lib/mappers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  const dbUser = getUserById(session.userId);
  if (!dbUser) return NextResponse.json({ user: null });
  return NextResponse.json({ user: dbUserToUser(dbUser) });
}
