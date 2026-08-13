/**
 * SQLite database layer using better-sqlite3.
 * Runs server-side only (Next.js API routes / Server Components).
 * On first boot: creates tables and seeds demo users + sample data.
 */
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), ".data");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, "sehat.db"));

// Enable WAL for concurrent reads
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL CHECK(role IN ('health_worker','doctor')),
    email       TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone       TEXT,
    clinic_name TEXT,
    specialization TEXT,
    created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS patients (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    age         TEXT NOT NULL,
    gender      TEXT NOT NULL,
    language    TEXT NOT NULL,
    phone       TEXT,
    village     TEXT,
    allergies   TEXT DEFAULT '',
    conditions  TEXT DEFAULT '',
    medications TEXT DEFAULT '',
    created_at  INTEGER NOT NULL,
    created_by  TEXT NOT NULL REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS consultations (
    id                TEXT PRIMARY KEY,
    patient_id        TEXT NOT NULL REFERENCES patients(id),
    health_worker_id  TEXT NOT NULL REFERENCES users(id),
    doctor_id         TEXT REFERENCES users(id),
    appointment_id    TEXT,
    symptoms_structured TEXT DEFAULT '[]',
    symptoms_free_text  TEXT DEFAULT '',
    symptoms_duration   TEXT DEFAULT '',
    symptoms_flags      TEXT DEFAULT '[]',
    vitals_temp   TEXT DEFAULT '',
    vitals_bp     TEXT DEFAULT '',
    vitals_pulse  TEXT DEFAULT '',
    vitals_spo2   TEXT DEFAULT '',
    vitals_weight TEXT DEFAULT '',
    vitals_rr     TEXT DEFAULT '',
    uploads_prescription TEXT DEFAULT '',
    uploads_photo        TEXT DEFAULT '',
    triage_json          TEXT,
    triage_override_json TEXT,
    ai_generated_at      INTEGER,
    first_aid_json       TEXT,
    otc_decisions_json   TEXT DEFAULT '{}',
    doctor_review_json   TEXT DEFAULT '{"notes":"","status":"pending","reviewer":""}',
    status         TEXT NOT NULL DEFAULT 'waiting-worker',
    stage          TEXT NOT NULL DEFAULT 'intake',
    created_at     INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id               TEXT PRIMARY KEY,
    patient_id       TEXT NOT NULL REFERENCES patients(id),
    health_worker_id TEXT NOT NULL REFERENCES users(id),
    doctor_id        TEXT NOT NULL REFERENCES users(id),
    date             TEXT NOT NULL,
    time             TEXT NOT NULL,
    urgency          TEXT NOT NULL DEFAULT 'routine',
    status           TEXT NOT NULL DEFAULT 'requested',
    notes            TEXT DEFAULT '',
    created_at       INTEGER NOT NULL
  );
`);

// ── Seed demo data (runs once) ────────────────────────────────────────────────

function seedIfEmpty() {
  const count = (db.prepare("SELECT COUNT(*) as n FROM users").get() as { n: number }).n;
  if (count > 0) return;

  const now = Date.now();
  const day = 86400000;

  const insertUser = db.prepare(`
    INSERT INTO users (id,name,role,email,password_hash,phone,clinic_name,specialization,created_at)
    VALUES (@id,@name,@role,@email,@password_hash,@phone,@clinic_name,@specialization,@created_at)
  `);

  const users = [
    { id: "U1", name: "Asha Devi",       role: "health_worker", email: "asha@clinic.demo",   pw: "asha123",   phone: "+91 98765 43210", clinic: "Rampur Village Health Centre", spec: null,                created_at: now - 90 * day },
    { id: "U2", name: "Manoj Pawar",     role: "health_worker", email: "manoj@clinic.demo",  pw: "manoj123",  phone: "+91 91234 56780", clinic: "Sonapur Village Health Centre", spec: null,                created_at: now - 60 * day },
    { id: "U5", name: "Priya Kumari",    role: "health_worker", email: "priya@clinic.demo",  pw: "priya123",  phone: "+91 91234 99990", clinic: "Nandgaon Village Health Centre", spec: null,               created_at: now - 45 * day },
    { id: "U3", name: "Dr. Anita Verma", role: "doctor",        email: "anita@clinic.demo",  pw: "doctor123", phone: "+91 63872 24435", clinic: null, spec: "General Physician",    created_at: now - 200 * day },
    { id: "U4", name: "Dr. Farhan Sheikh",role:"doctor",        email: "farhan@clinic.demo", pw: "doctor123", phone: "+91 93053 04825", clinic: null, spec: "Internal Medicine",    created_at: now - 150 * day },
  ];

  for (const u of users) {
    insertUser.run({
      id: u.id, name: u.name, role: u.role, email: u.email,
      password_hash: bcrypt.hashSync(u.pw, 10),
      phone: u.phone, clinic_name: u.clinic, specialization: u.spec, created_at: u.created_at,
    });
  }

  const insertPatient = db.prepare(`
    INSERT INTO patients (id,name,age,gender,language,phone,village,allergies,conditions,medications,created_at,created_by)
    VALUES (@id,@name,@age,@gender,@language,@phone,@village,@allergies,@conditions,@medications,@created_at,@created_by)
  `);

  const patients = [
    { id: "PT1001", name: "Ramesh Kumar",  age: "45", gender: "Male",   language: "Hindi",   phone: "+91 90123 45678", village: "Rampur",   allergies: "None known",  conditions: "None",                          medications: "None",                created_at: now - 10*day, created_by: "U1" },
    { id: "PT1002", name: "Sita Devi",     age: "68", gender: "Female", language: "Hindi",   phone: "+91 90123 00000", village: "Rampur",   allergies: "Sulfa drugs", conditions: "Hypertension (on medication)",  medications: "Amlodipine 5mg OD",   created_at: now - 30*day, created_by: "U1" },
    { id: "PT1003", name: "Vikram Singh",  age: "34", gender: "Male",   language: "English", phone: "+91 90123 11111", village: "Sonapur",  allergies: "None known",  conditions: "None",                          medications: "None",                created_at: now - 3*day,  created_by: "U2" },
    { id: "PT1004", name: "Laxmi Bai",     age: "28", gender: "Female", language: "Marathi", phone: "+91 90123 22222", village: "Nandgaon", allergies: "None",        conditions: "Anaemia (on iron supplements)", medications: "Ferrous sulphate 200mg OD", created_at: now - 7*day, created_by: "U2" },
    { id: "PT1005", name: "Arjun Yadav",   age: "12", gender: "Male",   language: "Hindi",   phone: "+91 90123 33333", village: "Rampur",   allergies: "None known",  conditions: "None",                          medications: "None",                created_at: now - 2*day,  created_by: "U1" },
  ];
  for (const p of patients) insertPatient.run(p);

  const insertConsultation = db.prepare(`
    INSERT INTO consultations
      (id,patient_id,health_worker_id,doctor_id,symptoms_structured,symptoms_free_text,symptoms_duration,vitals_temp,vitals_bp,vitals_pulse,vitals_spo2,triage_json,ai_generated_at,first_aid_json,doctor_review_json,status,stage,created_at)
    VALUES
      (@id,@patient_id,@health_worker_id,@doctor_id,@symptoms_structured,@symptoms_free_text,@symptoms_duration,@vitals_temp,@vitals_bp,@vitals_pulse,@vitals_spo2,@triage_json,@ai_generated_at,@first_aid_json,@doctor_review_json,@status,@stage,@created_at)
  `);

  insertConsultation.run({ id:"C1001", patient_id:"PT1001", health_worker_id:"U1", doctor_id:"U3", symptoms_structured: JSON.stringify(["Fever","Headache"]), symptoms_free_text:"Fever since 2 days, mild body ache.", symptoms_duration:"2 days", vitals_temp:"100.8", vitals_bp:"128/82", vitals_pulse:"88", vitals_spo2:"97", triage_json: JSON.stringify({level:"routine",reasons:["Low-grade fever"]}), ai_generated_at: now - 55*60000 + 20000, first_aid_json: JSON.stringify({steps:[],otc:[]}), doctor_review_json: JSON.stringify({notes:"Advised rest, ORS and paracetamol for 2 more days.",status:"approved",reviewer:"Dr. Anita Verma"}), status:"done", stage:"record", created_at: now - 55*60000 });
  insertConsultation.run({ id:"C1002", patient_id:"PT1002", health_worker_id:"U1", doctor_id:"U3", symptoms_structured: JSON.stringify(["Weakness / Fatigue","Headache"]), symptoms_free_text:"Feeling dizzy since morning, occasional blurred vision.", symptoms_duration:"6 hours", vitals_temp:"99.1", vitals_bp:"172/104", vitals_pulse:"96", vitals_spo2:"95", triage_json: JSON.stringify({level:"urgent",reasons:["Hypertensive crisis BP 172/104","Neurological symptoms"]}), ai_generated_at: now - 12*60000 + 20000, first_aid_json: JSON.stringify({steps:[],otc:[]}), doctor_review_json: JSON.stringify({notes:"",status:"pending",reviewer:""}), status:"waiting-doctor", stage:"doctor", created_at: now - 12*60000 });
  insertConsultation.run({ id:"C1003", patient_id:"PT1003", health_worker_id:"U2", doctor_id:null,  symptoms_structured: JSON.stringify(["Minor Cut / Wound"]), symptoms_free_text:"Cut on forearm from farm tool, cleaned at home.", symptoms_duration:"1 hour", vitals_temp:"98.6", vitals_bp:"118/76", vitals_pulse:"74", vitals_spo2:"99", triage_json: JSON.stringify({level:"routine",reasons:["Minor wound"]}), ai_generated_at: now - 5*60000 + 20000, first_aid_json: JSON.stringify({steps:[],otc:[]}), doctor_review_json: JSON.stringify({notes:"",status:"pending",reviewer:""}), status:"waiting-worker", stage:"firstaid", created_at: now - 5*60000 });

  const insertAppt = db.prepare(`
    INSERT INTO appointments (id,patient_id,health_worker_id,doctor_id,date,time,urgency,status,notes,created_at)
    VALUES (@id,@patient_id,@health_worker_id,@doctor_id,@date,@time,@urgency,@status,@notes,@created_at)
  `);
  const d1 = new Date(now + day).toISOString().slice(0,10);
  const d2 = new Date(now + 2*day).toISOString().slice(0,10);
  const d3 = new Date(now + 3*day).toISOString().slice(0,10);
  insertAppt.run({ id:"A1001", patient_id:"PT1002", health_worker_id:"U1", doctor_id:"U3", date:d1, time:"11:00", urgency:"priority", status:"confirmed", notes:"Follow-up on BP after remote consult.", created_at: now - 3*60*60000 });
  insertAppt.run({ id:"A1002", patient_id:"PT1001", health_worker_id:"U2", doctor_id:"U4", date:d2, time:"16:30", urgency:"routine",  status:"requested", notes:"General check-up requested by family.",  created_at: now - 30*60000 });
  insertAppt.run({ id:"A1003", patient_id:"PT1004", health_worker_id:"U2", doctor_id:"U3", date:d3, time:"10:00", urgency:"routine",  status:"requested", notes:"Routine anaemia follow-up.",             created_at: now - 10*60000 });
}

seedIfEmpty();

// ── Query helpers ─────────────────────────────────────────────────────────────

export function getUserByEmail(email: string) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase()) as DbUser | undefined;
}
export function getUserById(id: string) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser | undefined;
}
export function getAllUsers() {
  return db.prepare("SELECT * FROM users").all() as DbUser[];
}
export function getPatients(createdBy?: string) {
  if (createdBy) return db.prepare("SELECT * FROM patients WHERE created_by = ?").all(createdBy) as DbPatient[];
  return db.prepare("SELECT * FROM patients").all() as DbPatient[];
}
export function insertPatient(p: Omit<DbPatient, "created_at">) {
  db.prepare(`INSERT INTO patients (id,name,age,gender,language,phone,village,allergies,conditions,medications,created_at,created_by)
    VALUES (@id,@name,@age,@gender,@language,@phone,@village,@allergies,@conditions,@medications,@created_at,@created_by)`)
    .run({ ...p, created_at: Date.now() });
}
export function getConsultations(healthWorkerId?: string) {
  if (healthWorkerId) return db.prepare("SELECT * FROM consultations WHERE health_worker_id = ?").all(healthWorkerId) as DbConsultation[];
  return db.prepare("SELECT * FROM consultations").all() as DbConsultation[];
}
export function insertConsultation(c: DbConsultation) {
  db.prepare(`INSERT INTO consultations
    (id,patient_id,health_worker_id,doctor_id,appointment_id,symptoms_structured,symptoms_free_text,symptoms_duration,symptoms_flags,vitals_temp,vitals_bp,vitals_pulse,vitals_spo2,vitals_weight,vitals_rr,uploads_prescription,uploads_photo,triage_json,triage_override_json,ai_generated_at,first_aid_json,otc_decisions_json,doctor_review_json,status,stage,created_at)
    VALUES (@id,@patient_id,@health_worker_id,@doctor_id,@appointment_id,@symptoms_structured,@symptoms_free_text,@symptoms_duration,@symptoms_flags,@vitals_temp,@vitals_bp,@vitals_pulse,@vitals_spo2,@vitals_weight,@vitals_rr,@uploads_prescription,@uploads_photo,@triage_json,@triage_override_json,@ai_generated_at,@first_aid_json,@otc_decisions_json,@doctor_review_json,@status,@stage,@created_at)`)
    .run(c);
}
export function patchConsultation(id: string, fields: Partial<DbConsultation>) {
  const sets = Object.keys(fields).map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE consultations SET ${sets} WHERE id = @id`).run({ ...fields, id });
}
export function getAppointments(doctorId?: string, healthWorkerId?: string) {
  if (doctorId) return db.prepare("SELECT * FROM appointments WHERE doctor_id = ?").all(doctorId) as DbAppointment[];
  if (healthWorkerId) return db.prepare("SELECT * FROM appointments WHERE health_worker_id = ?").all(healthWorkerId) as DbAppointment[];
  return db.prepare("SELECT * FROM appointments").all() as DbAppointment[];
}
export function insertAppointment(a: DbAppointment) {
  db.prepare(`INSERT INTO appointments (id,patient_id,health_worker_id,doctor_id,date,time,urgency,status,notes,created_at)
    VALUES (@id,@patient_id,@health_worker_id,@doctor_id,@date,@time,@urgency,@status,@notes,@created_at)`).run(a);
}
export function patchAppointment(id: string, fields: Partial<DbAppointment>) {
  const sets = Object.keys(fields).map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE appointments SET ${sets} WHERE id = @id`).run({ ...fields, id });
}

// ── Raw DB row types (snake_case) ──────────────────────────────────────────────
export interface DbUser {
  id: string; name: string; role: string; email: string; password_hash: string;
  phone: string | null; clinic_name: string | null; specialization: string | null; created_at: number;
}
export interface DbPatient {
  id: string; name: string; age: string; gender: string; language: string;
  phone: string; village: string; allergies: string; conditions: string;
  medications: string; created_at: number; created_by: string;
}
export interface DbConsultation {
  id: string; patient_id: string; health_worker_id: string; doctor_id: string | null;
  appointment_id: string | null; symptoms_structured: string; symptoms_free_text: string;
  symptoms_duration: string; symptoms_flags: string; vitals_temp: string; vitals_bp: string;
  vitals_pulse: string; vitals_spo2: string; vitals_weight: string; vitals_rr: string;
  uploads_prescription: string; uploads_photo: string; triage_json: string | null;
  triage_override_json: string | null; ai_generated_at: number | null; first_aid_json: string | null;
  otc_decisions_json: string; doctor_review_json: string; status: string; stage: string; created_at: number;
}
export interface DbAppointment {
  id: string; patient_id: string; health_worker_id: string; doctor_id: string;
  date: string; time: string; urgency: string; status: string; notes: string; created_at: number;
}

export default db;
