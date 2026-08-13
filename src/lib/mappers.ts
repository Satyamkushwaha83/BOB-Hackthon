/**
 * Converts snake_case DB rows → camelCase app types used throughout the UI.
 */
import type { DbUser, DbPatient, DbConsultation, DbAppointment } from "./db";
import type { User, Patient, Consultation, Appointment } from "./types";

export function dbUserToUser(u: DbUser): User {
  return {
    id: u.id,
    name: u.name,
    role: u.role as User["role"],
    email: u.email,
    password: "", // never expose hash to client
    phone: u.phone ?? undefined,
    clinicName: u.clinic_name ?? undefined,
    specialization: u.specialization ?? undefined,
    createdAt: u.created_at,
  };
}

export function dbPatientToPatient(p: DbPatient): Patient {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender as Patient["gender"],
    language: p.language,
    phone: p.phone,
    village: p.village,
    history: { allergies: p.allergies, conditions: p.conditions, medications: p.medications },
    createdAt: p.created_at,
    createdBy: p.created_by,
  };
}

export function dbConsultationToConsultation(c: DbConsultation): Consultation {
  return {
    id: c.id,
    patientId: c.patient_id,
    healthWorkerId: c.health_worker_id,
    doctorId: c.doctor_id,
    appointmentId: c.appointment_id,
    symptoms: {
      structured: safeJson(c.symptoms_structured, []),
      freeText: c.symptoms_free_text,
      duration: c.symptoms_duration,
      flags: safeJson(c.symptoms_flags, []),
    },
    vitals: {
      temp: c.vitals_temp, bp: c.vitals_bp, pulse: c.vitals_pulse,
      spo2: c.vitals_spo2, weight: c.vitals_weight, rr: c.vitals_rr,
    },
    uploads: { prescriptionText: c.uploads_prescription, photoUrl: c.uploads_photo },
    triage: safeJson(c.triage_json, null),
    triageOverride: safeJson(c.triage_override_json, null),
    aiGeneratedAt: c.ai_generated_at,
    firstAid: safeJson(c.first_aid_json, null),
    otcDecisions: safeJson(c.otc_decisions_json, {}),
    doctorReview: safeJson(c.doctor_review_json, { notes: "", status: "pending", reviewer: "" }),
    status: c.status as Consultation["status"],
    stage: c.stage as Consultation["stage"],
    createdAt: c.created_at,
  };
}

export function dbAppointmentToAppointment(a: DbAppointment): Appointment {
  return {
    id: a.id,
    patientId: a.patient_id,
    healthWorkerId: a.health_worker_id,
    doctorId: a.doctor_id,
    date: a.date,
    time: a.time,
    urgency: a.urgency as Appointment["urgency"],
    status: a.status as Appointment["status"],
    notes: a.notes,
    createdAt: a.created_at,
  };
}

function safeJson<T>(val: string | null | undefined, fallback: T): T {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

/** Convert a Consultation object back to DB column values for PATCH */
export function consultationToDbFields(c: Partial<Consultation>): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  if (c.symptoms !== undefined) {
    f.symptoms_structured = JSON.stringify(c.symptoms.structured);
    f.symptoms_free_text  = c.symptoms.freeText;
    f.symptoms_duration   = c.symptoms.duration;
    f.symptoms_flags      = JSON.stringify(c.symptoms.flags);
  }
  if (c.vitals !== undefined) {
    f.vitals_temp   = c.vitals.temp;
    f.vitals_bp     = c.vitals.bp;
    f.vitals_pulse  = c.vitals.pulse;
    f.vitals_spo2   = c.vitals.spo2;
    f.vitals_weight = c.vitals.weight ?? "";
    f.vitals_rr     = c.vitals.rr ?? "";
  }
  if (c.uploads !== undefined) {
    f.uploads_prescription = c.uploads.prescriptionText;
    f.uploads_photo        = c.uploads.photoUrl;
  }
  if (c.triage         !== undefined) f.triage_json          = JSON.stringify(c.triage);
  if (c.triageOverride !== undefined) f.triage_override_json = JSON.stringify(c.triageOverride);
  if (c.aiGeneratedAt  !== undefined) f.ai_generated_at      = c.aiGeneratedAt;
  if (c.firstAid       !== undefined) f.first_aid_json       = JSON.stringify(c.firstAid);
  if (c.otcDecisions   !== undefined) f.otc_decisions_json   = JSON.stringify(c.otcDecisions);
  if (c.doctorReview   !== undefined) f.doctor_review_json   = JSON.stringify(c.doctorReview);
  if (c.status         !== undefined) f.status               = c.status;
  if (c.stage          !== undefined) f.stage                = c.stage;
  if (c.doctorId       !== undefined) f.doctor_id            = c.doctorId;
  if (c.appointmentId  !== undefined) f.appointment_id       = c.appointmentId;
  return f;
}
