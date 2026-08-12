import { Fragment } from "react";
import { translate } from "@/lib/i18n";
import { Stage, TriageLevel, UILang } from "@/lib/types";

const LABEL_KEYS = {
  intake: "stepIntake",
  triage: "stepTriage",
  firstaid: "stepFirstAid",
  doctor: "stepDoctor",
  record: "stepRecord",
} as const;

export function Stepper({ stage, triageLevel, uiLang }: { stage: Stage; triageLevel?: TriageLevel; uiLang: UILang }) {
  const steps = ["intake", "triage", ...(triageLevel && triageLevel !== "urgent" ? ["firstaid"] : []), "doctor", "record"] as (keyof typeof LABEL_KEYS)[];
  const idx = steps.indexOf(stage === "analyzing" ? "triage" : (stage as keyof typeof LABEL_KEYS));
  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto">
      {steps.map((s, i) => (
        <Fragment key={s}>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              i === idx ? "bg-blue-600 text-white" : i < idx ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
            }`}
          >
            {i < idx ? "✓" : i + 1} {translate(uiLang, LABEL_KEYS[s])}
          </div>
          {i < steps.length - 1 && <div className={`h-0.5 w-6 ${i < idx ? "bg-emerald-300" : "bg-slate-200"}`}></div>}
        </Fragment>
      ))}
    </div>
  );
}
