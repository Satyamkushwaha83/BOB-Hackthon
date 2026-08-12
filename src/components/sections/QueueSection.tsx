"use client";

import { translate } from "@/lib/i18n";
import { Consultation, Patient, TriageLevel, UILang } from "@/lib/types";
import { useNow } from "@/lib/useNow";
import { TriageBadge } from "../ui";

const RANK: Record<TriageLevel, number> = { urgent: 0, amber: 1, routine: 2 };

export function QueueSection({
  patients,
  consultations,
  uiLang,
  onOpen,
  onNew,
}: {
  patients: Patient[];
  consultations: Consultation[];
  uiLang: UILang;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const patientOf = (id: string) => patients.find((p) => p.id === id);

  const sorted = [...consultations].sort((a, b) => {
    const la = a.triage ? RANK[a.triage.level] : 3;
    const lb = b.triage ? RANK[b.triage.level] : 3;
    if (la !== lb) return la - lb;
    return a.createdAt - b.createdAt;
  });

  const now = useNow();
  const waitMins = (c: Consultation) => (now === 0 ? null : Math.max(0, Math.round((now - c.createdAt) / 60000)));

  const STATUS_LABEL: Record<Consultation["status"], string> = {
    "waiting-worker": "Waiting — Health Worker",
    "waiting-doctor": "Waiting — Doctor",
    done: t("completed"),
  };
  const STATUS_COLOR: Record<Consultation["status"], string> = {
    "waiting-worker": "bg-slate-100 text-slate-700",
    "waiting-doctor": "bg-blue-100 text-blue-700",
    done: "bg-emerald-100 text-emerald-700",
  };

  const totalPatients = new Set(consultations.map((c) => c.patientId)).size;

  const stats = [
    { label: t("urgent"), n: consultations.filter((c) => c.triage?.level === "urgent").length, color: "bg-red-600" },
    { label: t("doctorReview"), n: consultations.filter((c) => c.triage?.level === "amber").length, color: "bg-amber-500" },
    { label: t("routine"), n: consultations.filter((c) => c.triage?.level === "routine").length, color: "bg-emerald-600" },
    { label: t("completedToday"), n: consultations.filter((c) => c.status === "done").length, color: "bg-slate-500" },
    { label: "Total Patients", n: totalPatients, color: "bg-blue-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t("queueTitle")}</h2>
          <p className="text-slate-500 text-sm">{consultations.length} · sorted by clinical urgency</p>
        </div>
        <button onClick={onNew} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm transition">
          {t("newPatientBtn")}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${c.color}`}></span>
              <span className="text-sm text-slate-500">{c.label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{c.n}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("patient")}</th>
              <th className="px-4 py-3 font-medium">{t("chiefComplaint")}</th>
              <th className="px-4 py-3 font-medium">{t("triage")}</th>
              <th className="px-4 py-3 font-medium">{t("waitTime")}</th>
              <th className="px-4 py-3 font-medium">{t("status")}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const p = patientOf(c.patientId);
              if (!p) return null;
              return (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{p.name}</div>
                    <div className="text-slate-400 text-xs">
                      {p.age}y · {p.gender} · {p.language}
                      {p.village && ` · ${p.village}`}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{c.symptoms.structured.join(", ") || "—"}</td>
                  <td className="px-4 py-3">{c.triage ? <TriageBadge level={c.triage.level} size="sm" /> : <span className="text-slate-400 text-xs">Pending</span>}</td>
                  <td className="px-4 py-3 text-slate-600">{waitMins(c) === null ? "—" : `${waitMins(c)} min`}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onOpen(c.id)} className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                      {c.status === "done" ? t("viewRecord") : t("resume")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
