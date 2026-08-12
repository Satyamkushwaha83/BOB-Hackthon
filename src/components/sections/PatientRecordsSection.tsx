"use client";

import { useState } from "react";
import { translate } from "@/lib/i18n";
import { Consultation, Patient, UILang } from "@/lib/types";
import { TriageBadge } from "../ui";

export function PatientRecordsSection({
  patients,
  consultations,
  uiLang,
  onOpenConsultation,
}: {
  patients: Patient[];
  consultations: Consultation[];
  uiLang: UILang;
  onOpenConsultation: (id: string) => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.phone.includes(query) ||
      (p.village || "").toLowerCase().includes(query.toLowerCase())
  );
  const selected = patients.find((p) => p.id === selectedId) || null;
  const history = selected ? consultations.filter((c) => c.patientId === selected.id).sort((a, b) => b.createdAt - a.createdAt) : [];

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-5">{t("navPatientRecords")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:col-span-1">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${t("search")}...`} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3" />
          <div className="space-y-1 max-h-[32rem] overflow-y-auto">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => setSelectedId(p.id)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${selectedId === p.id ? "bg-blue-50 border border-blue-300" : "hover:bg-slate-50 border border-transparent"}`}>
                <span className="block font-semibold text-slate-800">{p.name}</span>
                <span className="block text-xs text-slate-400">
                  {p.age}y · {p.gender}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          {!selected ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center text-slate-400 text-sm">Select a patient to view their profile and visit history.</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="font-bold text-lg text-slate-800">{selected.name}</h3>
                <p className="text-sm text-slate-500 mb-3">
                  {selected.age}y · {selected.gender} · {selected.language}
                  {selected.village && ` · ${selected.village}`}
                  {" · "}{selected.phone || "no phone"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-400 block">{t("allergies")}</span>
                    {selected.history.allergies || "None"}
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-400 block">{t("conditions")}</span>
                    {selected.history.conditions || "None"}
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-400 block">{t("medications")}</span>
                    {selected.history.medications || "None"}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h4 className="font-semibold text-slate-700 mb-3">Visit History ({history.length})</h4>
                <div className="space-y-2">
                  {history.length === 0 && <p className="text-sm text-slate-400">No visits recorded yet.</p>}
                  {history.map((c) => (
                    <button key={c.id} onClick={() => onOpenConsultation(c.id)} className="w-full flex items-center justify-between border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg px-4 py-3 text-left transition">
                      <span>
                        <span className="block text-sm font-semibold text-slate-700">{new Date(c.createdAt).toLocaleDateString()}</span>
                        <span className="block text-xs text-slate-400">{c.symptoms.structured.join(", ") || "—"}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        {c.triage && <TriageBadge level={c.triage.level} size="sm" />}
                        <span className="text-blue-600 text-sm font-semibold">→</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
