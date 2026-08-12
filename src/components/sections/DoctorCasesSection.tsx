"use client";

import { translate } from "@/lib/i18n";
import { Consultation, Patient, UILang } from "@/lib/types";
import { TriageBadge } from "../ui";

export function DoctorCasesSection({
  consultations,
  patients,
  uiLang,
  onOpen,
}: {
  consultations: Consultation[];
  patients: Patient[];
  uiLang: UILang;
  onOpen: (id: string) => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const pending = consultations.filter((c) => c.status === "waiting-doctor");
  const urgent = pending.filter((c) => (c.triageOverride?.level || c.triage?.level) === "urgent" && c.stage === "doctor");
  const routineReview = pending.filter((c) => !urgent.includes(c));

  const patientOf = (id: string) => patients.find((p) => p.id === id);

  const Row = ({ c }: { c: Consultation }) => {
    const p = patientOf(c.patientId);
    return (
      <button onClick={() => onOpen(c.id)} className="w-full flex items-center justify-between border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg px-4 py-3 text-left transition">
        <span>
          <span className="block font-semibold text-slate-800">{p?.name}</span>
          <span className="block text-xs text-slate-400">
            {p?.age}y{p?.village ? ` · ${p.village}` : ""} · {c.symptoms.structured.join(", ") || "—"}
          </span>
        </span>
        <span className="flex items-center gap-3">
          {c.triage && <TriageBadge level={c.triage.level} size="sm" />}
          <span className="text-blue-600 text-sm font-semibold">{t("review")}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">{t("navIncomingCases")}</h2>

      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">🚨 {t("liveEscalations")}</h3>
        <div className="space-y-2">
          {urgent.length === 0 && <p className="text-sm text-slate-400">{t("noIncoming")}</p>}
          {urgent.map((c) => (
            <Row key={c.id} c={c} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">🟠 {t("pendingReviews")}</h3>
        <div className="space-y-2">
          {routineReview.length === 0 && <p className="text-sm text-slate-400">{t("noIncoming")}</p>}
          {routineReview.map((c) => (
            <Row key={c.id} c={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
