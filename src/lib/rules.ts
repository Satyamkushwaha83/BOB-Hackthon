import { FirstAid, History, OTCItem, Patient, Symptoms, Triage, Vitals, VitalStatus } from "./types";

export const SYMPTOM_OPTIONS = [
  "Fever",
  "Cough / Cold",
  "Minor Cut / Wound",
  "Headache",
  "Diarrhea",
  "Vomiting",
  "Body Ache",
  "Skin Rash",
  "Minor Burn",
  "Weakness / Fatigue",
  "Eye Redness / Discharge",
  "Ear Pain",
  "Toothache / Mouth Pain",
  "Abdominal Pain",
  "Urinary Complaint",
];

export const RED_FLAGS = [
  { key: "confusion", label: "Confusion / Altered mental state" },
  { key: "chestPain", label: "Chest pain" },
  { key: "breathlessness", label: "Severe breathlessness" },
  { key: "heavyBleeding", label: "Heavy / uncontrolled bleeding" },
  { key: "unconscious", label: "Unconscious / unresponsive" },
  { key: "seizure", label: "Seizure / convulsions" },
  { key: "severeAbdomen", label: "Severe abdominal pain (rigid belly)" },
];

export function vitalStatus(type: "temp" | "pulse" | "spo2" | "rr", raw: string): VitalStatus {
  const v = parseFloat(raw);
  if (isNaN(v)) return "normal";
  if (type === "temp") {
    if (v >= 103) return "high";
    if (v > 99.5) return "mid";
    if (v < 95) return "low";
    return "normal";
  }
  if (type === "pulse") {
    if (v < 40 || v > 130) return "high";
    if (v < 60 || v > 100) return "mid";
    return "normal";
  }
  if (type === "spo2") {
    if (v < 90) return "high";
    if (v < 95) return "mid";
    return "normal";
  }
  if (type === "rr") {
    if (v < 10 || v > 30) return "high";
    if (v < 12 || v > 20) return "mid";
    return "normal";
  }
  return "normal";
}

export function bpStatus(bp: string): VitalStatus {
  const m = (bp || "").match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return "normal";
  const sys = parseInt(m[1]);
  const dia = parseInt(m[2]);
  if (sys > 180 || sys < 80 || dia > 120 || dia < 50) return "high";
  if (sys >= 140 || sys < 90 || dia >= 90) return "mid";
  return "normal";
}

/**
 * Returns true if the given bp string represents a hypertensive-crisis level (>= 180 systolic).
 * Used to surface a specific warning in the triage summary.
 */
export function isHypertensiveCrisis(bp: string): boolean {
  const m = (bp || "").match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return false;
  return parseInt(m[1]) >= 180 || parseInt(m[2]) >= 120;
}

export const statusColor: Record<VitalStatus, string> = {
  normal: "text-emerald-600 bg-emerald-50 border-emerald-200",
  mid: "text-amber-600 bg-amber-50 border-amber-300",
  high: "text-red-600 bg-red-50 border-red-300",
  low: "text-blue-600 bg-blue-50 border-blue-200",
};

/** Human-readable label for a VitalStatus value */
export const statusLabel: Record<VitalStatus, string> = {
  normal: "Normal",
  mid: "Borderline",
  high: "Abnormal",
  low: "Low",
};

interface TriageInput {
  vitals: Vitals;
  symptoms: Symptoms;
}

export function computeTriage(p: TriageInput): Triage {
  const temp  = parseFloat(p.vitals.temp);
  const spo2  = parseFloat(p.vitals.spo2);
  const pulse = parseFloat(p.vitals.pulse);
  const m   = (p.vitals.bp || "").match(/(\d+)\s*\/\s*(\d+)/);
  const sys = m ? parseInt(m[1]) : null;
  const dia = m ? parseInt(m[2]) : null;
  const f   = p.symptoms.flags || [];
  const s   = p.symptoms.structured || [];

  const push = (arr: string[], cond: boolean, msg: string) => { if (cond) arr.push(msg); };

  // ── EMERGENCY thresholds (from Prompt 1) ─────────────────────────
  const urgentReasons: string[] = [];
  push(urgentReasons, !isNaN(spo2) && spo2 < 92,               `SpO₂ critically low (${spo2}%)`);
  push(urgentReasons, !isNaN(temp) && temp > 105,               `Temperature dangerously high (${temp}°F)`);
  push(urgentReasons, sys !== null && sys < 90,                  `BP systolic critically low (${sys} mmHg) — possible shock`);
  push(urgentReasons, dia !== null && dia < 60,                  `BP diastolic critically low (${dia} mmHg)`);
  push(urgentReasons, !isNaN(pulse) && (pulse < 40 || pulse > 130), `Pulse critically abnormal (${pulse} bpm)`);
  push(urgentReasons, f.includes("chestPain"),                   "Chest pain reported");
  push(urgentReasons, f.includes("breathlessness"),              "Severe breathing difficulty reported");
  push(urgentReasons, f.includes("heavyBleeding"),               "Severe / uncontrolled bleeding reported");
  push(urgentReasons, f.includes("unconscious"),                 "Unconscious / not responding");
  push(urgentReasons, f.includes("seizure"),                     "Seizure / convulsions reported");
  push(urgentReasons, f.includes("severeAbdomen"),               "Severe abdominal rigidity reported");
  push(urgentReasons, f.includes("confusion") && !isNaN(temp) && temp > 103, `High fever (${temp}°F) with confusion`);

  // ── MEDIUM (amber) thresholds (from Prompt 1) ────────────────────
  const amberReasons: string[] = [];
  push(amberReasons, !isNaN(temp) && temp > 101 && temp <= 105,   `Fever present (${temp}°F)`);
  push(amberReasons, f.includes("confusion"),                     "Confusion / altered mental state");
  push(amberReasons, !isNaN(spo2) && spo2 >= 92 && spo2 < 95,   `SpO₂ mildly low (${spo2}%)`);
  push(amberReasons, !isNaN(pulse) && pulse > 100 && pulse <= 130, `Elevated pulse (${pulse} bpm)`);
  push(amberReasons, !isNaN(pulse) && pulse >= 40 && pulse < 55,  `Low pulse (${pulse} bpm)`);
  push(amberReasons, sys !== null && sys >= 140,                  `Elevated BP (${sys}/${dia} mmHg)`);
  push(amberReasons, s.includes("Weakness / Fatigue"),            "Moderate weakness reported");
  push(amberReasons, s.includes("Minor Cut / Wound"),             "Wound — monitor for infection (swelling/redness/discharge)");
  push(amberReasons, s.includes("Vomiting") || s.includes("Diarrhea"), "Vomiting / diarrhea — assess for dehydration");

  if (urgentReasons.length > 0) return { level: "urgent", reasons: urgentReasons };
  if (amberReasons.length > 0)  return { level: "amber",  reasons: amberReasons  };
  return { level: "routine", reasons: ["All vitals within normal range; symptoms consistent with a minor/routine condition."] };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT 1 — AI Triage Summary (for health worker)
// ─────────────────────────────────────────────────────────────────────────────

export interface TriageSummaryInput {
  patient: Patient;
  vitals: Vitals;
  symptoms: Symptoms;
  triage: Triage;
  triageOverride?: { level: string; reason: string } | null;
}

function yn(val: boolean) { return val ? "Yes" : "No"; }
function chk(val: boolean) { return val ? "✅" : "❌"; }

export function buildTriageSummary(input: TriageSummaryInput): string {
  const { patient, vitals, symptoms, triage, triageOverride } = input;
  const level = triageOverride ? triageOverride.level : triage.level;

  const badge =
    level === "urgent" ? "🔴 Emergency Risk" :
    level === "amber"  ? "🟡 Medium Risk"    : "🟢 Low Risk";

  const temp  = parseFloat(vitals.temp);
  const spo2  = parseFloat(vitals.spo2);
  const pulse = parseFloat(vitals.pulse);
  const f     = symptoms.flags || [];
  const s     = symptoms.structured || [];

  // Parse duration for "fever > 2 days" check
  const durText = (symptoms.duration || "").toLowerCase();
  const durationDays = durText.includes("day") ? parseInt(durText) || 0 : 0;

  // Safety checklist booleans
  const tempOk      = isNaN(temp)  || temp <= 105;
  const spo2Ok      = isNaN(spo2)  || spo2 >= 92;
  const noBreathing = !f.includes("breathlessness");
  const noChest     = !f.includes("chestPain");
  const conscious   = !f.includes("unconscious");
  const noBleeding  = !f.includes("heavyBleeding");
  const noSeizure   = !f.includes("seizure");

  const hasFever    = !isNaN(temp) && temp > 101;
  const hasWeakness = s.includes("Weakness / Fatigue");
  const hasWound    = s.includes("Minor Cut / Wound");

  // Medical history parsing
  const cond = (patient.history.conditions || "").toLowerCase();
  const hasDM   = cond.includes("diabet");
  const hasHTN  = cond.includes("hypertens") || cond.includes("bp") || cond.includes("blood pressure");
  const hasHeart= cond.includes("heart") || cond.includes("cardiac");
  const hasAsthma= cond.includes("asthma") || cond.includes("copd");
  const hasPreg = cond.includes("pregnan");

  // Assessment text
  const assessmentLines: string[] = [];
  if (level === "urgent") {
    assessmentLines.push(`This case has been classified as Emergency Risk due to one or more life-threatening signs.`);
    assessmentLines.push(`Reason(s): ${triage.reasons.join("; ")}.`);
    assessmentLines.push(`The patient requires immediate hospital referral — do not delay.`);
    assessmentLines.push(`Apply basic stabilisation measures while arranging emergency transfer.`);
  } else if (level === "amber") {
    assessmentLines.push(`This case is classified as Medium Risk — no immediate emergency signs, but clinical attention is needed.`);
    assessmentLines.push(`Notable findings: ${triage.reasons.join("; ")}.`);
    if (hasFever && durationDays >= 2) assessmentLines.push(`Fever has been present for ${durationDays}+ days, which warrants further investigation.`);
    assessmentLines.push(`A remote doctor consultation is recommended to review and guide further management.`);
    assessmentLines.push(`Monitor vitals closely and reassess if any deterioration occurs.`);
  } else {
    assessmentLines.push(`This case is classified as Low Risk — vitals are within normal range and no red-flag symptoms are present.`);
    assessmentLines.push(`The presenting symptoms appear consistent with a minor or self-limiting condition.`);
    assessmentLines.push(`Provide appropriate first-aid guidance, ensure hydration and rest, and advise return if symptoms worsen.`);
    assessmentLines.push(`Routine review is recommended within 2–3 days if symptoms persist.`);
  }

  // First-aid guidance
  const firstAidLines: string[] = [];
  if (level === "urgent") {
    firstAidLines.push("• Keep patient in a safe, comfortable position (recovery position if unconscious).");
    firstAidLines.push("• Do NOT give food or water by mouth if unconscious or having seizures.");
    firstAidLines.push("• Apply firm pressure to any bleeding wound.");
    firstAidLines.push("• Keep the patient warm and reassure them.");
    firstAidLines.push("• Contact emergency services and arrange immediate hospital transfer.");
  } else {
    firstAidLines.push("• Ensure rest in a cool, well-ventilated area.");
    if (hasFever) firstAidLines.push("• Apply a damp tepid cloth on forehead. Give Paracetamol 500mg every 6–8 hrs if temp > 101°F.");
    firstAidLines.push("• Encourage oral fluids — water or ORS (1 packet per 1L clean water).");
    if (hasWound) firstAidLines.push("• Clean wound with clean water, apply antiseptic, and cover with a sterile dressing.");
    firstAidLines.push("• Record vitals every 4–6 hours and note any changes.");
    firstAidLines.push("• If any new emergency sign appears, escalate immediately.");
  }

  const escalation =
    level === "urgent" ? "🔴 Emergency Risk → Immediate hospital referral" :
    level === "amber"  ? "🟡 Medium Risk → Doctor consultation required"   :
                         "🟢 Low Risk → Basic care and routine review";

  return [
    `## TRIAGE SUMMARY`,
    ``,
    `**Risk Level:** ${badge}`,
    ``,
    `### Vital Signs`,
    `- Temperature: ${vitals.temp || "—"} °F`,
    `- Blood Pressure: ${vitals.bp || "—"}`,
    `- Pulse: ${vitals.pulse || "—"} bpm`,
    `- SpO₂: ${vitals.spo2 || "—"} %`,
    ``,
    `### Safety Checklist`,
    `- [${chk(tempOk)}] Temperature ≤ 105°F`,
    `- [${chk(spo2Ok)}] SpO₂ ≥ 92%`,
    `- [${chk(noBreathing)}] No severe breathing difficulty`,
    `- [${chk(noChest)}] No chest pain`,
    `- [${chk(conscious)}] Patient conscious and responsive`,
    `- [${chk(noBleeding)}] No severe bleeding`,
    `- [${chk(noSeizure)}] No seizure`,
    ``,
    `### Symptoms`,
    `- Fever: ${yn(hasFever)}`,
    `- Weakness: ${yn(hasWeakness)}`,
    `- Injury/Wound: ${yn(hasWound)}`,
    `- Duration: ${symptoms.duration || "—"}`,
    ``,
    `### Medical History`,
    `- Diabetes: ${yn(hasDM)}`,
    `- Hypertension: ${yn(hasHTN)}`,
    `- Heart disease: ${yn(hasHeart)}`,
    `- Asthma/COPD: ${yn(hasAsthma)}`,
    `- Pregnancy: ${yn(hasPreg)}`,
    ``,
    `### AI Preliminary Assessment`,
    ...assessmentLines,
    ``,
    `### Immediate First-Aid Guidance`,
    ...firstAidLines,
    ``,
    `### Escalation`,
    `${escalation}`,
    ``,
    `---`,
    `*AI-generated triage and summary. Final medical decision must be made by the licensed doctor.*`,
  ].join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT 2 — Doctor Handover Summary (sent to remote doctor)
// ─────────────────────────────────────────────────────────────────────────────

export function buildDoctorHandover(input: TriageSummaryInput): string {
  const { patient, vitals, symptoms, triage, triageOverride } = input;
  const level = triageOverride ? triageOverride.level : triage.level;

  const badge =
    level === "urgent" ? "🔴 Emergency Risk" :
    level === "amber"  ? "🟡 Medium Risk"    : "🟢 Low Risk";

  const temp  = parseFloat(vitals.temp);
  const spo2  = parseFloat(vitals.spo2);
  const pulse = parseFloat(vitals.pulse);
  const bpM   = (vitals.bp || "").match(/(\d+)\s*\/\s*(\d+)/);
  const sys   = bpM ? parseInt(bpM[1]) : NaN;
  const f     = symptoms.flags || [];
  const s     = symptoms.structured || [];

  const cond  = (patient.history.conditions || "").toLowerCase();
  const allg  = (patient.history.allergies  || "").toLowerCase();

  // Vital sign status emojis (Prompt 2 thresholds)
  const tempSt  = isNaN(temp)  ? "—" : temp > 105           ? "❌" : "✅";
  const bpSt    = isNaN(sys)   ? "—" : (sys < 90)           ? "❌" : "✅";
  const pulseSt = isNaN(pulse) ? "—" : (pulse > 120 || pulse < 45) ? "❌" : "✅";
  const spo2St  = isNaN(spo2)  ? "—" : spo2 < 92            ? "❌" : "✅";

  // Chief complaint
  const chiefComplaint = (s.join(", ") || "Unspecified") +
    (symptoms.duration ? ` — ${symptoms.duration}` : "");

  // Symptom checklist
  const symptomList = [
    ["Fever",               !isNaN(temp) && temp > 101],
    ["Weakness",            s.includes("Weakness / Fatigue")],
    ["Cough",               s.includes("Cough / Cold")],
    ["Breathing difficulty",f.includes("breathlessness")],
    ["Chest pain",          f.includes("chestPain")],
    ["Vomiting",            s.includes("Vomiting")],
    ["Diarrhea",            s.includes("Diarrhea")],
    ["Minor injury",        s.includes("Minor Cut / Wound")],
    ["Swelling/redness",    f.includes("severeAbdomen") || s.includes("Minor Cut / Wound")],
    ["Bleeding",            f.includes("heavyBleeding")],
  ] as [string, boolean][];

  // History checklist
  const historyList = [
    ["Diabetes",          cond.includes("diabet")],
    ["Hypertension",      cond.includes("hypertens") || cond.includes("blood pressure")],
    ["Heart disease",     cond.includes("heart") || cond.includes("cardiac")],
    ["Asthma/COPD",       cond.includes("asthma") || cond.includes("copd")],
    ["Pregnancy",         cond.includes("pregnan")],
    ["Allergy to medicines", allg.length > 0],
  ] as [string, boolean][];

  // Clinical summary
  const summaryLines: string[] = [];
  summaryLines.push(`Patient ${patient.name}, ${patient.age} years old, ${patient.gender.toLowerCase()}, presenting with ${chiefComplaint}.`);
  summaryLines.push(`Vitals: Temp ${vitals.temp}°F, BP ${vitals.bp}, Pulse ${vitals.pulse} bpm, SpO₂ ${vitals.spo2}%.`);
  if (triage.reasons.length) summaryLines.push(`AI triage flags: ${triage.reasons.join("; ")}.`);
  if (patient.history.conditions) summaryLines.push(`Medical history: ${patient.history.conditions}.`);
  if (patient.history.medications) summaryLines.push(`Current medications: ${patient.history.medications}.`);
  if (symptoms.freeText) summaryLines.push(`Additional notes: ${symptoms.freeText}.`);

  // Actions taken (infer from data available)
  const actionsTaken = [
    ["Temperature recorded", !!vitals.temp],
    ["BP recorded",          !!vitals.bp],
    ["Pulse recorded",       !!vitals.pulse],
    ["SpO₂ recorded",        !!vitals.spo2],
    ["Wound cleaned",        s.includes("Minor Cut / Wound")],
    ["Dressing applied",     s.includes("Minor Cut / Wound")],
    ["Hydration advised",    s.includes("Diarrhea") || s.includes("Vomiting") || (!isNaN(temp) && temp > 101)],
    ["Patient monitored",    true],
  ] as [string, boolean][];

  // Recommended next step
  const nextStep =
    level === "urgent" ? "☑ Immediate emergency referral" :
    level === "amber"  ? "☑ Priority consultation"        :
                         "☑ Routine review";

  return [
    `# REMOTE DOCTOR HANDOVER`,
    ``,
    `## Risk Level`,
    badge,
    ``,
    `## Patient Snapshot`,
    `- Name: ${patient.name}`,
    `- Age: ${patient.age}`,
    `- Sex: ${patient.gender}`,
    `- Preferred Language: ${patient.language || "—"}`,
    ``,
    `## Chief Complaint`,
    chiefComplaint,
    ``,
    `## Duration`,
    symptoms.duration || "—",
    ``,
    `## Vital Signs`,
    `| Parameter     | Value          | Status |`,
    `|---------------|----------------|--------|`,
    `| Temperature   | ${vitals.temp || "—"} °F      | ${tempSt}     |`,
    `| Blood Pressure| ${vitals.bp   || "—"}         | ${bpSt}      |`,
    `| Pulse         | ${vitals.pulse || "—"} bpm    | ${pulseSt}   |`,
    `| SpO₂          | ${vitals.spo2 || "—"} %       | ${spo2St}    |`,
    ``,
    `## Symptoms`,
    ...symptomList.map(([label, present]) => `- [${present ? "x" : " "}] ${label}`),
    ``,
    `## Medical History`,
    ...historyList.map(([label, present]) => `- [${present ? "x" : " "}] ${label}`),
    ``,
    `## Wound / Image Review`,
    s.includes("Minor Cut / Wound")
      ? "Wound reported — image upload field available in intake form. Clean and dressed by health worker."
      : "No wound or image reported.",
    ``,
    `## AI Structured Summary`,
    ...summaryLines,
    ``,
    `## Actions Already Taken`,
    ...actionsTaken.map(([label, done]) => `- [${done ? "x" : " "}] ${label}`),
    ``,
    `## Recommended Next Step`,
    nextStep,
    ``,
    `---`,
    `**AI-generated triage and summary. Final medical decision must be made by the licensed doctor.**`,
  ].join("\n");
}

/**
 * The fixed, low-risk condition set for BOTH the consultation-flow first-aid
 * step (getFirstAid) and the dedicated First-Aid & Medicine Guide reference
 * module. `matchLabel` ties a condition to a SYMPTOM_OPTIONS checkbox so the
 * AI-flow can auto-select relevant guidance from intake symptoms.
 */
export interface ConditionEntry {
  id: string;
  matchLabel: string;
  steps: string[];
  otc: OTCItem[];
  dangerSigns: string[];
  contraindications: string[];
}

export const CONDITION_LIBRARY: ConditionEntry[] = [
  {
    id: "fever",
    matchLabel: "Fever",
    steps: [
      "Encourage rest and plenty of fluids (water, ORS, coconut water).",
      "Use a damp cloth (tepid, not cold) on the forehead to help bring temperature down.",
      "Keep the patient in light clothing in a well-ventilated room.",
      "Re-check temperature every 4-6 hours and log it.",
      "If fever crosses 103°F, or lasts more than 3 days, or new symptoms appear — escalate to doctor immediately.",
    ],
    otc: [
      { name: "Paracetamol 500mg", adultDose: "1 tablet every 6-8 hrs after food", childDose: "10-15mg/kg every 6-8 hrs (weight-based, doctor to confirm)", category: "antipyretic", minAge: 2 },
      { name: "Oral Rehydration Solution (ORS)", adultDose: "1 packet in 1L clean water, sip through the day", childDose: "Small frequent sips, per WHO ORS chart", category: "hydration", minAge: 0 },
    ],
    dangerSigns: ["Fever above 103°F (39.4°C) not responding to medicine", "Fever lasting more than 3 days", "Fever with rash, stiff neck, or repeated vomiting", "Convulsions or altered consciousness"],
    contraindications: ["Do not give Paracetamol if patient has severe liver disease", "Avoid Aspirin in children/teens (Reye's syndrome risk)"],
  },
  {
    id: "cut",
    matchLabel: "Minor Cut / Wound",
    steps: [
      "Wash your hands before touching the wound.",
      "Rinse the cut gently under clean running water to remove dirt.",
      "Apply mild antiseptic (e.g., povidone-iodine) around the wound.",
      "Cover with a sterile gauze / clean cloth (patti) and bandage — not too tight.",
      "Change the dressing once daily, or immediately if it becomes wet or dirty.",
      "Watch for redness, swelling, warmth, pus or fever over the next 2-3 days — these are infection signs.",
    ],
    otc: [
      { name: "Antiseptic solution (Povidone-Iodine)", adultDose: "Apply thin layer 2x/day on cleaned wound", childDose: "Same, adult supervision required", category: "topical", minAge: 0 },
      { name: "Paracetamol (pain relief, if needed)", adultDose: "500mg, up to 3x/day after food", childDose: "10-15mg/kg, doctor to confirm", category: "analgesic", minAge: 2 },
    ],
    dangerSigns: ["Bleeding that does not stop after 10 minutes of firm pressure", "Wound is deep, gaping, or exposes fat/muscle/bone", "Signs of infection: spreading redness, pus, warmth, fever", "Wound from a rusty/dirty object and no recent tetanus vaccine"],
    contraindications: ["Do not apply turmeric, oil, or ash to an open wound", "Avoid tight bandaging that cuts circulation"],
  },
  {
    id: "headache",
    matchLabel: "Headache",
    steps: [
      "Have the patient rest in a quiet, dimly lit room.",
      "Ensure adequate hydration — offer water or ORS.",
      "A cold compress on the forehead can ease discomfort.",
      "Ask about screen time, sleep, and meal timing — simple triggers are common.",
      "If headache is sudden, severe ('worst ever'), or with vomiting/vision changes — escalate to doctor immediately.",
    ],
    otc: [{ name: "Paracetamol 500mg", adultDose: "1 tablet every 6-8 hrs after food, max 3/day", childDose: "10-15mg/kg, doctor to confirm", category: "analgesic", minAge: 2 }],
    dangerSigns: ["Sudden, severe 'worst-ever' headache", "Headache with fever and stiff neck", "Headache after a head injury", "Headache with blurred vision, confusion, or weakness on one side"],
    contraindications: ["Avoid frequent daily use of painkillers without doctor review (overuse headache)"],
  },
  {
    id: "burn",
    matchLabel: "Minor Burn",
    steps: [
      "Cool the burn under clean running water for 10-15 minutes. Do NOT use ice.",
      "Do not apply toothpaste, oil or turmeric — these can worsen the injury.",
      "Cover loosely with a sterile non-stick dressing.",
      "Do not burst any blisters that have formed.",
      "Give paracetamol for pain if needed, and monitor for infection over the next 2-3 days.",
    ],
    otc: [
      { name: "Silver sulfadiazine cream", adultDose: "Thin layer on burn 1x/day (health-worker applied)", childDose: "Doctor to confirm before use", category: "topical", minAge: 2 },
      { name: "Paracetamol (pain relief, if needed)", adultDose: "500mg, up to 3x/day after food", childDose: "10-15mg/kg, doctor to confirm", category: "analgesic", minAge: 2 },
    ],
    dangerSigns: ["Burn is larger than the patient's palm", "Burn on face, hands, feet, or genitals", "Skin is white, charred, or leathery (deep burn)", "Burn from electricity or chemicals"],
    contraindications: ["Never apply ice directly — can worsen tissue damage", "Do not apply home remedies (oil, turmeric, toothpaste) on broken skin"],
  },
  {
    id: "cold",
    matchLabel: "Cough / Cold",
    steps: [
      "Steam inhalation twice a day can ease congestion.",
      "Warm fluids (soup, warm water with honey) soothe the throat.",
      "Rest and avoid cold drinks / exposure to dust or smoke.",
      "Salt-water gargles can help with a sore throat (adults/older children).",
      "If cough persists beyond a week, or breathing difficulty develops — escalate to doctor.",
    ],
    otc: [
      { name: "Cetirizine 10mg", adultDose: "1 tablet at night for up to 5 days", childDose: "5mg (half tablet), doctor to confirm", category: "antihistamine", minAge: 6 },
      { name: "Honey & warm water", adultDose: "As needed, home remedy", childDose: "Avoid honey under 12 months age", category: "home-remedy", minAge: 1 },
    ],
    dangerSigns: ["Difficulty breathing or fast breathing", "Bluish lips or face", "Cough with high fever for more than 3 days", "Chest pain with cough"],
    contraindications: ["Do not give honey to infants under 1 year (botulism risk)", "Avoid cough suppressants in children under 6 without doctor advice"],
  },
  {
    id: "diarrhea",
    matchLabel: "Diarrhea",
    steps: [
      "Give ORS (Oral Rehydration Solution) — 1 packet per litre of clean water, sip frequently.",
      "Continue feeding — do NOT fast the patient, especially children.",
      "Wash hands with soap before preparing food or ORS.",
      "Watch for signs of dehydration: sunken eyes, dry mouth, no urine for 6+ hours.",
      "If stools contain blood or mucus, or dehydration worsens — escalate to doctor immediately.",
    ],
    otc: [
      { name: "Oral Rehydration Solution (ORS)", adultDose: "1 packet in 1L water, sip throughout the day", childDose: "Small frequent sips; follow WHO ORS chart", category: "hydration", minAge: 0 },
      { name: "Zinc sulfate 20mg (children 6m–5y)", adultDose: "Not applicable", childDose: "20mg/day for 14 days — reduces duration and recurrence", category: "supplement", minAge: 0 },
    ],
    dangerSigns: ["Watery stool > 10 times a day", "Blood or mucus in stool", "Unable to keep any fluid down", "Signs of severe dehydration: sunken fontanelle (infants), extreme weakness"],
    contraindications: ["Do not give anti-diarrhoeals (Loperamide) to children under 12 without doctor advice"],
  },
  {
    id: "eye",
    matchLabel: "Eye Redness / Discharge",
    steps: [
      "Do NOT rub the eye — this can worsen irritation or spread infection.",
      "Wash hands thoroughly before touching near the eye.",
      "Gently clean discharge with a clean, wet cloth (from inner to outer corner).",
      "If caused by a chemical splash — rinse with clean water for 15 minutes and refer immediately.",
      "If vision is affected, refer to doctor urgently.",
    ],
    otc: [
      { name: "Normal saline (0.9%) eye drops", adultDose: "1-2 drops every 4-6 hrs to irrigate", childDose: "Same, with adult supervision", category: "topical", minAge: 0 },
    ],
    dangerSigns: ["Sudden loss of vision", "Severe eye pain", "Eye injury or foreign body not removable", "Chemical in eye"],
    contraindications: ["Do not apply any oil or home remedy into the eye", "Avoid sharing eye drops (infection risk)"],
  },
  {
    id: "ear-pain",
    matchLabel: "Ear Pain",
    steps: [
      "Have the patient tilt their head to let any water drain out.",
      "A warm (not hot) cloth held against the outer ear can ease pain.",
      "Do NOT insert any object into the ear canal.",
      "If there is discharge from the ear, do NOT block it — refer to doctor.",
    ],
    otc: [
      { name: "Paracetamol 500mg (pain relief)", adultDose: "500mg every 6-8 hrs after food", childDose: "10-15mg/kg, doctor to confirm", category: "analgesic", minAge: 2 },
    ],
    dangerSigns: ["Discharge from the ear (especially if smelly or bloody)", "Sudden hearing loss", "Severe pain unrelieved by paracetamol", "Swelling or redness behind the ear"],
    contraindications: ["Do not put oil, drops or any liquid in the ear without doctor advice — may worsen perforation"],
  },
  {
    id: "abdominal-pain",
    matchLabel: "Abdominal Pain",
    steps: [
      "Help the patient rest in a comfortable position.",
      "Encourage small sips of water if nausea is not present.",
      "Do NOT give strong painkillers or antispasmodics without doctor advice.",
      "Note the location, severity and whether pain is constant or crampy.",
      "If pain is severe, worsening, or belly is rigid — escalate to doctor immediately.",
    ],
    otc: [],
    dangerSigns: ["Rigid/board-like abdomen", "Pain with fever and vomiting", "Pain after injury to abdomen", "Pain in a pregnant woman"],
    contraindications: ["Avoid strong analgesics or NSAIDs before the cause is known — can mask serious conditions"],
  },
];

export function getFirstAid(patient: { symptoms: Symptoms }): FirstAid {
  const chosen = CONDITION_LIBRARY.filter((c) => patient.symptoms.structured.includes(c.matchLabel));
  const list = chosen.length ? chosen : null;
  const steps: string[] = [];
  const otcMap = new Map<string, OTCItem>();
  if (list) {
    list.forEach((entry) => {
      entry.steps.forEach((s) => {
        if (!steps.includes(s)) steps.push(s);
      });
      entry.otc.forEach((o) => otcMap.set(o.name, o));
    });
  } else {
    steps.push(
      "Keep the patient comfortable, hydrated and resting.",
      "Monitor vitals every few hours and record changes.",
      "Reassess if any new or worsening symptom appears.",
      "When in doubt, escalate to the remote doctor rather than guessing."
    );
  }
  return { steps, otc: Array.from(otcMap.values()) };
}

export function checkOTCSafety(item: OTCItem, patient: { age: string; history: History }): string[] {
  const issues: string[] = [];
  const allergies = (patient.history.allergies || "").toLowerCase();
  const nameLower = item.name.toLowerCase();
  if (allergies) {
    const allergyTerms = allergies
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    allergyTerms.forEach((term) => {
      if (term.length > 2 && nameLower.includes(term)) issues.push(`Possible allergy conflict: patient reports allergy to "${term}"`);
    });
    if (nameLower.includes("penicillin") || nameLower.includes("amoxicillin")) {
      if (allergyTerms.some((t) => t.includes("penicillin"))) issues.push("Penicillin-family allergy on record — DO NOT administer.");
    }
  }
  const age = parseInt(patient.age);
  if (!isNaN(age) && item.minAge && age < item.minAge) issues.push(`Age-based caution: patient is ${age}y, item generally recommended for ${item.minAge}+ years`);
  if (nameLower.includes("aspirin") && !isNaN(age) && age < 18) issues.push("Aspirin not advised for under-18 (Reye's syndrome risk).");
  return issues;
}
