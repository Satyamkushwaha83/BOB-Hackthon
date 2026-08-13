/**
 * Thin fetch wrappers for all backend API routes.
 * Used by client components — never import db.ts from here.
 */
import type { Appointment, AppointmentStatus, Consultation, Patient, User } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<User> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await json<{ user: User }>(res);
  return data.user;
}

export async function apiMe(): Promise<User | null> {
  const res = await fetch("/api/auth/me");
  const data = await json<{ user: User | null }>(res);
  return data.user;
}

export async function apiLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

// ── Patients ──────────────────────────────────────────────────────────────────

export async function apiGetPatients(): Promise<Patient[]> {
  return json<Patient[]>(await fetch("/api/patients"));
}

export async function apiCreatePatient(p: Patient): Promise<void> {
  await json(await fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  }));
}

// ── Consultations ─────────────────────────────────────────────────────────────

export async function apiGetConsultations(): Promise<Consultation[]> {
  return json<Consultation[]>(await fetch("/api/consultations"));
}

export async function apiCreateConsultation(c: Consultation): Promise<void> {
  await json(await fetch("/api/consultations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c),
  }));
}

export async function apiPatchConsultation(id: string, patch: Partial<Consultation>): Promise<void> {
  await json(await fetch(`/api/consultations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }));
}

// ── Appointments ──────────────────────────────────────────────────────────────

export async function apiGetAppointments(): Promise<Appointment[]> {
  return json<Appointment[]>(await fetch("/api/appointments"));
}

export async function apiCreateAppointment(a: Appointment): Promise<void> {
  await json(await fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(a),
  }));
}

export async function apiPatchAppointment(id: string, status: AppointmentStatus): Promise<void> {
  await json(await fetch(`/api/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  return json<User[]>(await fetch("/api/users"));
}
