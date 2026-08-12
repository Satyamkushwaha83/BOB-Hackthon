"use client";

import { translate } from "@/lib/i18n";
import { Consultation, UILang } from "@/lib/types";

export function AnalyticsSection({ consultations, uiLang }: { consultations: Consultation[]; uiLang: UILang }) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const total = consultations.length;
  const urgent = consultations.filter((c) => c.triage?.level === "urgent").length;
  const amber = consultations.filter((c) => c.triage?.level === "amber").length;
  const flagged = urgent + amber;
  const completed = consultations.filter((c) => c.status === "done").length;
  const waitingDoctor = consultations.filter((c) => c.status === "waiting-doctor").length;

  const cards = [
    { label: t("totalConsultations"), n: total, color: "bg-blue-600" },
    { label: t("urgentCases"), n: urgent, color: "bg-red-600" },
    { label: t("avgVitalsFlagged"), n: flagged, color: "bg-amber-500" },
    { label: t("completedToday"), n: completed, color: "bg-emerald-600" },
    { label: "Awaiting Doctor", n: waitingDoctor, color: "bg-purple-600" },
  ];

  const byTriage = [
    { label: t("urgent"), n: consultations.filter((c) => c.triage?.level === "urgent").length, color: "bg-red-600" },
    { label: t("doctorReview"), n: consultations.filter((c) => c.triage?.level === "amber").length, color: "bg-amber-500" },
    { label: t("routine"), n: consultations.filter((c) => c.triage?.level === "routine").length, color: "bg-emerald-600" },
  ];
  const maxTriage = Math.max(1, ...byTriage.map((b) => b.n));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">{t("analyticsTitle")}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${c.color}`}></span>
              <span className="text-sm text-slate-500">{c.label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{c.n}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4">Consultations by Triage Level</h3>
        <div className="space-y-3">
          {byTriage.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{b.label}</span>
                <span>{b.n}</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${b.color}`} style={{ width: `${(b.n / maxTriage) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
