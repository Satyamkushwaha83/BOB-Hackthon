/**
 * ============================================================================
 * DATA MODEL — PRODUCTION BACKEND MAPPING
 * ============================================================================
 * This prototype keeps every "table" as an in-memory array (see auth.ts /
 * seed.ts) so it runs entirely client-side with no server. The shapes below
 * are deliberately written the way they'd sit in a real cloud backend, so
 * porting is a rename-and-wire exercise, not a redesign:
 *
 *   User          -> Firebase: `users` collection, doc id = Firebase Auth uid.
 *                     Supabase: `profiles` table, PK = auth.users.id (FK).
 *                     Passwords are NEVER stored here in production — real
 *                     auth (Firebase Auth / Supabase Auth / Clerk) owns the
 *                     credential, this row only carries role + profile data.
 *   Patient       -> `patients` collection/table. One row per real person,
 *                     persists across visits. PK `id`, FK `createdBy -> User`.
 *   Consultation  -> `consultations` collection/table. One row per clinic
 *                     visit/encounter. FK `patientId -> Patient`,
 *                     `healthWorkerId` / `doctorId -> User`. This is the
 *                     mutable clinical workflow record (symptoms, vitals,
 *                     AI output, triage, doctor sign-off).
 *   Appointment   -> `appointments` collection/table. FK `patientId`,
 *                     `healthWorkerId`, `doctorId`. Independent of
 *                     Consultation — a scheduled future slot, not a live
 *                     encounter.
 *
 * In Firestore each of these would be a top-level collection with the FK
 * fields as plain string references; in Supabase/Postgres they'd be tables
 * with real foreign keys and row-level security scoped by `auth.uid()`
 * matching `healthWorkerId` / `doctorId` / `createdBy`.
 * ============================================================================
 */

export type Role = "health_worker" | "doctor";

/** Gender options used across the app */
export type Gender = "Male" | "Female" | "Other";

export interface User {
  id: string;
  name: string;
  role: Role;
  /** Login identifier in this demo. Maps to Firebase Auth / Supabase Auth email. */
  email: string;
  /** DEMO ONLY — plaintext for in-memory simulation. A real backend never stores this here; the identity provider owns it. */
  password: string;
  phone?: string;
  /** Health worker only — clinic they operate from. */
  clinicName?: string;
  /** Doctor only. */
  specialization?: string;
  createdAt: number;
}

export type TriageLevel = "urgent" | "amber" | "routine";

export interface Vitals {
  temp: string;
  bp: string;
  pulse: string;
  spo2: string;
  /** Weight in kg — optional, helps dose calculations */
  weight?: string;
  /** Respiratory rate per minute */
  rr?: string;
}

export interface Symptoms {
  structured: string[];
  freeText: string;
  duration: string;
  flags: string[];
}

export interface History {
  allergies: string;
  conditions: string;
  medications: string;
}

export interface Uploads {
  prescriptionText: string;
  photoUrl: string;
}

export interface Triage {
  level: TriageLevel;
  reasons: string[];
}

export interface TriageOverride {
  level: TriageLevel;
  reason: string;
  by: string;
  at: number;
}

export interface OTCItem {
  name: string;
  adultDose: string;
  childDose: string;
  category: string;
  minAge: number;
}

export interface FirstAid {
  steps: string[];
  otc: OTCItem[];
}

export type OTCDecision = "approved" | "rejected";

export type DoctorReviewStatus = "pending" | "approved" | "rejected";

export interface DoctorReview {
  notes: string;
  status: DoctorReviewStatus;
  reviewer: string;
}

export type Stage = "intake" | "analyzing" | "triage" | "firstaid" | "doctor" | "record";

export type PatientStatus = "waiting-worker" | "waiting-doctor" | "done";

/** Persists across visits — demographic + history identity record. */
export interface Patient {
  id: string;
  name: string;
  age: string;
  gender: Gender;
  language: string;
  phone: string;
  history: History;
  createdAt: number;
  createdBy: string;
  /** Optional village/address for rural context */
  village?: string;
}

/** One clinic visit / encounter for a Patient. This is the clinical workflow record. */
export interface Consultation {
  id: string;
  patientId: string;
  healthWorkerId: string;
  doctorId: string | null;
  appointmentId: string | null;
  symptoms: Symptoms;
  vitals: Vitals;
  uploads: Uploads;
  triage: Triage | null;
  triageOverride: TriageOverride | null;
  aiGeneratedAt: number | null;
  firstAid: FirstAid | null;
  otcDecisions: Record<string, OTCDecision>;
  doctorReview: DoctorReview;
  status: PatientStatus;
  stage: Stage;
  createdAt: number;
}

export type AppointmentUrgency = "routine" | "priority" | "urgent";
export type AppointmentStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patientId: string;
  healthWorkerId: string;
  doctorId: string;
  date: string;
  time: string;
  urgency: AppointmentUrgency;
  status: AppointmentStatus;
  notes: string;
  createdAt: number;
}

export type UILang = "en" | "hi" | "mr";
export type VitalStatus = "normal" | "mid" | "high" | "low";

/** Generic paginated result shape — ready for API integration */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

/** Audit log entry — every state change that matters clinically */
export interface AuditEntry {
  id: string;
  entityType: "consultation" | "patient" | "appointment";
  entityId: string;
  action: string;
  by: string;
  at: number;
  note?: string;
}
