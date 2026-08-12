import { Appointment, Consultation, Patient } from "./types";
import { computeTriage, getFirstAid } from "./rules";

let idCounter = 100;
export const newId = (prefix: string) => `${prefix}${++idCounter}`;

export function blankPatient(createdBy: string): Patient {
  return {
    id: newId("PT"),
    name: "",
    age: "",
    gender: "Male",
    language: "Hindi",
    phone: "",
    history: { allergies: "", conditions: "", medications: "" },
    createdAt: Date.now(),
    createdBy,
  };
}

export function makePatient(data: Omit<Patient, "id" | "createdAt" | "createdBy">, createdBy: string): Patient {
  return { ...data, id: newId("PT"), createdAt: Date.now(), createdBy };
}

export function blankConsultation(patientId: string, healthWorkerId: string): Consultation {
  return {
    id: newId("C"),
    patientId,
    healthWorkerId,
    doctorId: null,
    appointmentId: null,
    symptoms: { structured: [], freeText: "", duration: "", flags: [] },
    vitals: { temp: "", bp: "", pulse: "", spo2: "" },
    uploads: { prescriptionText: "", photoUrl: "" },
    triage: null,
    triageOverride: null,
    aiGeneratedAt: null,
    firstAid: null,
    otcDecisions: {},
    doctorReview: { notes: "", status: "pending", reviewer: "" },
    status: "waiting-worker",
    stage: "intake",
    createdAt: Date.now(),
  };
}

export function seedData(): { patients: Patient[]; consultations: Consultation[]; appointments: Appointment[] } {
  const patients: Patient[] = [
    {
      id: newId("PT"),
      name: "Ramesh Kumar",
      age: "45",
      gender: "Male",
      language: "Hindi",
      phone: "+91 90123 45678",
      village: "Rampur",
      history: { allergies: "None known", conditions: "None", medications: "None" },
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
      createdBy: "U1",
    },
    {
      id: newId("PT"),
      name: "Sita Devi",
      age: "68",
      gender: "Female",
      language: "Hindi",
      phone: "+91 90123 00000",
      village: "Rampur",
      history: { allergies: "Sulfa drugs", conditions: "Hypertension (on medication)", medications: "Amlodipine 5mg OD" },
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
      createdBy: "U1",
    },
    {
      id: newId("PT"),
      name: "Vikram Singh",
      age: "34",
      gender: "Male",
      language: "English",
      phone: "+91 90123 11111",
      village: "Sonapur",
      history: { allergies: "None known", conditions: "None", medications: "None" },
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
      createdBy: "U2",
    },
    {
      id: newId("PT"),
      name: "Laxmi Bai",
      age: "28",
      gender: "Female",
      language: "Marathi",
      phone: "+91 90123 22222",
      village: "Nandgaon",
      history: { allergies: "None", conditions: "Anaemia (on iron supplements)", medications: "Ferrous sulphate 200mg OD" },
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
      createdBy: "U2",
    },
    {
      id: newId("PT"),
      name: "Arjun Yadav",
      age: "12",
      gender: "Male",
      language: "Hindi",
      phone: "+91 90123 33333",
      village: "Rampur",
      history: { allergies: "None known", conditions: "None", medications: "None" },
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      createdBy: "U1",
    },
  ];

  const c1: Consultation = {
    ...blankConsultation(patients[0].id, "U1"),
    symptoms: { structured: ["Fever", "Headache"], freeText: "Fever since 2 days, mild body ache.", duration: "2 days", flags: [] },
    vitals: { temp: "100.8", bp: "128/82", pulse: "88", spo2: "97" },
    doctorId: "U3",
    doctorReview: { notes: "Advised rest, ORS and paracetamol for 2 more days. Re-check if fever persists beyond day 4.", status: "approved", reviewer: "Dr. Anita Verma" },
    status: "done",
    stage: "record",
    createdAt: Date.now() - 55 * 60000,
  };

  const c2: Consultation = {
    ...blankConsultation(patients[1].id, "U1"),
    symptoms: { structured: ["Weakness / Fatigue", "Headache"], freeText: "Feeling dizzy since morning, occasional blurred vision.", duration: "6 hours", flags: [] },
    vitals: { temp: "99.1", bp: "172/104", pulse: "96", spo2: "95" },
    doctorId: "U3",
    status: "waiting-doctor",
    stage: "doctor",
    createdAt: Date.now() - 12 * 60000,
  };

  const c3: Consultation = {
    ...blankConsultation(patients[2].id, "U2"),
    symptoms: { structured: ["Minor Cut / Wound"], freeText: "Cut on forearm from farm tool, cleaned at home.", duration: "1 hour", flags: [] },
    vitals: { temp: "98.6", bp: "118/76", pulse: "74", spo2: "99" },
    status: "waiting-worker",
    stage: "firstaid",
    createdAt: Date.now() - 5 * 60000,
  };

  [c1, c2, c3].forEach((c) => {
    c.triage = computeTriage(c);
    c.aiGeneratedAt = c.createdAt + 20000;
    c.firstAid = getFirstAid(c);
  });

  const appointments: Appointment[] = [
    {
      id: newId("A"),
      patientId: patients[1].id,
      healthWorkerId: "U1",
      doctorId: "U3",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10),
      time: "11:00",
      urgency: "priority",
      status: "confirmed",
      notes: "Follow-up on BP after remote consult.",
      createdAt: Date.now() - 1000 * 60 * 60 * 3,
    },
    {
      id: newId("A"),
      patientId: patients[0].id,
      healthWorkerId: "U2",
      doctorId: "U4",
      date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().slice(0, 10),
      time: "16:30",
      urgency: "routine",
      status: "requested",
      notes: "General check-up requested by family.",
      createdAt: Date.now() - 1000 * 60 * 30,
    },
  ];

  return { patients, consultations: [c1, c2, c3], appointments };
}
