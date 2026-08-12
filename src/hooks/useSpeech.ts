"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";

function noopSubscribe() {
  return () => {};
}
function getSTTSupport() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
function getSTTSupportServer() {
  return false;
}
function getTTSSupport() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
function getTTSSupportServer() {
  return false;
}

/**
 * Real (not mocked) speech-to-text via the browser's Web Speech API
 * (SpeechRecognition / webkitSpeechRecognition). Chrome and Edge support
 * this; Firefox/Safari largely don't — `supported` reflects that so callers
 * can show a graceful fallback instead of a dead button. Support detection
 * goes through useSyncExternalStore (server snapshot = false) so SSR and
 * client hydration render identically, then patch in after mount.
 */
export function useSpeechToText(lang: string) {
  const [listening, setListening] = useState(false);
  const supported = useSyncExternalStore(noopSubscribe, getSTTSupport, getSTTSupportServer);
  const recognitionRef = useRef<InstanceType<NonNullable<Window["SpeechRecognition"]>> | null>(null);

  const start = useCallback(
    (onResult: (text: string) => void) => {
      const Ctor = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;
      if (!Ctor) return false;
      const rec = new Ctor();
      rec.lang = lang;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const text = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join(" ");
        onResult(text);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
      return true;
    },
    [lang]
  );

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}

/**
 * Real (not mocked) text-to-speech via window.speechSynthesis. `speakingId`
 * lets a caller with many read-aloud buttons on one page know which specific
 * block is currently playing so only that button shows the "speaking" state.
 */
export function useTextToSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const supported = useSyncExternalStore(noopSubscribe, getTTSSupport, getTTSSupportServer);

  const speak = useCallback((text: string, lang: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.onstart = () => setSpeakingId(id);
    u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
    u.onerror = () => setSpeakingId((cur) => (cur === id ? null : cur));
    window.speechSynthesis.speak(u);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  return { speak, stop, speakingId, supported };
}
