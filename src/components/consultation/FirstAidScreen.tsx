"use client";

import { translate } from "@/lib/i18n";
import { Consultation, OTCDecision, Patient, UILang } from "@/lib/types";
import { checkOTCSafety } from "@/lib/rules";
import { AITag, DisclaimerBar, SpeakButton } from "../ui";

export function FirstAidScreen({
  patient,
  consultation,
  updateConsultation,
  uiLang,
  onFinalize,
  onEscalate,
}: {
  patient: Patient;
  consultation: Consultation;
  updateConsultation: (mutator: (draft: Consultation) => void) => void;
  uiLang: UILang;
  onFinalize: () => void;
  onEscalate: () => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const fa = consultation.firstAid!;
  const decide = (name: string, decision: OTCDecision) => {
    updateConsultation((d) => {
      d.otcDecisions[name] = decision;
    });
  };
  const stepsText = fa.steps.join(". ");
  const allDecided = fa.otc.every((o) => consultation.otcDecisions[o.name]);

  return (
    <div className="space-y-5">
      <DisclaimerBar lang={uiLang} />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg text-slate-800">🩹 {t("firstAidTitle")}</h3>
          <div className="flex items-center gap-2">
            <AITag />
            <SpeakButton text={stepsText} lang={uiLang} id={`fa-steps-${consultation.id}`} />
          </div>
        </div>
        <ol className="space-y-2">
          {fa.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {fa.otc.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-slate-800">💊 {t("otcSuggestions")}</h3>
            <AITag />
          </div>
          <p className="text-xs text-slate-500 mb-4">{t("otcApprovalNote")}</p>
          <div className="space-y-3">
            {fa.otc.map((o) => {
              const issues = checkOTCSafety(o, patient);
              const decision = consultation.otcDecisions[o.name];
              return (
                <div key={o.name} className={`border rounded-lg p-4 ${issues.length ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{o.name}</p>
                      <p className="text-sm text-slate-500">
                        {t("adultDose")}: {o.adultDose}
                      </p>
                      <p className="text-sm text-slate-500">
                        {t("childDose")}: {o.childDose}
                      </p>
                      {issues.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {issues.map((iss, i) => (
                            <li key={i} className="text-xs text-red-700 font-semibold flex gap-1">
                              <span>⚠️</span>
                              {iss}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {decision === "approved" && <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full">✅ Approved by Dr. Anita Verma</span>}
                      {decision === "rejected" && <span className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-full">❌ Rejected by Dr. Anita Verma</span>}
                      {!decision && (
                        <>
                          <span className="text-xs text-slate-400 mr-1 italic">{t("awaitingDoctor")}</span>
                          <button onClick={() => decide(o.name, "approved")} className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg">
                            {t("doctorApprove")}
                          </button>
                          <button onClick={() => decide(o.name, "rejected")} className="text-xs font-semibold bg-white border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg">
                            {t("doctorReject")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">In production this approval arrives asynchronously from the remote doctor via the Doctor Connect module — simulated here for demo purposes.</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button onClick={onEscalate} className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold px-5 py-2.5 rounded-lg">
          🧑‍⚕️ {t("escalateFull")}
        </button>
        <button
          disabled={fa.otc.length > 0 && !allDecided}
          onClick={onFinalize}
          className={`font-semibold px-6 py-2.5 rounded-lg text-white ${fa.otc.length === 0 || allDecided ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300 cursor-not-allowed"}`}
        >
          {t("finalizeVisit")}
        </button>
      </div>
    </div>
  );
}
