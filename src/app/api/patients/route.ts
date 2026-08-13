import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPatients, insertPatient } from "@/lib/db";
import { dbPatientToPatient } from "@/lib/mappers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = getPatients();
  return NextResponse.json(rows.map(dbPatientToPatient));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const row = {
    id: body.id,
    name: body.name,
    age: body.age,
    gender: body.gender,
    language: body.language,
    phone: body.phone ?? "",
    village: body.village ?? "",
    allergies: body.history?.allergies ?? "",
    conditions: body.history?.conditions ?? "",
    medications: body.history?.medications ?? "",
    created_by: session.userId,
  };
  // insertPatient adds created_at internally
  insertPatient(row);
  return NextResponse.json({ ok: true });
}
