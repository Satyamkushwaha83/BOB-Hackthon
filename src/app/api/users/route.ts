import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAllUsers } from "@/lib/db";
import { dbUserToUser } from "@/lib/mappers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = getAllUsers().map(dbUserToUser);
  return NextResponse.json(users);
}
