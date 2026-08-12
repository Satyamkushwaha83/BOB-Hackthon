"use client";

import { useState } from "react";
import { doctors } from "@/lib/auth";
import { blankConsultation, makePatient, seedData } from "@/lib/seed";
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

export function ClinicApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [uiLang, setUiLang] = useState<UILang>("en");
  const seed = useState(() => seedData())[0];
  const [patients, setPatients] = useState<Patient[]>(seed.patients);
  const [consultations, setConsultations] = useState<Consultation[]>(seed.consultations);
  const [appointments, setAppointments] = useState<Appointment[]>(seed.appointments);
  const [activeSection, setActiveSection] = useState<SectionId>("queue");
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null);

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
        return draft;
      })
    );
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveSection(user.role === "doctor" ? "cases" : "queue");
  };
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveConsultationId(null);
    setActiveSection("queue");
  };

  const startConsultation = (patientId: string) => {
    if (!currentUser) return;
    const c = blankConsultation(patientId, currentUser.id);
    setConsultations((prev) => [...prev, c]);
    setActiveConsultationId(c.id);
  };

  const registerAndStart = (data: Omit<Patient, "id" | "createdAt" | "createdBy">) => {
    if (!currentUser) return;
    const p = makePatient(data, currentUser.id);
    setPatients((prev) => [...prev, p]);
    startConsultation(p.id);
  };

  const createAppointment = (data: Omit<Appointment, "id" | "createdAt" | "status">) => {
    const id = `AP${Date.now().toString(36).toUpperCase()}`;
    setAppointments((prev) => [...prev, { ...data, id, createdAt: Date.now(), status: "requested" }]);
  };
  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };
  const cancelAppointment = (id: string) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" as AppointmentStatus } : a)));
  };

  if (!currentUser) {
    return <LoginScreen uiLang={uiLang} setUiLang={setUiLang} onLogin={handleLogin} />;
  }

  const activeConsultation = activeConsultationId ? consultations.find((c) => c.id === activeConsultationId) : null;
  const activePatient = activeConsultation ? patients.find((p) => p.id === activeConsultation.patientId) : null;

  const myPatients = currentUser.role === "doctor"
    ? patients
    : patients.filter((p) => p.createdBy === currentUser.id || consultations.some((c) => c.patientId === p.id && c.healthWorkerId === currentUser.id));
  const myConsultations = currentUser.role === "doctor" ? consultations : consultations.filter((c) => c.healthWorkerId === currentUser.id);

  const navigate = (s: SectionId) => {
    setActiveConsultationId(null);
    setActiveSection(s);
  };

  return (
    <AppShell user={currentUser} uiLang={uiLang} setUiLang={setUiLang} active={activeSection} onNavigate={navigate} onLogout={handleLogout}>
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
          {activeSection === "cases" && <DoctorCasesSection consultations={consultations} patients={patients} uiLang={uiLang} onOpen={setActiveConsultationId} />}
          {activeSection === "records" && <PatientRecordsSection patients={patients} consultations={consultations} uiLang={uiLang} onOpenConsultation={setActiveConsultationId} />}
          {activeSection === "review" && <ConsultationReviewSection consultations={consultations} patients={patients} uiLang={uiLang} onOpen={setActiveConsultationId} />}
          {activeSection === "appointments" && (
            <AppointmentsSection appointments={appointments} patients={patients} doctorsList={doctors()} currentUser={currentUser} uiLang={uiLang} onCreate={createAppointment} onUpdateStatus={updateAppointmentStatus} />
          )}
          {activeSection === "analytics" && <AnalyticsSection consultations={consultations} uiLang={uiLang} />}
        </>
      ) : (
        <>
          {activeSection === "queue" && <QueueSection patients={myPatients} consultations={myConsultations} uiLang={uiLang} onOpen={setActiveConsultationId} onNew={() => navigate("intake")} />}
          {activeSection === "intake" && <NewIntakeSection patients={myPatients} uiLang={uiLang} onSelectExisting={startConsultation} onRegisterNew={registerAndStart} />}
          {activeSection === "records" && <PatientRecordsSection patients={myPatients} consultations={myConsultations} uiLang={uiLang} onOpenConsultation={setActiveConsultationId} />}
          {activeSection === "firstaid-guide" && <FirstAidGuideSection uiLang={uiLang} />}
          {activeSection === "doctor-consult" && <DoctorConsultSection consultations={consultations} patients={patients} currentUserId={currentUser.id} uiLang={uiLang} onOpen={setActiveConsultationId} />}
          {activeSection === "appointments" && (
            <AppointmentsSection appointments={appointments} patients={myPatients} doctorsList={doctors()} currentUser={currentUser} uiLang={uiLang} onCreate={createAppointment} onUpdateStatus={updateAppointmentStatus} />
          )}
        </>
      )}
    </AppShell>
  );
}
