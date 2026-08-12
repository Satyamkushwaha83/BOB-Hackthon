"use client";

import { useState } from "react";
import { translate } from "@/lib/i18n";
import { Consultation, Patient, TriageLevel, UILang } from "@/lib/types";
import { bpStatus, statusColor, vitalStatus } from "@/lib/rules";
import { AITag, DisclaimerBar, SpeakButton, TriageBadge } from "../ui";

export function SummaryTriageScreen({
  patient,
  consultation,
  updateConsultation,
  uiLang,
  onProceedFirstAid,
  onProceedDoctor,
}: {
  patient: Patient;
  consultation: Consultation;
  updateConsultation: (mutator: (draft: Consultation) => void) => void;
  uiLang: UILang;
  onProceedFirstAid: () => void;
  onProceedDoctor: () => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideLevel, setOverrideLevel] = useState<TriageLevel>(consultation.triage!.level);
  const [overrideReason, setOverrideReason] = useState("");
  const effLevel = consultation.triageOverride ? consultation.triageOverride.level : consultation.triage!.level;

  const chiefComplaint = (consultation.symptoms.structured.join(", ") || "Unspecified") + (consultation.symptoms.duration ? ` (${consultation.symptoms.duration})` : "");
  const vitalsSummary = [
    { label: "Temp", val: consultation.vitals.temp + "°F", st: vitalStatus("temp", consultation.vitals.temp) },
    { label: "BP", val: consultation.vitals.bp, st: bpStatus(consultation.vitals.bp) },
    { label: "Pulse", val: consultation.vitals.pulse + " bpm", st: vitalStatus("pulse", consultation.vitals.pulse) },
    { label: "SpO2", val: consultation.vitals.spo2 + "%", st: vitalStatus("spo2", consultation.vitals.spo2) },
  ];
  const summaryText = `Chief complaint: ${chiefComplaint}. Vitals — Temp ${consultation.vitals.temp}F, BP ${consultation.vitals.bp}, Pulse ${consultation.vitals.pulse}, SpO2 ${consultation.vitals.spo2}%. Triage: ${effLevel}.`;

  const applyOverride = () => {
    updateConsultation((d) => {
      d.triageOverride = { level: overrideLevel, reason: overrideReason || "No reason given", by: "Health Worker (on-site)", at: Date.now() };
    });
    setOverrideOpen(false);
  };

  return (
    <div className="space-y-5">
      <DisclaimerBar lang={uiLang} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800">📋 {t("aiSummaryTitle")}</h3>
          <div className="flex items-center gap-2">
            <AITag />
            <SpeakButton text={summaryText} lang={uiLang} id={`summary-${consultation.id}`} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t("chiefComplaintLabel")}</p>
            <p className="text-slate-700 mb-4">{chiefComplaint}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t("freeTextNotes")}</p>
            <p className="text-slate-600 text-sm mb-4">{consultation.symptoms.freeText || "—"}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t("relevantHistory")}</p>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-0.5">
              <li>{t("allergies")}: {patient.history.allergies || "None recorded"}</li>
              <li>{t("conditions")}: {patient.history.conditions || "None recorded"}</li>
              <li>{t("medications")}: {patient.history.medications || "None recorded"}</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{t("vitalsStatus")}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {vitalsSummary.map((v) => (
                <div key={v.label} className={`border rounded-lg px-3 py-2 text-sm font-semibold ${statusColor[v.st]}`}>
                  {v.label}: {v.val}
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t("riskFlags")}</p>
            <ul className="text-sm space-y-1">
              {consultation.triage!.reasons.map((r, i) => (
                <li key={i} className="flex gap-1.5">
                  <span>•</span>
                  <span className="text-slate-600">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <h3 className="font-bold text-lg text-slate-800">🚨 {t("triageTitle")}</h3>
          <AITag />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <TriageBadge level={effLevel} />
          {consultation.triageOverride && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
              Overridden from AI suggestion ({consultation.triage!.level}) by {consultation.triageOverride.by}
            </span>
          )}
          <button onClick={() => setOverrideOpen((o) => !o)} className="text-xs text-blue-600 hover:underline font-semibold ml-auto">
            {t("humanOverride")}
          </button>
        </div>
        {overrideOpen && (
          <div className="mt-4 border border-slate-200 rounded-lg p-4 bg-slate-50">
            <p className="text-xs text-slate-500 mb-2">A health worker can always override the AI triage decision. This is logged in the patient record.</p>
            <div className="flex gap-3 items-center flex-wrap">
              <select value={overrideLevel} onChange={(e) => setOverrideLevel(e.target.value as TriageLevel)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="urgent">Urgent</option>
                <option value="amber">Needs Doctor Review</option>
                <option value="routine">Routine</option>
              </select>
              <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Reason for override" className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-1.5 text-sm" />
              <button onClick={applyOverride} className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg font-semibold">
                {t("save")}
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 flex gap-3 flex-wrap">
          {effLevel === "urgent" ? (
            <button onClick={onProceedDoctor} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg shadow-sm animate-pulse">
              🚑 {t("connectDoctorNow")}
            </button>
          ) : (
            <>
              <button onClick={onProceedFirstAid} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg">
                🩹 {t("proceedFirstAid")}
              </button>
              <button onClick={onProceedDoctor} className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold px-5 py-2.5 rounded-lg">
                🧑‍⚕️ {t("escalateDoctor")}
              </button>
            </>
          )}
        </div>
        {effLevel === "urgent" && <p className="text-xs text-red-500 mt-3">🚫 {t("hiddenUrgent")}</p>}
      </div>
    </div>
  );
}
