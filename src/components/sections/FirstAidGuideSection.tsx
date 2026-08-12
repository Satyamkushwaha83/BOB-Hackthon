"use client";

import { useState } from "react";
import { GUIDE_CONTENT, translate } from "@/lib/i18n";
import { CONDITION_LIBRARY } from "@/lib/rules";
import { UILang } from "@/lib/types";
import { MicButton, SpeakButton } from "../ui";

export function FirstAidGuideSection({ uiLang }: { uiLang: UILang }) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(CONDITION_LIBRARY[0].id);
  const [ack, setAck] = useState<Record<string, boolean>>({});

  const guide = GUIDE_CONTENT[uiLang];
  const items = CONDITION_LIBRARY.filter((c) => (guide[c.id]?.title || c.matchLabel).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t("firstAidGuideTitle")}</h2>
        <p className="text-slate-500 text-sm">{t("firstAidGuideSubtitle")}</p>
      </div>

      <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-lg px-4 py-2.5 text-sm flex items-start gap-2">
        <span>⚠️</span>
        <b>{t("notSubstitute")}</b>
      </div>

      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${t("search")}...`} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <MicButton lang={uiLang} onResult={(txt) => setQuery(txt)} />
      </div>

      <div className="space-y-3">
        {items.map((c) => {
          const content = guide[c.id];
          const isOpen = openId === c.id;
          const stepsText = content.steps.join(". ");
          const acknowledged = !!ack[c.id];
          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button onClick={() => setOpenId(isOpen ? null : c.id)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="font-bold text-slate-800">{content.title}</span>
                <span className="text-slate-400">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase">{t("careSteps")}</p>
                      <SpeakButton text={stepsText} lang={uiLang} id={`guide-${c.id}`} />
                    </div>
                    <ol className="space-y-2">
                      {content.steps.map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-700">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">{i + 1}</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase mb-2 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">{t("standardDosage")}</p>
                    <div className="space-y-2 mt-1">
                      {c.otc.map((o) => (
                        <div key={o.name} className="border border-slate-200 rounded-lg p-3 text-sm">
                          <p className="font-semibold text-slate-800">{o.name}</p>
                          <p className="text-slate-600">
                            {t("adultDose")}: {o.adultDose}
                          </p>
                          <p className="text-slate-600">
                            {t("childDose")}: {o.childDose}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">{t("safetyChecks")}</p>
                    <ul className="text-sm text-slate-600 list-disc list-inside space-y-0.5">
                      {c.contraindications.map((ci, i) => (
                        <li key={i}>{ci}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                    <p className="text-sm font-bold text-red-700 mb-2">🚩 {t("dangerSigns")}</p>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-0.5">
                      {content.dangerSigns.map((ds, i) => (
                        <li key={i}>{ds}</li>
                      ))}
                    </ul>
                  </div>

                  <label className="flex items-center gap-2 text-sm bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 cursor-pointer">
                    <input type="checkbox" checked={acknowledged} onChange={(e) => setAck((prev) => ({ ...prev, [c.id]: e.target.checked }))} />
                    <span className="text-slate-700">{t("ackLabel")}</span>
                  </label>

                  <div className={`flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-2.5 ${acknowledged ? "bg-emerald-50 text-emerald-700 border border-emerald-300" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                    {acknowledged ? "✅" : "🔒"} {acknowledged ? t("actionable") : t("reviewRequired")}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
