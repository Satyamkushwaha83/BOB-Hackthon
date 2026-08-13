"use client";

import { useState } from "react";
import { translate } from "@/lib/i18n";
import { buildDoctorHandover, buildTriageSummary, bpStatus, statusColor, vitalStatus } from "@/lib/rules";
import { Consultation, Patient, TriageLevel, UILang } from "@/lib/types";
import { AITag, DisclaimerBar, SpeakButton, TriageBadge } from "../ui";

// ── Simple markdown → HTML renderer (bold, headings, lists, tables, hr) ──────
function MdBlock({ text }: { text: string }) {
  const html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // Headings
    .replace(/^# (.+)$/gm,  '<h1 class="text-xl font-bold text-slate-800 mt-4 mb-1">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-slate-700 mt-3 mb-1 border-b border-slate-200 pb-0.5">$2</h2>')
    .replace(/^### (.+)$/gm,'<h3 class="text-sm font-bold text-slate-600 mt-3 mb-1 uppercase tracking-wide">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em class="text-slate-500 text-xs">$1</em>')
    // Emoji risk badges on their own line
    .replace(/^(🔴[^\n]+)$/gm, '<p class="font-bold text-red-600 text-base my-1">$1</p>')
    .replace(/^(🟡[^\n]+)$/gm, '<p class="font-bold text-amber-600 text-base my-1">$1</p>')
    .replace(/^(🟢[^\n]+)$/gm, '<p class="font-bold text-emerald-600 text-base my-1">$1</p>')
    // Tables — simple pipe-delimited
    .replace(/^\|(.+)\|$/gm, (row) => {
      const cells = row.split("|").slice(1,-1);
      const isHeader = false;
      const tds = cells.map(c => `<td class="px-3 py-1.5 border border-slate-200 text-sm">${c.trim()}</td>`).join("");
      return `<tr>${tds}</tr>`;
    })
    .replace(/(<tr>[\s\S]*?<\/tr>)/g, (rows) =>
      `<table class="w-full border-collapse my-2 text-sm">${rows}</table>`
    )
    // Separator rows (---|---) → skip
    .replace(/<tr>(<td[^>]*>\s*-+\s*<\/td>)+<\/tr>/g, "")
    // Checklist items
    .replace(/^- \[✅\] (.+)$/gm, '<li class="flex gap-2 text-sm text-emerald-700"><span>✅</span><span>$1</span></li>')
    .replace(/^- \[❌\] (.+)$/gm, '<li class="flex gap-2 text-sm text-red-600"><span>❌</span><span>$1</span></li>')
    .replace(/^- \[x\] (.+)$/gm,  '<li class="flex gap-2 text-sm text-blue-700"><span>☑</span><span>$1</span></li>')
    .replace(/^- \[ \] (.+)$/gm,  '<li class="flex gap-2 text-sm text-slate-400"><span>☐</span><span>$1</span></li>')
    // Plain list items
    .replace(/^- (.+)$/gm, '<li class="text-sm text-slate-700 ml-4 list-disc">$1</li>')
    .replace(/^• (.+)$/gm, '<li class="text-sm text-slate-700 ml-4 list-disc">$1</li>')
    // Bullet lists wrapped
    .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (block) => `<ul class="space-y-0.5 my-1">${block}</ul>`)
    // HR
    .replace(/^---$/gm, '<hr class="my-3 border-slate-200"/>')
    // Remaining plain paragraphs
    .replace(/^(?!<)(.+)$/gm, '<p class="text-sm text-slate-700 my-0.5">$1</p>')
    // Remove blank lines inside lists
    .replace(/<\/ul>\n<ul[^>]*>/g, "");

  return (
    <div
      className="prose-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Copy-to-clipboard helper ──────────────────────────────────────────────────
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition"
    >
      {copied ? "✅ Copied!" : `📋 ${label}`}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function SummaryTriageScreen({
  patient,
  consultation,
  updateConsultation,
  uiLang,
  onProceedFirstAid,
  onProceedDoctor,
}: {
  patient: Patient;
  consultation: Consultation;
  updateConsultation: (mutator: (draft: Consultation) => void) => void;
  uiLang: UILang;
  onProceedFirstAid: () => void;
  onProceedDoctor: () => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const [overrideOpen, setOverrideOpen]   = useState(false);
  const [overrideLevel, setOverrideLevel] = useState<TriageLevel>(consultation.triage!.level);
  const [overrideReason, setOverrideReason] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "worker" | "doctor">("summary");

  const effLevel = consultation.triageOverride
    ? consultation.triageOverride.level
    : consultation.triage!.level;

  const chiefComplaint =
    (consultation.symptoms.structured.join(", ") || "Unspecified") +
    (consultation.symptoms.duration ? ` (${consultation.symptoms.duration})` : "");

  const vitalsSummary = [
    { label: "Temp",  val: consultation.vitals.temp + "°F",    st: vitalStatus("temp",  consultation.vitals.temp)  },
    { label: "BP",    val: consultation.vitals.bp,              st: bpStatus(consultation.vitals.bp)                },
    { label: "Pulse", val: consultation.vitals.pulse + " bpm",  st: vitalStatus("pulse", consultation.vitals.pulse) },
    { label: "SpO₂",  val: consultation.vitals.spo2 + "%",      st: vitalStatus("spo2",  consultation.vitals.spo2)  },
  ];

  const summaryText = `Chief complaint: ${chiefComplaint}. Vitals — Temp ${consultation.vitals.temp}F, BP ${consultation.vitals.bp}, Pulse ${consultation.vitals.pulse}, SpO2 ${consultation.vitals.spo2}%. Triage: ${effLevel}.`;

  // Build both structured reports
  const summaryInput = {
    patient,
    vitals:        consultation.vitals,
    symptoms:      consultation.symptoms,
    triage:        consultation.triage!,
    triageOverride: consultation.triageOverride,
  };
  const workerReport = buildTriageSummary(summaryInput);
  const doctorReport = buildDoctorHandover(summaryInput);

  const applyOverride = () => {
    updateConsultation((d) => {
      d.triageOverride = {
        level:  overrideLevel,
        reason: overrideReason || "No reason given",
        by:     "Health Worker (on-site)",
        at:     Date.now(),
      };
    });
    setOverrideOpen(false);
  };

  const TAB_CLS = (id: typeof activeTab) =>
    `px-4 py-2 text-sm font-semibold rounded-t-lg border border-b-0 transition ${
      activeTab === id
        ? "bg-white border-slate-200 text-blue-700 -mb-px"
        : "bg-slate-50 border-transparent text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="space-y-5">
      <DisclaimerBar lang={uiLang} />

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-slate-200">
        <button className={TAB_CLS("summary")} onClick={() => setActiveTab("summary")}>
          📋 {t("aiSummaryTitle").split("—")[0].trim()}
        </button>
        <button className={TAB_CLS("worker")} onClick={() => setActiveTab("worker")}>
          🩺 Triage Report
        </button>
        <button className={TAB_CLS("doctor")} onClick={() => setActiveTab("doctor")}>
          🧑‍⚕️ Doctor Handover
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1 — Original AI Summary card (existing UI preserved)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "summary" && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">📋 {t("aiSummaryTitle")}</h3>
              <div className="flex items-center gap-2">
                <AITag />
                <SpeakButton text={summaryText} lang={uiLang} id={`summary-${consultation.id}`} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t("chiefComplaintLabel")}</p>
                <p className="text-slate-700 mb-4">{chiefComplaint}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t("freeTextNotes")}</p>
                <p className="text-slate-600 text-sm mb-4">{consultation.symptoms.freeText || "—"}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t("relevantHistory")}</p>
                <ul className="text-sm text-slate-600 list-disc list-inside space-y-0.5">
                  <li>{t("allergies")}: {patient.history.allergies || "None recorded"}</li>
                  <li>{t("conditions")}: {patient.history.conditions || "None recorded"}</li>
                  <li>{t("medications")}: {patient.history.medications || "None recorded"}</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{t("vitalsStatus")}</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {vitalsSummary.map((v) => (
                    <div key={v.label} className={`border rounded-lg px-3 py-2 text-sm font-semibold ${statusColor[v.st]}`}>
                      {v.label}: {v.val}
                    </div>
                  ))}
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t("riskFlags")}</p>
                <ul className="text-sm space-y-1">
                  {consultation.triage!.reasons.map((r, i) => (
                    <li key={i} className="flex gap-1.5"><span>•</span><span className="text-slate-600">{r}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Triage decision + override */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <h3 className="font-bold text-lg text-slate-800">🚨 {t("triageTitle")}</h3>
              <AITag />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <TriageBadge level={effLevel} />
              {consultation.triageOverride && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  Overridden from AI ({consultation.triage!.level}) by {consultation.triageOverride.by}
                </span>
              )}
              <button onClick={() => setOverrideOpen((o) => !o)} className="text-xs text-blue-600 hover:underline font-semibold ml-auto">
                {t("humanOverride")}
              </button>
            </div>
            {overrideOpen && (
              <div className="mt-4 border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-xs text-slate-500 mb-2">A health worker can always override the AI triage decision. This is logged in the patient record.</p>
                <div className="flex gap-3 items-center flex-wrap">
                  <select value={overrideLevel} onChange={(e) => setOverrideLevel(e.target.value as TriageLevel)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm">
                    <option value="urgent">Urgent</option>
                    <option value="amber">Needs Doctor Review</option>
                    <option value="routine">Routine</option>
                  </select>
                  <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Reason for override" className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-1.5 text-sm" />
                  <button onClick={applyOverride} className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg font-semibold">{t("save")}</button>
                </div>
              </div>
            )}
            <div className="mt-5 flex gap-3 flex-wrap">
              {effLevel === "urgent" ? (
                <button onClick={onProceedDoctor} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg shadow-sm animate-pulse">
                  🚑 {t("connectDoctorNow")}
                </button>
              ) : (
                <>
                  <button onClick={onProceedFirstAid} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg">
                    🩹 {t("proceedFirstAid")}
                  </button>
                  <button onClick={onProceedDoctor} className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold px-5 py-2.5 rounded-lg">
                    🧑‍⚕️ {t("escalateDoctor")}
                  </button>
                </>
              )}
            </div>
            {effLevel === "urgent" && <p className="text-xs text-red-500 mt-3">🚫 {t("hiddenUrgent")}</p>}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2 — Triage Report (Prompt 1 output)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "worker" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-lg">🩺</span>
              <h3 className="font-bold text-slate-800">AI Triage Report — Health Worker</h3>
              <AITag />
            </div>
            <div className="flex gap-2">
              <CopyButton text={workerReport} label="Copy Report" />
              <button onClick={() => window.print()} className="text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition">
                🖨️ Print
              </button>
            </div>
          </div>
          <div className="p-6">
            <MdBlock text={workerReport} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3 — Doctor Handover (Prompt 2 output)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "doctor" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧑‍⚕️</span>
              <h3 className="font-bold text-slate-800">Remote Doctor Handover</h3>
              <AITag />
            </div>
            <div className="flex gap-2">
              <CopyButton text={doctorReport} label="Copy Handover" />
              <button onClick={() => window.print()} className="text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition">
                🖨️ Print
              </button>
            </div>
          </div>
          <div className="p-6">
            <MdBlock text={doctorReport} />
          </div>
          <div className="px-6 pb-6 flex gap-3 flex-wrap border-t border-slate-100 pt-4">
            <button onClick={onProceedDoctor} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm">
              🧑‍⚕️ {t("escalateDoctor")}
            </button>
            {effLevel === "urgent" && (
              <button onClick={onProceedDoctor} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm animate-pulse">
                🚑 {t("connectDoctorNow")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
