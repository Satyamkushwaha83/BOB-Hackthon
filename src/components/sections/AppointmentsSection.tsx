"use client";

import { useState } from "react";
import { translate } from "@/lib/i18n";
import { isoDateOffset } from "@/lib/dates";
import { Appointment, AppointmentStatus, AppointmentUrgency, Patient, UILang, User } from "@/lib/types";
import { MicButton } from "../ui";

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  requested: "bg-slate-100 text-slate-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const URGENCY_COLOR: Record<AppointmentUrgency, string> = {
  routine: "bg-emerald-50 text-emerald-700 border-emerald-200",
  priority: "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

export function AppointmentsSection({
  appointments,
  patients,
  doctorsList,
  currentUser,
  uiLang,
  onCreate,
  onUpdateStatus,
}: {
  appointments: Appointment[];
  patients: Patient[];
  doctorsList: User[];
  currentUser: User;
  uiLang: UILang;
  onCreate: (data: Omit<Appointment, "id" | "createdAt" | "status">) => void;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);
  const isDoctor = currentUser.role === "doctor";

  const [patientId, setPatientId] = useState(patients[0]?.id || "");
  const [doctorId, setDoctorId] = useState(doctorsList[0]?.id || "");
  const [date, setDate] = useState(() => isoDateOffset(1));
  const [time, setTime] = useState("10:00");
  const [urgency, setUrgency] = useState<AppointmentUrgency>("routine");
  const [notes, setNotes] = useState("");

  const mine = isDoctor ? appointments.filter((a) => a.doctorId === currentUser.id) : appointments.filter((a) => a.healthWorkerId === currentUser.id);
  const sorted = [...mine].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const submit = () => {
    if (!patientId || !doctorId) return;
    onCreate({ patientId, healthWorkerId: currentUser.id, doctorId, date, time, urgency, notes });
    setNotes("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h2 className="text-2xl font-bold text-slate-800">{t("appointmentsTitle")}</h2>

      {!isDoctor && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">{t("bookAppointment")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("selectPatient")}</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("selectDoctor")}</label>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {doctorsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialization}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("date")}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("time")}</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">{t("urgencyLabel")}</label>
              <select value={urgency} onChange={(e) => setUrgency(e.target.value as AppointmentUrgency)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="routine">{t("routine")}</option>
                <option value="priority">{t("doctorReview")}</option>
                <option value="urgent">{t("urgent")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{t("notes")}</label>
            <div className="flex gap-2 mt-1">
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <MicButton lang={uiLang} onResult={(txt) => setNotes((p) => (p ? p + " " : "") + txt)} />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={submit} disabled={!patientId || !doctorId} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold px-6 py-2.5 rounded-lg">
              {t("requestAppointment")}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4">{isDoctor ? t("navAppointments") : "My Requests"}</h3>
        {sorted.length === 0 && <p className="text-sm text-slate-400">{t("noAppointments")}</p>}
        <div className="space-y-2">
          {sorted.map((a) => {
            const p = patients.find((pt) => pt.id === a.patientId);
            const doctor = doctorsList.find((d) => d.id === a.doctorId);
            return (
              <div key={a.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{p?.name || "Unknown patient"}</p>
                  <p className="text-xs text-slate-400">
                    {a.date} · {a.time} · {isDoctor ? `by ${p?.name}` : `with ${doctor?.name}`}
                  </p>
                  {a.notes && <p className="text-xs text-slate-500 mt-1">{a.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${URGENCY_COLOR[a.urgency]}`}>{a.urgency}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[a.status]}`}>{t(a.status as Parameters<typeof translate>[1])}</span>
                  {isDoctor && a.status === "requested" && (
                    <button onClick={() => onUpdateStatus(a.id, "confirmed")} className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg">
                      {t("confirm")}
                    </button>
                  )}
                  {isDoctor && a.status === "confirmed" && (
                    <button onClick={() => onUpdateStatus(a.id, "completed")} className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg">
                      {t("markCompleted")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
