"use client";

import { translate } from "@/lib/i18n";
import { Consultation, Patient, UILang } from "@/lib/types";
import { TriageBadge } from "../ui";

export function ConsultationReviewSection({
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
  const queue = [...consultations].filter((c) => c.status !== "done").sort((a, b) => a.createdAt - b.createdAt);
  const patientOf = (id: string) => patients.find((p) => p.id === id);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h2 className="text-2xl font-bold text-slate-800">{t("navConsultReview")}</h2>
      <p className="text-sm text-slate-500">Full worklist of consultations awaiting doctor sign-off, oldest first.</p>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("patient")}</th>
              <th className="px-4 py-3 font-medium">{t("chiefComplaint")}</th>
              <th className="px-4 py-3 font-medium">{t("triage")}</th>
              <th className="px-4 py-3 font-medium">{t("status")}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {queue.map((c) => {
              const p = patientOf(c.patientId);
              return (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-semibold text-slate-800">{p?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.symptoms.structured.join(", ") || "—"}</td>
                  <td className="px-4 py-3">{c.triage && <TriageBadge level={c.triage.level} size="sm" />}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{c.stage}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onOpen(c.id)} className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                      {t("review")}
                    </button>
                  </td>
                </tr>
              );
            })}
            {queue.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {t("noIncoming")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
