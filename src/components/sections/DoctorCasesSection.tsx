"use client";

import { translate } from "@/lib/i18n";
import { Appointment, AppointmentStatus, AppointmentUrgency, Consultation, Patient, TriageLevel, UILang } from "@/lib/types";

// ── Risk helpers ────────────────────────────────────────────────────────────

const RISK_ORDER: Record<"urgent" | "priority" | "routine", number> = { urgent: 0, priority: 1, routine: 2 };

function triageToUrgency(level: TriageLevel | undefined): AppointmentUrgency {
  if (level === "urgent") return "urgent";
  if (level === "amber") return "priority";
  return "routine";
}

const RISK_DOT: Record<AppointmentUrgency, string> = {
  urgent: "🔴",
  priority: "🟡",
  routine: "🟢",
};

const RISK_LABEL: Record<AppointmentUrgency, string> = {
  urgent: "Emergency",
  priority: "Medium",
  routine: "Low",
};

const RISK_ROW_BORDER: Record<AppointmentUrgency, string> = {
  urgent: "border-red-300 bg-red-50",
  priority: "border-amber-300 bg-amber-50",
  routine: "border-slate-200 bg-white",
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  requested: "Waiting",
  confirmed: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_CHIP: Record<AppointmentStatus, string> = {
  requested: "bg-slate-100 text-slate-600",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-500",
};

// ── Unified queue row type ───────────────────────────────────────────────────

interface QueueRow {
  key: string;
  patient: Patient | undefined;
  symptoms: string;
  risk: AppointmentUrgency;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: number;
  /** set when backed by a consultation */
  consultationId: string | null;
  /** set when backed by an appointment */
  appointmentId: string | null;
}

// ── Component ────────────────────────────────────────────────────────────────

export function DoctorCasesSection({
  consultations,
  appointments,
  patients,
  uiLang,
  onOpenConsultation,
  onUpdateAppointmentStatus,
}: {
  consultations: Consultation[];
  appointments: Appointment[];
  patients: Patient[];
  uiLang: UILang;
  onOpenConsultation: (id: string) => void;
  onUpdateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
}) {
  const t = (k: Parameters<typeof translate>[1]) => translate(uiLang, k);

  // Build unified rows from appointments (booked slots)
  const apptRows: QueueRow[] = appointments
    .filter((a) => a.status !== "cancelled")
    .map((a) => {
      const patient = patients.find((p) => p.id === a.patientId);
      // Try to find a linked consultation for symptoms
      const linked = consultations.find((c) => c.appointmentId === a.id || c.patientId === a.patientId);
      return {
        key: `appt-${a.id}`,
        patient,
        symptoms: linked?.symptoms.structured.join(", ") || a.notes || "—",
        risk: a.urgency,
        date: a.date,
        time: a.time,
        status: a.status,
        createdAt: a.createdAt,
        consultationId: linked?.id ?? null,
        appointmentId: a.id,
      };
    });

  // Add live escalation consultations not already covered by an appointment
  const apptPatientIds = new Set(apptRows.map((r) => r.patient?.id));
  const consultRows: QueueRow[] = consultations
    .filter((c) => c.status === "waiting-doctor" && !apptPatientIds.has(c.patientId))
    .map((c) => {
      const patient = patients.find((p) => p.id === c.patientId);
      const risk = triageToUrgency(c.triageOverride?.level ?? c.triage?.level);
      return {
        key: `consult-${c.id}`,
        patient,
        symptoms: c.symptoms.structured.join(", ") || "—",
        risk,
        date: new Date(c.createdAt).toISOString().slice(0, 10),
        time: new Date(c.createdAt).toTimeString().slice(0, 5),
        status: "confirmed" as AppointmentStatus,
        createdAt: c.createdAt,
        consultationId: c.id,
        appointmentId: null,
      };
    });

  // Merge + sort: urgent → priority → routine, then oldest first
  const all: QueueRow[] = [...apptRows, ...consultRows].sort((a, b) => {
    const riskDiff = RISK_ORDER[a.risk] - RISK_ORDER[b.risk];
    if (riskDiff !== 0) return riskDiff;
    return a.createdAt - b.createdAt;
  });

  const pending = all.filter((r) => r.status !== "completed" && r.status !== "cancelled");
  const done = all.filter((r) => r.status === "completed");

  const Row = ({ row }: { row: QueueRow }) => (
    <div className={`rounded-xl border px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 transition ${RISK_ROW_BORDER[row.risk]}`}>
      {/* Patient info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base">{RISK_DOT[row.risk]}</span>
          <span className="font-bold text-slate-800 text-sm">{row.patient?.name ?? "Unknown"}</span>
          <span className="text-xs text-slate-500">{row.patient?.age ? `${row.patient.age}y` : ""}{row.patient?.village ? ` · ${row.patient.village}` : ""}</span>
        </div>
        <p className="text-xs text-slate-500 truncate">
          <span className="font-semibold text-slate-600">Symptoms:</span> {row.symptoms}
        </p>
        <p className="text-xs text-slate-400">
          🗓 {row.date} · {row.time}
        </p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
          row.risk === "urgent" ? "bg-red-100 text-red-700 border-red-300" :
          row.risk === "priority" ? "bg-amber-100 text-amber-700 border-amber-300" :
          "bg-emerald-100 text-emerald-700 border-emerald-300"
        }`}>
          {RISK_DOT[row.risk]} {RISK_LABEL[row.risk]}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CHIP[row.status]}`}>
          {STATUS_LABEL[row.status]}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 shrink-0">
        {row.consultationId && (
          <button
            onClick={() => onOpenConsultation(row.consultationId!)}
            className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg"
          >
            {row.status === "confirmed" ? "▶ Start Consultation" : "👁 View Patient"}
          </button>
        )}
        {!row.consultationId && (
          <span className="text-xs text-slate-400 italic">No active consultation</span>
        )}
        {row.appointmentId && row.status === "requested" && (
          <button
            onClick={() => onUpdateAppointmentStatus(row.appointmentId!, "confirmed")}
            className="text-xs font-semibold bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg"
          >
            ✓ Confirm
          </button>
        )}
        {row.appointmentId && row.status === "confirmed" && (
          <button
            onClick={() => onUpdateAppointmentStatus(row.appointmentId!, "completed")}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg"
          >
            ✅ Complete
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">📥 {t("navIncomingCases")}</h2>
          <p className="text-sm text-slate-500 mt-0.5">All appointments + live escalations · sorted by risk then time</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full font-semibold">
            🔴 {all.filter((r) => r.risk === "urgent" && r.status !== "completed").length} Emergency
          </span>
          <span className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full font-semibold">
            🟡 {all.filter((r) => r.risk === "priority" && r.status !== "completed").length} Medium
          </span>
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full font-semibold">
            🟢 {all.filter((r) => r.risk === "routine" && r.status !== "completed").length} Low
          </span>
        </div>
      </div>

      {/* Pending queue */}
      <div className="space-y-3">
        {pending.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <p className="text-3xl mb-2">🎉</p>
            <p className="font-semibold">All clear — no pending appointments</p>
          </div>
        )}
        {pending.map((row) => <Row key={row.key} row={row} />)}
      </div>

      {/* Completed today */}
      {done.length > 0 && (
        <details className="bg-white rounded-xl border border-slate-200 p-4">
          <summary className="text-sm font-semibold text-slate-500 cursor-pointer select-none">
            ✅ Completed ({done.length})
          </summary>
          <div className="mt-3 space-y-2">
            {done.map((row) => <Row key={row.key} row={row} />)}
          </div>
        </details>
      )}
    </div>
  );
}
