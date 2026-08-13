import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAppointments, insertAppointment } from "@/lib/db";
import { dbAppointmentToAppointment } from "@/lib/mappers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = getAppointments();
  return NextResponse.json(rows.map(dbAppointmentToAppointment));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const a = await req.json();
  insertAppointment({
    id: a.id,
    patient_id: a.patientId,
    health_worker_id: a.healthWorkerId,
    doctor_id: a.doctorId,
    date: a.date,
    time: a.time,
    urgency: a.urgency ?? "routine",
    status: a.status ?? "requested",
    notes: a.notes ?? "",
    created_at: a.createdAt ?? Date.now(),
  });
  return NextResponse.json({ ok: true });
}
