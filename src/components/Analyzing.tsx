"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Reading symptom data...",
  "Checking red-flag indicators...",
  "Analysing vitals...",
  "Running triage rules...",
  "Generating structured summary...",
];

export function Analyzing() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 600);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
      <div className="text-4xl mb-4 animate-pulse">🤖</div>
      <p className="font-semibold text-slate-700 mb-3">AI is analysing intake data…</p>
      <ul className="text-sm text-slate-500 space-y-1">
        {STEPS.map((s, i) => (
          <li key={i} className={`transition-opacity duration-300 ${i <= step ? "opacity-100" : "opacity-20"}`}>
            {i < step ? "✅" : i === step ? "⏳" : "○"} {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
