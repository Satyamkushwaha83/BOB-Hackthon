"use client";

import { useState } from "react";
import { translate } from "@/lib/i18n";
import { Patient, UILang } from "@/lib/types";
import { MicButton } from "../ui";

export function NewIntakeSection({
  patients,
  uiLang,
  onSelectExisting,
  onRegisterNew,
}: {
  patients: Patient[];
  uiLang: UILang;
  onSelectExisting: (patientId: string) => void;
  onRegisterNew: (data: Omit<Patient, "id" | "createdAt" | "createdBy">) => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const [mode, setMode] = useState<"select" | "register">("select");
  const [query, setQuery] = useState("");

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [language, setLanguage] = useState("Hindi");
  const [phone, setPhone] = useState("");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.phone.includes(query));

  const canRegister = name.trim() && age.trim();

  const submitRegister = () => {
    onRegisterNew({
      name,
      age,
      gender,
      language,
      phone,
      history: { allergies, conditions, medications },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h2 className="text-2xl font-bold text-slate-800">{t("intakeTitle")}</h2>

      <div className="flex gap-2">
        <button onClick={() => setMode("select")} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold border ${mode === "select" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300"}`}>
          {t("selectExisting")}
        </button>
        <button onClick={() => setMode("register")} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold border ${mode === "register" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300"}`}>
          {t("registerNew")}
        </button>
      </div>

      {mode === "select" ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${t("search")}...`} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4" />
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.length === 0 && <p className="text-sm text-slate-400">No patients found.</p>}
            {filtered.map((p) => (
              <button key={p.id} onClick={() => onSelectExisting(p.id)} className="w-full flex items-center justify-between border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg px-4 py-3 text-left transition">
                <span>
                  <span className="block font-semibold text-slate-800">{p.name}</span>
                  <span className="block text-xs text-slate-400">
                    {p.age}y · {p.gender} · {p.phone || "no phone"}
                  </span>
                </span>
                <span className="text-blue-600 text-sm font-semibold">→</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("name")}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("age")}</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("gender")}</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("preferredLanguage")}</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option>Hindi</option>
                <option>English</option>
                <option>Marathi</option>
                <option>Regional (Other)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{t("phone")}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="+91 ..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("allergies")}</label>
              <div className="flex gap-2 mt-1">
                <input value={allergies} onChange={(e) => setAllergies(e.target.value)} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <MicButton lang={uiLang} onResult={(txt) => setAllergies((p) => (p ? p + ", " : "") + txt)} size="sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("conditions")}</label>
              <div className="flex gap-2 mt-1">
                <input value={conditions} onChange={(e) => setConditions(e.target.value)} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <MicButton lang={uiLang} onResult={(txt) => setConditions((p) => (p ? p + ", " : "") + txt)} size="sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("medications")}</label>
              <div className="flex gap-2 mt-1">
                <input value={medications} onChange={(e) => setMedications(e.target.value)} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <MicButton lang={uiLang} onResult={(txt) => setMedications((p) => (p ? p + ", " : "") + txt)} size="sm" />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button disabled={!canRegister} onClick={submitRegister} className={`px-6 py-2.5 rounded-lg font-semibold text-white transition ${canRegister ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"}`}>
              {t("continueToVisit")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
