"use client";

import { useRef, useState } from "react";
import { translate } from "@/lib/i18n";
import { Consultation, Patient, UILang } from "@/lib/types";
import { RED_FLAGS, SYMPTOM_OPTIONS, bpStatus, statusColor, vitalStatus } from "@/lib/rules";
import { MicButton } from "../ui";

export function VisitIntakeForm({
  patient,
  updatePatient,
  consultation,
  updateConsultation,
  uiLang,
  onSubmit,
}: {
  patient: Patient;
  updatePatient: (mutator: (draft: Patient) => void) => void;
  consultation: Consultation;
  updateConsultation: (mutator: (draft: Consultation) => void) => void;
  uiLang: UILang;
  onSubmit: () => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const toggleSymptom = (s: string) => {
    updateConsultation((d) => {
      d.symptoms.structured = d.symptoms.structured.includes(s) ? d.symptoms.structured.filter((x) => x !== s) : [...d.symptoms.structured, s];
    });
  };
  const toggleFlag = (k: string) => {
    updateConsultation((d) => {
      d.symptoms.flags = d.symptoms.flags.includes(k) ? d.symptoms.flags.filter((x) => x !== k) : [...d.symptoms.flags, k];
    });
  };
  const simulateOCR = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setTimeout(() => {
      updateConsultation((d) => {
        d.uploads.prescriptionText = `[OCR Extracted from "${file.name}"]\nRx: Paracetamol 500mg — 1 tab TID x3 days\nCetirizine 10mg — 1 tab HS x5 days\nDr. R. Sharma, ${new Date().toLocaleDateString()}`;
      });
      setOcrLoading(false);
    }, 1300);
  };
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateConsultation((d) => {
      d.uploads.photoUrl = url;
    });
  };

  const canSubmit = consultation.symptoms.structured.length > 0 || Boolean(consultation.symptoms.freeText);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <h3 className="font-bold text-lg text-slate-800">
        👤 {patient.name} <span className="text-sm font-normal text-slate-400">· {patient.age}y · {patient.gender}</span>
      </h3>

      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-2">{t("symptomsLabel")}</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {SYMPTOM_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                consultation.symptoms.structured.includes(s) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-start">
          <textarea
            value={consultation.symptoms.freeText}
            onChange={(e) => updateConsultation((d) => { d.symptoms.freeText = e.target.value; })}
            rows={2}
            placeholder="Describe symptoms in patient's own words..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <MicButton lang={uiLang} onResult={(text) => updateConsultation((d) => { d.symptoms.freeText = (d.symptoms.freeText ? d.symptoms.freeText + " " : "") + text; })} />
        </div>
        <div className="mt-2">
          <label className="text-xs font-semibold text-slate-500">{t("duration")}</label>
          <input
            value={consultation.symptoms.duration}
            onChange={(e) => updateConsultation((d) => { d.symptoms.duration = e.target.value; })}
            placeholder="e.g. 2 days"
            className="mt-1 w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <label className="text-xs font-semibold text-red-700 block mb-2">⚠️ {t("redFlagCheck")}</label>
        <div className="flex flex-wrap gap-3">
          {RED_FLAGS.map((f) => (
            <label key={f.key} className="flex items-center gap-1.5 text-xs text-red-700">
              <input type="checkbox" checked={consultation.symptoms.flags.includes(f.key)} onChange={() => toggleFlag(f.key)} /> {f.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-2">{t("vitalsLabel")}</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              { key: "temp", label: "Temperature (°F)", ph: "98.6" },
              { key: "bp", label: "Blood Pressure (mmHg)", ph: "120/80" },
              { key: "pulse", label: "Pulse (bpm)", ph: "72" },
              { key: "spo2", label: "SpO2 (%)", ph: "98" },
            ] as const
          ).map((v) => {
            const raw = consultation.vitals[v.key];
            const st = v.key === "bp" ? bpStatus(raw) : vitalStatus(v.key, raw);
            return (
              <div key={v.key}>
                <label className="text-xs text-slate-500">{v.label}</label>
                <input
                  value={raw}
                  onChange={(e) => updateConsultation((d) => { d.vitals[v.key] = e.target.value; })}
                  placeholder={v.ph}
                  className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm font-semibold ${statusColor[st]}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500">{t("allergies")}</label>
          <input value={patient.history.allergies} onChange={(e) => updatePatient((d) => { d.history.allergies = e.target.value; })} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Penicillin, None known" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">{t("conditions")}</label>
          <input value={patient.history.conditions} onChange={(e) => updatePatient((d) => { d.history.conditions = e.target.value; })} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Diabetes, Hypertension" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500">{t("medications")}</label>
          <input value={patient.history.medications} onChange={(e) => updatePatient((d) => { d.history.medications = e.target.value; })} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Metformin 500mg" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 mb-2">📄 {t("uploadPrescription")}</p>
          <input ref={fileRef} type="file" onChange={simulateOCR} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
            {t("choosFile")}
          </button>
          {ocrLoading && <p className="text-xs text-blue-500 mt-2 animate-pulse">🔎 Extracting text (OCR)...</p>}
          {consultation.uploads.prescriptionText && <pre className="mt-2 text-left text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 whitespace-pre-wrap">{consultation.uploads.prescriptionText}</pre>}
        </div>
        <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 mb-2">📷 {t("uploadPhoto")}</p>
          <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          <button onClick={() => photoRef.current?.click()} className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
            {t("choosePhoto")}
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {consultation.uploads.photoUrl && <img src={consultation.uploads.photoUrl} alt="Uploaded injury/symptom" className="mt-2 h-24 mx-auto rounded-lg object-cover border border-slate-200" />}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button disabled={!canSubmit} onClick={onSubmit} className={`px-6 py-2.5 rounded-lg font-semibold text-white transition ${canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"}`}>
          {t("generateSummary")}
        </button>
      </div>
    </div>
  );
}
