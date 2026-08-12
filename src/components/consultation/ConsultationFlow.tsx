"use client";

import { translate } from "@/lib/i18n";
import { Consultation, Patient, UILang, User } from "@/lib/types";
import { computeTriage, getFirstAid } from "@/lib/rules";
import { Stepper } from "../Stepper";
import { Analyzing } from "../Analyzing";
import { VisitIntakeForm } from "./VisitIntakeForm";
import { SummaryTriageScreen } from "./SummaryTriageScreen";
import { FirstAidScreen } from "./FirstAidScreen";
import { DoctorConnectScreen } from "./DoctorConnectScreen";
import { PatientRecordScreen } from "./PatientRecordScreen";

export function ConsultationFlow({
  patient,
  updatePatient,
  consultation,
  updateConsultation,
  currentUser,
  uiLang,
  onExit,
}: {
  patient: Patient;
  updatePatient: (mutator: (draft: Patient) => void) => void;
  consultation: Consultation;
  updateConsultation: (mutator: (draft: Consultation) => void) => void;
  currentUser: User;
  uiLang: UILang;
  onExit: () => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);

  const submitIntake = () => {
    updateConsultation((d) => {
      d.stage = "analyzing";
    });
    setTimeout(() => {
      updateConsultation((d) => {
        const triage = computeTriage(d);
        const firstAid = getFirstAid(d);
        d.triage = triage;
        d.firstAid = firstAid;
        d.aiGeneratedAt = Date.now();
        d.stage = "triage";
        d.status = triage.level === "urgent" ? "waiting-doctor" : "waiting-worker";
      });
    }, 1500);
  };

  const goFirstAid = () => updateConsultation((d) => { d.stage = "firstaid"; });
  const goDoctor = () =>
    updateConsultation((d) => {
      d.stage = "doctor";
      d.status = "waiting-doctor";
    });
  const finalizeFromFirstAid = () =>
    updateConsultation((d) => {
      d.stage = "doctor";
      d.status = "waiting-doctor";
    });
  const finalizeRecord = () =>
    updateConsultation((d) => {
      d.doctorId = currentUser.role === "doctor" ? currentUser.id : d.doctorId;
      d.stage = "record";
      d.status = "done";
    });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onExit} className="text-sm font-semibold text-slate-500 hover:text-blue-600">
          {t("backToQueue")}
        </button>
      </div>
      <Stepper stage={consultation.stage} triageLevel={consultation.triage?.level} uiLang={uiLang} />
      {consultation.stage === "intake" && <VisitIntakeForm patient={patient} updatePatient={updatePatient} consultation={consultation} updateConsultation={updateConsultation} uiLang={uiLang} onSubmit={submitIntake} />}
      {consultation.stage === "analyzing" && <Analyzing />}
      {consultation.stage === "triage" && (
        <SummaryTriageScreen patient={patient} consultation={consultation} updateConsultation={updateConsultation} uiLang={uiLang} onProceedFirstAid={goFirstAid} onProceedDoctor={goDoctor} />
      )}
      {consultation.stage === "firstaid" && (
        <FirstAidScreen patient={patient} consultation={consultation} updateConsultation={updateConsultation} uiLang={uiLang} onFinalize={finalizeFromFirstAid} onEscalate={goDoctor} />
      )}
      {consultation.stage === "doctor" && (
        <DoctorConnectScreen patient={patient} consultation={consultation} updateConsultation={updateConsultation} uiLang={uiLang} currentUser={currentUser} onFinalize={finalizeRecord} />
      )}
      {consultation.stage === "record" && <PatientRecordScreen patient={patient} consultation={consultation} uiLang={uiLang} onBack={onExit} />}
    </div>
  );
}
