"use client";

import { useEffect, useState, useCallback } from "react";
import { blankConsultation, makePatient } from "@/lib/seed";
import { Appointment, AppointmentStatus, Consultation, Patient, UILang, User } from "@/lib/types";
import { AppShell, SectionId } from "./AppShell";
import { LoginScreen } from "./LoginScreen";
import { ConsultationFlow } from "./consultation/ConsultationFlow";
import { QueueSection } from "./sections/QueueSection";
import { NewIntakeSection } from "./sections/NewIntakeSection";
import { PatientRecordsSection } from "./sections/PatientRecordsSection";
import { FirstAidGuideSection } from "./sections/FirstAidGuideSection";
import { DoctorConsultSection } from "./sections/DoctorConsultSection";
import { AppointmentsSection } from "./sections/AppointmentsSection";
import { DoctorCasesSection } from "./sections/DoctorCasesSection";
import { ConsultationReviewSection } from "./sections/ConsultationReviewSection";
import { AnalyticsSection } from "./sections/AnalyticsSection";
import {
  apiMe, apiLogin, apiLogout,
  apiGetPatients, apiCreatePatient,
  apiGetConsultations, apiCreateConsultation, apiPatchConsultation,
  apiGetAppointments, apiCreateAppointment, apiPatchAppointment,
} from "@/lib/api";

// ── Loading spinner ────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm font-medium">Loading Sehat Sarthi…</p>
      </div>
    </div>
  );
}

export function ClinicApp() {
  const [currentUser, setCurrentUser]   = useState<User | null>(null);
  const [uiLang, setUiLang]             = useState<UILang>("en");
  const [patients, setPatients]         = useState<Patient[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allUsers, setAllUsers]         = useState<User[]>([]);
  const [activeSection, setActiveSection] = useState<SectionId>("queue");
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true); // checking existing session

  // ── Load all data after login ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [pts, cons, appts, users] = await Promise.all([
      apiGetPatients(),
      apiGetConsultations(),
      apiGetAppointments(),
      fetch("/api/users").then((r) => r.json()).catch(() => []),
    ]);
    setPatients(pts);
    setConsultations(cons);
    setAppointments(appts);
    setAllUsers(users);
  }, []);

  // ── Resume session on page load ───────────────────────────────────────────
  useEffect(() => {
    apiMe()
      .then(async (user) => {
        if (user) {
          setCurrentUser(user);
          setActiveSection(user.role === "doctor" ? "cases" : "queue");
          await loadData();
        }
      })
      .finally(() => setBootstrapping(false));
  }, [loadData]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    setActiveSection(user.role === "doctor" ? "cases" : "queue");
    await loadData();
  };

  const handleLogout = async () => {
    await apiLogout();
    setCurrentUser(null);
    setActiveConsultationId(null);
    setActiveSection("queue");
    setPatients([]);
    setConsultations([]);
    setAppointments([]);
  };

  // ── Optimistic update helpers ────────────────────────────────────────────
  const updatePatient = (id: string, mutator: (draft: Patient) => void) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const draft = structuredClone(p);
        mutator(draft);
        return draft;
      })
    );
  };

  const updateConsultation = (id: string, mutator: (draft: Consultation) => void) => {
    setConsultations((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const draft = structuredClone(c);
        mutator(draft);
        // Persist to backend (fire-and-forget; optimistic UI already updated)
        apiPatchConsultation(id, draft).catch(console.error);
        return draft;
      })
    );
  };

  // ── New consultation ──────────────────────────────────────────────────────
  const startConsultation = async (patientId: string) => {
    if (!currentUser) return;
    const c = blankConsultation(patientId, currentUser.id);
    setConsultations((prev) => [...prev, c]);
    await apiCreateConsultation(c).catch(console.error);
    setActiveConsultationId(c.id);
  };

  const registerAndStart = async (data: Omit<Patient, "id" | "createdAt" | "createdBy">) => {
    if (!currentUser) return;
    const p = makePatient(data, currentUser.id);
    setPatients((prev) => [...prev, p]);
    await apiCreatePatient(p).catch(console.error);
    await startConsultation(p.id);
  };

  // ── Appointments ──────────────────────────────────────────────────────────
  const createAppointment = async (data: Omit<Appointment, "id" | "createdAt" | "status">) => {
    const id = `AP${Date.now().toString(36).toUpperCase()}`;
    const appt: Appointment = { ...data, id, createdAt: Date.now(), status: "requested" };
    setAppointments((prev) => [...prev, appt]);
    await apiCreateAppointment(appt).catch(console.error);
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    await apiPatchAppointment(id, status).catch(console.error);
  };

  const cancelAppointment = async (id: string) => {
    await updateAppointmentStatus(id, "cancelled");
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const myPatients = currentUser?.role === "doctor"
    ? patients
    : patients.filter((p) =>
        p.createdBy === currentUser?.id ||
        consultations.some((c) => c.patientId === p.id && c.healthWorkerId === currentUser?.id)
      );

  const myConsultations = currentUser?.role === "doctor"
    ? consultations
    : consultations.filter((c) => c.healthWorkerId === currentUser?.id);

  const doctorsList = allUsers.filter((u) => u.role === "doctor");

  const navigate = (s: SectionId) => {
    setActiveConsultationId(null);
    setActiveSection(s);
  };

  const activeConsultation = activeConsultationId
    ? consultations.find((c) => c.id === activeConsultationId)
    : null;
  const activePatient = activeConsultation
    ? patients.find((p) => p.id === activeConsultation.patientId)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  if (bootstrapping) return <Spinner />;

  if (!currentUser) {
    return <LoginScreen uiLang={uiLang} setUiLang={setUiLang} onLogin={handleLogin} />;
  }

  return (
    <AppShell
      user={currentUser}
      uiLang={uiLang}
      setUiLang={setUiLang}
      active={activeSection}
      onNavigate={navigate}
      onLogout={handleLogout}
    >
      {activeConsultation && activePatient ? (
        <ConsultationFlow
          patient={activePatient}
          updatePatient={(mutator) => updatePatient(activePatient.id, mutator)}
          consultation={activeConsultation}
          updateConsultation={(mutator) => updateConsultation(activeConsultation.id, mutator)}
          currentUser={currentUser}
          uiLang={uiLang}
          onExit={() => setActiveConsultationId(null)}
        />
      ) : currentUser.role === "doctor" ? (
        <>
          {activeSection === "cases" && (
            <DoctorCasesSection
              consultations={consultations}
              appointments={appointments.filter((a) => a.doctorId === currentUser.id)}
              patients={patients}
              uiLang={uiLang}
              onOpenConsultation={setActiveConsultationId}
              onUpdateAppointmentStatus={updateAppointmentStatus}
            />
          )}
          {activeSection === "records" && (
            <PatientRecordsSection patients={patients} consultations={consultations} uiLang={uiLang} onOpenConsultation={setActiveConsultationId} />
          )}
          {activeSection === "review" && (
            <ConsultationReviewSection consultations={consultations} patients={patients} uiLang={uiLang} onOpen={setActiveConsultationId} />
          )}
          {activeSection === "appointments" && (
            <AppointmentsSection
              appointments={appointments}
              patients={patients}
              doctorsList={doctorsList}
              currentUser={currentUser}
              uiLang={uiLang}
              onCreate={createAppointment}
              onUpdateStatus={updateAppointmentStatus}
            />
          )}
          {activeSection === "analytics" && <AnalyticsSection consultations={consultations} uiLang={uiLang} />}
        </>
      ) : (
        <>
          {activeSection === "queue" && (
            <QueueSection patients={myPatients} consultations={myConsultations} uiLang={uiLang} onOpen={setActiveConsultationId} onNew={() => navigate("intake")} />
          )}
          {activeSection === "intake" && (
            <NewIntakeSection patients={myPatients} uiLang={uiLang} onSelectExisting={startConsultation} onRegisterNew={registerAndStart} />
          )}
          {activeSection === "records" && (
            <PatientRecordsSection patients={myPatients} consultations={myConsultations} uiLang={uiLang} onOpenConsultation={setActiveConsultationId} />
          )}
          {activeSection === "firstaid-guide" && <FirstAidGuideSection uiLang={uiLang} />}
          {activeSection === "doctor-consult" && (
            <DoctorConsultSection consultations={consultations} patients={patients} currentUserId={currentUser.id} uiLang={uiLang} onOpen={setActiveConsultationId} />
          )}
          {activeSection === "appointments" && (
            <AppointmentsSection
              appointments={appointments}
              patients={myPatients}
              doctorsList={doctorsList}
              currentUser={currentUser}
              uiLang={uiLang}
              onCreate={createAppointment}
              onUpdateStatus={updateAppointmentStatus}
            />
          )}
        </>
      )}
    </AppShell>
  );
}
