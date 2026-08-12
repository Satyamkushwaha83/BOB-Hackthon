"use client";

import { ReactNode, useState } from "react";
import { LANG_LABEL, translate } from "@/lib/i18n";
import { UILang, User } from "@/lib/types";

export type HWSection = "queue" | "intake" | "records" | "firstaid-guide" | "doctor-consult" | "appointments";
export type DocSection = "cases" | "records" | "review" | "appointments" | "analytics";
export type SectionId = HWSection | DocSection;

interface NavItem {
  id: SectionId;
  labelKey: Parameters<typeof translate>[1];
  icon: string;
}

const HW_NAV: NavItem[] = [
  { id: "queue", labelKey: "navDashboard", icon: "📋" },
  { id: "intake", labelKey: "navNewIntake", icon: "➕" },
  { id: "records", labelKey: "navPatientRecords", icon: "🗂️" },
  { id: "firstaid-guide", labelKey: "navFirstAid", icon: "🩹" },
  { id: "doctor-consult", labelKey: "navDoctorConsult", icon: "🎥" },
  { id: "appointments", labelKey: "navAppointments", icon: "📅" },
];

const DOC_NAV: NavItem[] = [
  { id: "cases", labelKey: "navIncomingCases", icon: "📥" },
  { id: "records", labelKey: "navPatientRecords", icon: "🗂️" },
  { id: "review", labelKey: "navConsultReview", icon: "✅" },
  { id: "appointments", labelKey: "navAppointments", icon: "📅" },
  { id: "analytics", labelKey: "navAnalytics", icon: "📊" },
];

export function AppShell({
  user,
  uiLang,
  setUiLang,
  active,
  onNavigate,
  onLogout,
  children,
}: {
  user: User;
  uiLang: UILang;
  setUiLang: (l: UILang) => void;
  active: SectionId;
  onNavigate: (s: SectionId) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const nav = user.role === "doctor" ? DOC_NAV : HW_NAV;
  const activeNavBg = user.role === "doctor" ? "bg-emerald-600" : "bg-blue-600";
  const avatarBg = user.role === "doctor" ? "bg-emerald-600" : "bg-blue-600";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-2 px-4 py-4 border-b border-slate-200 ${collapsed ? "justify-center" : ""}`}>
        <span className="text-2xl shrink-0">💓</span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-slate-800 leading-tight truncate">{t("appName")}</p>
            <p className="text-[11px] text-slate-400 leading-tight truncate">{t("tagline")}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {nav.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              setMobileOpen(false);
            }}
            title={t(item.labelKey)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${collapsed ? "justify-center" : ""} ${
              active === item.id ? `${activeNavBg} text-white` : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="text-lg shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
          </button>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3 space-y-3">
        {!collapsed && (
          <div className="flex border border-slate-300 rounded-lg overflow-hidden text-xs font-semibold">
            {(["en", "hi", "mr"] as UILang[]).map((l) => (
              <button key={l} onClick={() => setUiLang(l)} className={`flex-1 px-2 py-1.5 ${uiLang === l ? "bg-blue-600 text-white" : "bg-white text-slate-500"}`}>
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>
        )}
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarBg}`}>{user.name.charAt(0)}</div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.role === "doctor" ? "⚕️" : "🩹"} {user.role === "doctor" ? user.specialization : user.clinicName}</p>
            </div>
          )}
          <button onClick={onLogout} title={t("logout")} className="text-slate-400 hover:text-red-600 shrink-0">
            ⏻
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Desktop / tablet sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 sticky top-0 h-screen transition-all ${collapsed ? "w-20" : "w-64"}`}>{sidebarContent}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-64 bg-white h-full shadow-xl">{sidebarContent}</div>
          <div className="flex-1 bg-black/30" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="md:hidden text-slate-500 text-xl">
                ☰
              </button>
              <button onClick={() => setCollapsed((c) => !c)} className="hidden md:block text-slate-400 hover:text-slate-700 text-lg" title="Toggle sidebar">
                {collapsed ? "»" : "«"}
              </button>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">⚠️ {t("disclaimerShort")}</span>
            </div>
            <div className="text-sm text-slate-500 hidden sm:block">
              {user.name} · <span className="capitalize">{user.role.replace("_", " ")}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
