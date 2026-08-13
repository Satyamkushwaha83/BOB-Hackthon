/**
 * Mock "cloud" user directory. In production this file disappears entirely:
 * - Credentials + session -> Firebase Auth (`signInWithEmailAndPassword`) or
 *   Supabase Auth (`supabase.auth.signInWithPassword`).
 * - The profile fields below (role, clinicName, specialization) -> a
 *   `users`/`profiles` row keyed by the auth provider's uid, read after
 *   sign-in to decide which dashboard/permissions to render.
 * Demo passwords are plaintext on purpose — this is an in-memory array, not a
 * credential store.
 */
import { User } from "./types";

export const USERS: User[] = [
  {
    id: "U1",
    name: "Asha Devi",
    role: "health_worker",
    email: "asha@clinic.demo",
    password: "asha123",
    phone: "+91 98765 43210",
    clinicName: "Rampur Village Health Centre",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
  },
  {
    id: "U2",
    name: "Manoj Pawar",
    role: "health_worker",
    email: "manoj@clinic.demo",
    password: "manoj123",
    phone: "+91 91234 56780",
    clinicName: "Sonapur Village Health Centre",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
  },
  {
    id: "U5",
    name: "Priya Kumari",
    role: "health_worker",
    email: "priya@clinic.demo",
    password: "priya123",
    phone: "+91 91234 99990",
    clinicName: "Nandgaon Village Health Centre",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
  },
  {
    id: "U3",
    name: "Dr. Anita Verma",
    role: "doctor",
    email: "anita@clinic.demo",
    password: "doctor123",
    phone: "+91 63872 24435",
    specialization: "General Physician",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 200,
  },
  {
    id: "U4",
    name: "Dr. Farhan Sheikh",
    role: "doctor",
    email: "farhan@clinic.demo",
    password: "doctor123",
    phone: "+91 93053 04825",
    specialization: "Internal Medicine",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 150,
  },
];

export function login(email: string, password: string, role: User["role"]): User | null {
  const user = USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.role === role);
  if (!user || user.password !== password) return null;
  return user;
}

export function doctors(): User[] {
  return USERS.filter((u) => u.role === "doctor");
}

export function healthWorkers(): User[] {
  return USERS.filter((u) => u.role === "health_worker");
}

export function findUser(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}
