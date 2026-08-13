import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { patchAppointment } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  // Map camelCase to snake_case for the fields allowed to change
  const fields: Record<string, unknown> = {};
  if (body.status   !== undefined) fields.status    = body.status;
  if (body.urgency  !== undefined) fields.urgency   = body.urgency;
  if (body.doctorId !== undefined) fields.doctor_id = body.doctorId;
  if (Object.keys(fields).length === 0) return NextResponse.json({ ok: true });
  patchAppointment(id, fields as never);
  return NextResponse.json({ ok: true });
}
