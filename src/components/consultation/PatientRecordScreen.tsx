"use client";

import { translate } from "@/lib/i18n";
import { Consultation, Patient, UILang } from "@/lib/types";
import { AITag, DoctorTag, TriageBadge } from "../ui";

export function PatientRecordScreen({ patient, consultation, uiLang, onBack }: { patient: Patient; consultation: Consultation; uiLang: UILang; onBack: () => void }) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const eff = consultation.triageOverride || consultation.triage!;
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:shadow-none">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-xl text-slate-800">📁 {t("recordTitle")}</h3>
            <p className="text-slate-400 text-sm">
              {patient.name} · {patient.age}y · {patient.gender} · Visit {new Date(consultation.createdAt).toLocaleString()}
            </p>
          </div>
          <TriageBadge level={eff.level} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t("intakeLabel")}</p>
            <ul className="text-slate-600 space-y-0.5 mb-3">
              <li>
                Symptoms: {consultation.symptoms.structured.join(", ") || "—"} ({consultation.symptoms.duration})
              </li>
              <li>Notes: {consultation.symptoms.freeText || "—"}</li>
              <li>
                Vitals: {consultation.vitals.temp}°F, {consultation.vitals.bp} mmHg, {consultation.vitals.pulse} bpm, {consultation.vitals.spo2}% SpO2
              </li>
              <li>Allergies: {patient.history.allergies || "None"}</li>
              <li>Conditions: {patient.history.conditions || "None"}</li>
              <li>Medications: {patient.history.medications || "None"}</li>
            </ul>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {consultation.uploads.photoUrl && <img src={consultation.uploads.photoUrl} alt="Uploaded injury/symptom" className="h-20 rounded-lg border border-slate-200" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-2">
              AI Summary & Triage <AITag />
            </p>
            <ul className="text-slate-600 space-y-0.5 mb-3">
              {consultation.triage!.reasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
            {consultation.triageOverride && (
              <p className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 mb-3">
                Human override → <b>{consultation.triageOverride.level}</b>: {consultation.triageOverride.reason}
              </p>
            )}

            {consultation.firstAid && consultation.firstAid.otc.length > 0 && (
              <>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t("firstAidGiven")}</p>
                <ul className="text-slate-600 space-y-0.5 mb-3">
                  {consultation.firstAid.otc.map((o) => (
                    <li key={o.name}>
                      {o.name} —{" "}
                      <b className={consultation.otcDecisions[o.name] === "approved" ? "text-emerald-600" : consultation.otcDecisions[o.name] === "rejected" ? "text-red-600" : "text-slate-400"}>
                        {consultation.otcDecisions[o.name] || "not reviewed"}
                      </b>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-2">
              {t("doctorFinalNotes")} <DoctorTag />
            </p>
            <p className="text-slate-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
              {consultation.doctorReview.notes ||
                (consultation.doctorReview.reviewer
                  ? "Doctor reviewed and signed off with no additional notes."
                  : "No remote consult was required for this routine case; health worker managed on-site per approved first-aid protocol.")}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Status:{" "}
              <b className={consultation.doctorReview.status === "approved" ? "text-emerald-600" : consultation.doctorReview.status === "rejected" ? "text-red-600" : "text-slate-500"}>{consultation.doctorReview.status}</b>{" "}
              {consultation.doctorReview.reviewer && `— ${consultation.doctorReview.reviewer}`}
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold px-5 py-2.5 rounded-lg">
          🖨️ {t("print")}
        </button>
        <button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg">
          {t("backToQueue")}
        </button>
      </div>
    </div>
  );
}
