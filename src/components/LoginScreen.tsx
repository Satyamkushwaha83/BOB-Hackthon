"use client";

import { useState } from "react";
import { login, USERS } from "@/lib/auth";
import { LANG_LABEL, translate } from "@/lib/i18n";
import { Role, UILang, User } from "@/lib/types";

export function LoginScreen({ uiLang, setUiLang, onLogin }: { uiLang: UILang; setUiLang: (l: UILang) => void; onLogin: (u: User) => void }) {
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);

  const submit = () => {
    if (!role) return;
    const user = login(email, password, role);
    if (!user) {
      setError(t("invalidCredentials"));
      return;
    }
    setError("");
    onLogin(user);
  };

  const demoUsers = USERS.filter((u) => u.role === role);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4">
      <div className="absolute top-4 right-4 flex border border-slate-300 rounded-lg overflow-hidden text-xs font-semibold bg-white">
        {(["en", "hi", "mr"] as UILang[]).map((l) => (
          <button key={l} onClick={() => setUiLang(l)} className={`px-3 py-1.5 ${uiLang === l ? "bg-blue-600 text-white" : "text-slate-500"}`}>
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-4xl">🏥</span>
        <div>
          <p className="text-2xl font-bold text-slate-800 leading-tight">{t("appName")}</p>
          <p className="text-sm text-slate-500 leading-tight">{t("tagline")}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-md p-8">
        {!role ? (
          <>
            <h2 className="text-lg font-bold text-slate-800 mb-1">{t("loginTitle")}</h2>
            <p className="text-sm text-slate-500 mb-6">{t("loginSubtitle")}</p>
            <div className="space-y-3">
              <button onClick={() => setRole("health_worker")} className="w-full flex items-center gap-4 border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition">
                <span className="text-3xl">🩹</span>
                <span>
                  <span className="block font-bold text-blue-700">{t("healthWorkerLogin")}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{t("healthWorkerDesc")}</span>
                </span>
              </button>
              <button onClick={() => setRole("doctor")} className="w-full flex items-center gap-4 border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl p-4 text-left transition">
                <span className="text-3xl">⚕️</span>
                <span>
                  <span className="block font-bold text-emerald-700">{t("doctorLogin")}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">{t("doctorDesc")}</span>
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => { setRole(null); setError(""); }} className="text-xs text-slate-400 hover:text-slate-600 mb-4">
              ← {t("back")}
            </button>
            <h2 className={`text-lg font-bold mb-4 ${role === "doctor" ? "text-emerald-700" : "text-blue-700"}`}>
              {role === "doctor" ? "⚕️ " + t("doctorLogin") : "🩹 " + t("healthWorkerLogin")}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">{t("email")}</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="name@clinic.demo" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">{t("password")}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="••••••••" />
              </div>
              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
              <button onClick={submit} className={`w-full font-semibold text-white rounded-lg py-2.5 ${role === "doctor" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                {t("signIn")}
              </button>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 mb-2">{t("demoAccounts")}</p>
              <div className="flex flex-wrap gap-2">
                {demoUsers.map((u) => (
                  <button key={u.id} onClick={() => { setEmail(u.email); setPassword(u.password); setError(""); }} className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-left">
                    <span className="block font-semibold text-slate-700">{u.name}</span>
                    <span className="block text-slate-400">{u.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-6 text-center max-w-md">Hackathon prototype — accounts and data are simulated in-memory, not a real user database.</p>
    </div>
  );
}
