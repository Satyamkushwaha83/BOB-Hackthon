"use client";

import { translate } from "@/lib/i18n";
import { Consultation, Patient, UILang } from "@/lib/types";
import { TriageBadge } from "../ui";

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

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h2 className="text-2xl font-bold text-slate-800">{t("navDoctorConsult")}</h2>
      <p className="text-sm text-slate-500">Cases from your queue that were escalated to, or reviewed by, a remote doctor.</p>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {sorted.length === 0 && <p className="text-sm text-slate-400">No doctor consultations yet — escalate a case from the AI Summary & Triage screen.</p>}
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
