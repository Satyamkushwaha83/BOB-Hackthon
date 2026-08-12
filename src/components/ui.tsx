"use client";

import { SPEECH_LOCALE, translate } from "@/lib/i18n";
import { TriageLevel, UILang } from "@/lib/types";
import { useSpeechToText, useTextToSpeech } from "@/hooks/useSpeech";

export function AITag() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-300">
      ✨ AI-GENERATED
    </span>
  );
}

export function DoctorTag() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300">
      🩺 DOCTOR-CONFIRMED
    </span>
  );
}

export function DisclaimerBar({ lang, compact }: { lang: UILang; compact?: boolean }) {
  return (
    <div className={"flex items-start gap-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg " + (compact ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm")}>
      <span>⚠️</span>
      <div>
        <b>{translate(lang, "disclaimerShort")}.</b> {!compact && translate(lang, "disclaimerLong")}
      </div>
    </div>
  );
}

const TRIAGE_MAP: Record<TriageLevel, { bg: string; text: string; icon: string }> = {
  urgent: { bg: "bg-red-600", text: "URGENT — Refer to Hospital Immediately", icon: "🔴" },
  amber: { bg: "bg-amber-500", text: "Needs Remote Doctor Review", icon: "🟠" },
  routine: { bg: "bg-emerald-600", text: "Routine — Manageable at Health Centre", icon: "🟢" },
};

export function TriageBadge({ level, size }: { level: TriageLevel; size?: "sm" }) {
  const c = TRIAGE_MAP[level] || TRIAGE_MAP.routine;
  const sz = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-4 py-2";
  return (
    <span className={`inline-flex items-center gap-2 ${c.bg} text-white font-bold rounded-full ${sz}`}>
      {c.icon} {c.text}
    </span>
  );
}

/** Real STT via Web Speech API. Drop next to any text input/textarea. */
export function MicButton({ lang, onResult, size = "md" }: { lang: UILang; onResult: (text: string) => void; size?: "sm" | "md" }) {
  const { listening, supported, start, stop } = useSpeechToText(SPEECH_LOCALE[lang]);
  const dim = size === "sm" ? "text-sm px-2 py-1" : "text-sm px-3 py-2";

  if (!supported) {
    return (
      <span title={translate(lang, "notSupportedMic")} className={`shrink-0 border border-slate-200 rounded-lg text-slate-300 ${dim} cursor-not-allowed`}>
        🎤
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start(onResult))}
      title={translate(lang, "micSpeak")}
      className={`shrink-0 border rounded-lg font-medium transition ${dim} ${listening ? "bg-red-50 border-red-300 text-red-600 animate-pulse" : "bg-slate-50 border-slate-300 text-slate-600 hover:border-blue-400"}`}
    >
      {listening ? translate(lang, "listening") : "🎤"}
    </button>
  );
}

/** Real TTS via window.speechSynthesis. `id` scopes the "speaking" indicator to this button. */
export function SpeakButton({ text, lang, id }: { text: string; lang: UILang; id: string }) {
  const { speak, stop, speakingId, supported } = useTextToSpeech();
  const isSpeaking = speakingId === id;

  if (!supported) {
    return (
      <span title={translate(lang, "notSupportedSpeak")} className="text-slate-300">
        🔊
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => (isSpeaking ? stop() : speak(text, SPEECH_LOCALE[lang], id))}
      title={translate(lang, "speak")}
      className={`inline-flex items-center gap-1 text-xs transition ${isSpeaking ? "text-blue-600 animate-pulse" : "text-slate-500 hover:text-blue-600"}`}
    >
      {isSpeaking ? "🔊" : "🔈"} {isSpeaking && translate(lang, "speaking")}
    </button>
  );
}
