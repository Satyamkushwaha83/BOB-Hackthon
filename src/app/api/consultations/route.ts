import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getConsultations, insertConsultation } from "@/lib/db";
import { dbConsultationToConsultation, consultationToDbFields } from "@/lib/mappers";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = getConsultations();
  return NextResponse.json(rows.map(dbConsultationToConsultation));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await req.json();
  insertConsultation({
    id: c.id,
    patient_id: c.patientId,
    health_worker_id: c.healthWorkerId,
    doctor_id: c.doctorId ?? null,
    appointment_id: c.appointmentId ?? null,
    symptoms_structured: JSON.stringify(c.symptoms?.structured ?? []),
    symptoms_free_text: c.symptoms?.freeText ?? "",
    symptoms_duration: c.symptoms?.duration ?? "",
    symptoms_flags: JSON.stringify(c.symptoms?.flags ?? []),
    vitals_temp: c.vitals?.temp ?? "",
    vitals_bp: c.vitals?.bp ?? "",
    vitals_pulse: c.vitals?.pulse ?? "",
    vitals_spo2: c.vitals?.spo2 ?? "",
    vitals_weight: c.vitals?.weight ?? "",
    vitals_rr: c.vitals?.rr ?? "",
    uploads_prescription: c.uploads?.prescriptionText ?? "",
    uploads_photo: c.uploads?.photoUrl ?? "",
    triage_json: c.triage ? JSON.stringify(c.triage) : null,
    triage_override_json: c.triageOverride ? JSON.stringify(c.triageOverride) : null,
    ai_generated_at: c.aiGeneratedAt ?? null,
    first_aid_json: c.firstAid ? JSON.stringify(c.firstAid) : null,
    otc_decisions_json: JSON.stringify(c.otcDecisions ?? {}),
    doctor_review_json: JSON.stringify(c.doctorReview ?? { notes: "", status: "pending", reviewer: "" }),
    status: c.status ?? "waiting-worker",
    stage: c.stage ?? "intake",
    created_at: c.createdAt ?? Date.now(),
  });
  return NextResponse.json({ ok: true });
}
