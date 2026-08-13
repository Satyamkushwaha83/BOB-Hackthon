import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { patchConsultation } from "@/lib/db";
import { consultationToDbFields } from "@/lib/mappers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const fields = consultationToDbFields(body);
  if (Object.keys(fields).length === 0) return NextResponse.json({ ok: true });
  patchConsultation(id, fields as never);
  return NextResponse.json({ ok: true });
}
