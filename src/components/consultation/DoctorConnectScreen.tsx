"use client";

import { useEffect, useState } from "react";
import { translate } from "@/lib/i18n";
import { doctors } from "@/lib/auth";
import { Consultation, DoctorReviewStatus, Patient, UILang, User } from "@/lib/types";
import { DisclaimerBar, AITag, MicButton, TriageBadge } from "../ui";

/** Strip everything except digits and leading + so wa.me links work */
function toWaPhone(raw?: string) {
  if (!raw) return "";
  return raw.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

function WhatsAppCallPanel({ uiLang, patientName }: { uiLang: UILang; patientName: string }) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const allDoctors = doctors();

  const call = (phone: string, mode: "voice" | "video") => {
    const num = toWaPhone(phone);
    if (!num) return;
    const msg = encodeURIComponent(
      `🏥 *Sehat-Sarthi – Doctor Consultation*\n\nUrgent consultation needed for patient: *${patientName}*.\n\nPlease pick up — I am calling from the Village Health Centre.`
    );
    // wa.me opens WhatsApp chat; worker taps call / video-call inside WhatsApp
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
      <p className="text-sm font-bold text-emerald-800 mb-1 flex items-center gap-2">
        <span>💬</span> {t("waCallTitle")}
      </p>
      <p className="text-xs text-emerald-600 mb-3">{t("waCallSubtitle")}</p>
      <div className="space-y-2">
        {allDoctors.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between bg-white border border-emerald-100 rounded-lg px-3 py-2 gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
              <p className="text-xs text-slate-400 truncate">{doc.specialization} · {doc.phone ?? "—"}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => doc.phone && call(doc.phone, "voice")}
                disabled={!doc.phone}
                title={t("waVoiceCall")}
                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                📞 {t("waVoiceCall")}
              </button>
              <button
                onClick={() => doc.phone && call(doc.phone, "video")}
                disabled={!doc.phone}
                title={t("waVideoCall")}
                className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                📹 {t("waVideoCall")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DoctorConnectScreen({
  patient,
  consultation,
  updateConsultation,
  uiLang,
  currentUser,
  onFinalize,
}: {
  patient: Patient;
  consultation: Consultation;
  updateConsultation: (mutator: (draft: Consultation) => void) => void;
  uiLang: UILang;
  currentUser: User;
  onFinalize: (status: DoctorReviewStatus) => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const [connecting, setConnecting] = useState(true);
  const [notes, setNotes] = useState(consultation.doctorReview.notes || "");

  useEffect(() => {
    const tm = setTimeout(() => setConnecting(false), 1400);
    return () => clearTimeout(tm);
  }, []);

  const doctorName = currentUser.role === "doctor" ? currentUser.name : "Dr. Anita Verma (Remote)";

  const finalize = (finalDecision: DoctorReviewStatus) => {
    updateConsultation((d) => {
      d.doctorReview = { notes, status: finalDecision, reviewer: doctorName };
    });
    onFinalize(finalDecision);
  };

  const eff = consultation.triageOverride || consultation.triage!;

  return (
    <div className="space-y-5">
      <DisclaimerBar lang={uiLang} compact />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            🎥 {t("doctorConnectTitle")} {connecting ? <span className="text-amber-300 text-xs animate-pulse">{t("connecting")}</span> : <span className="text-emerald-300 text-xs">● {t("live")}</span>}
          </h3>
          {consultation.triage!.level === "urgent" && <span className="text-xs bg-red-600 px-2 py-1 rounded-full font-bold">{t("urgentEscalation")}</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-slate-200">
          <div className="p-6 flex flex-col items-center justify-center bg-slate-100 border-r border-slate-200 min-h-[180px]">
            <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center text-2xl mb-2">👤</div>
            <p className="font-semibold text-slate-700">{patient.name}</p>
            <p className="text-xs text-slate-400">Health Centre — Patient Camera</p>
          </div>
          <div className="p-6 flex flex-col items-center justify-center bg-slate-800 min-h-[180px]">
            {connecting ? (
              <div className="text-white text-sm animate-pulse">{t("waitingDoctorJoin")}</div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-300 flex items-center justify-center text-2xl mb-2">🧑‍⚕️</div>
                <p className="font-semibold text-white">{doctorName}</p>
                <p className="text-xs text-slate-300">{currentUser.role === "doctor" ? currentUser.specialization : "Remote — General Physician"}</p>
              </>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(
              [
                ["Temp", consultation.vitals.temp + "°F"],
                ["BP", consultation.vitals.bp],
                ["Pulse", consultation.vitals.pulse],
                ["SpO2", consultation.vitals.spo2 + "%"],
              ] as const
            ).map(([l, v]) => (
              <div key={l} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <span className="text-slate-400">{l}:</span> <b>{v}</b>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-2">
              AI Summary <AITag />
            </p>
            <p className="text-sm text-slate-600">
              {consultation.symptoms.structured.join(", ") || "Unspecified"} · {consultation.symptoms.duration} · {consultation.symptoms.freeText}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-2">
              AI Triage <AITag />
            </p>
            <TriageBadge level={eff.level} size="sm" />
            <ul className="text-xs text-slate-500 mt-2 list-disc list-inside">
              {consultation.triage!.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          {consultation.firstAid && consultation.firstAid.otc.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">OTC Decisions So Far</p>
              <ul className="text-xs text-slate-600 space-y-0.5">
                {consultation.firstAid.otc.map((o) => (
                  <li key={o.name}>
                    {o.name}: <b>{consultation.otcDecisions[o.name] || "not yet reviewed"}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* WhatsApp call panel — health worker only */}
          {currentUser.role === "health_worker" && (
            <WhatsAppCallPanel uiLang={uiLang} patientName={patient.name} />
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase mb-1 block">{t("doctorsNotes")}</label>
            <div className="flex gap-2 items-start">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Doctor writes final assessment / instructions here..." className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <MicButton lang={uiLang} onResult={(text) => setNotes((prev) => (prev ? prev + " " : "") + text)} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button onClick={() => finalize("rejected")} className="bg-white border border-red-300 text-red-600 hover:bg-red-50 font-semibold px-5 py-2.5 rounded-lg">
              ❌ {t("rejectSuggestions")}
            </button>
            <button onClick={() => finalize("approved")} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg">
              ✅ {t("approveFinalize")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
