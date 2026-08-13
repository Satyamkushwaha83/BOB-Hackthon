"use client";

import { translate } from "@/lib/i18n";
import { doctors } from "@/lib/auth";
import { Consultation, Patient, UILang } from "@/lib/types";
import { TriageBadge } from "../ui";

/** Strip non-digits so wa.me links work */
function toWaPhone(raw?: string) {
  if (!raw) return "";
  return raw.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

export function DoctorConsultSection({
  consultations,
  patients,
  currentUserId,
  uiLang,
  onOpen,
}: {
  consultations: Consultation[];
  patients: Patient[];
  currentUserId: string;
  uiLang: UILang;
  onOpen: (id: string) => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const mine = consultations.filter((c) => c.healthWorkerId === currentUserId && (c.stage === "doctor" || (c.status === "done" && c.doctorReview.status !== "pending")));
  const sorted = [...mine].sort((a, b) => b.createdAt - a.createdAt);
  const allDoctors = doctors();

  const callDoctor = (phone: string) => {
    const num = toWaPhone(phone);
    if (!num) return;
    const msg = encodeURIComponent(
      `🏥 *Sehat-Sarthi – Village Health Centre*\n\nI need to speak with you regarding a patient consultation. Please call me back or pick up on WhatsApp.\n\n_Sent via Sehat-Sarthi_`
    );
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h2 className="text-2xl font-bold text-slate-800">{t("navDoctorConsult")}</h2>
      <p className="text-sm text-slate-500">Cases from your queue that were escalated to, or reviewed by, a remote doctor.</p>

      {/* ── Quick-dial doctors via WhatsApp ────────────────────── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <p className="text-sm font-bold text-emerald-800 mb-1 flex items-center gap-2">
          <span>💬</span> {t("waCallTitle")}
        </p>
        <p className="text-xs text-emerald-600 mb-4">{t("waCallSubtitle")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allDoctors.map((doc) => (
            <div key={doc.id} className="bg-white border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg shrink-0">🧑‍⚕️</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{doc.name}</p>
                <p className="text-xs text-slate-400 truncate">{doc.specialization}</p>
                <p className="text-xs text-slate-400 truncate">{doc.phone ?? "No number"}</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => doc.phone && callDoctor(doc.phone)}
                  disabled={!doc.phone}
                  className="flex items-center gap-1 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                >
                  📞 {t("waVoiceCall")}
                </button>
                <button
                  onClick={() => doc.phone && callDoctor(doc.phone)}
                  disabled={!doc.phone}
                  className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                >
                  📹 {t("waVideoCall")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Past consultations ──────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {sorted.length === 0 && <p className="text-sm text-slate-400">No doctor consultations yet — escalate a case from the AI Summary &amp; Triage screen.</p>}
        <div className="space-y-2">
          {sorted.map((c) => {
            const p = patients.find((pt) => pt.id === c.patientId);
            return (
              <button key={c.id} onClick={() => onOpen(c.id)} className="w-full flex items-center justify-between border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg px-4 py-3 text-left transition">
                <span>
                  <span className="block font-semibold text-slate-800">{p?.name}</span>
                  <span className="block text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                </span>
                <span className="flex items-center gap-3">
                  {c.triage && <TriageBadge level={c.triage.level} size="sm" />}
                  <span className="text-xs font-semibold text-slate-500">{c.stage === "doctor" ? "In review" : c.doctorReview.status}</span>
                  <span className="text-blue-600 text-sm font-semibold">→</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
