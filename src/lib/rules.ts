import { FirstAid, History, OTCItem, Symptoms, Triage, Vitals, VitalStatus } from "./types";

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

export function vitalStatus(type: "temp" | "pulse" | "spo2", raw: string): VitalStatus {
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
  return "normal";
}

export function bpStatus(bp: string): VitalStatus {
  const m = (bp || "").match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return "normal";
  const sys = parseInt(m[1]);
  const dia = parseInt(m[2]);
  if (sys > 180 || sys < 90 || dia > 120 || dia < 60) return "high";
  if (sys >= 140 || sys < 100 || dia >= 90) return "mid";
  return "normal";
}

export const statusColor: Record<VitalStatus, string> = {
  normal: "text-emerald-600 bg-emerald-50 border-emerald-200",
  mid: "text-amber-600 bg-amber-50 border-amber-300",
  high: "text-red-600 bg-red-50 border-red-300",
  low: "text-amber-600 bg-amber-50 border-amber-300",
};

interface TriageInput {
  vitals: Vitals;
  symptoms: Symptoms;
}

export function computeTriage(p: TriageInput): Triage {
  const temp = parseFloat(p.vitals.temp);
  const spo2 = parseFloat(p.vitals.spo2);
  const pulse = parseFloat(p.vitals.pulse);
  const m = (p.vitals.bp || "").match(/(\d+)\s*\/\s*(\d+)/);
  const sys = m ? parseInt(m[1]) : null;
  const dia = m ? parseInt(m[2]) : null;
  const f = p.symptoms.flags || [];

  const urgentReasons: string[] = [];
  const push = (arr: string[], cond: boolean, msg: string) => {
    if (cond) arr.push(msg);
  };

  push(urgentReasons, !isNaN(spo2) && spo2 < 90, `SpO2 critically low (${spo2}%)`);
  push(urgentReasons, !isNaN(temp) && temp >= 104 && f.includes("confusion"), `High fever (${temp}°F) with confusion`);
  push(urgentReasons, sys !== null && (sys > 180 || sys < 90), `BP systolic extreme (${sys} mmHg)`);
  push(urgentReasons, dia !== null && (dia > 120 || dia < 60), `BP diastolic extreme (${dia} mmHg)`);
  push(urgentReasons, !isNaN(pulse) && (pulse < 40 || pulse > 130), `Pulse abnormal (${pulse} bpm)`);
  push(urgentReasons, f.includes("chestPain"), "Chest pain reported");
  push(urgentReasons, f.includes("breathlessness"), "Severe breathlessness reported");
  push(urgentReasons, f.includes("heavyBleeding"), "Heavy / uncontrolled bleeding reported");
  push(urgentReasons, f.includes("unconscious"), "Unconscious / unresponsive");
  push(urgentReasons, f.includes("seizure"), "Seizure / convulsions reported");
  push(urgentReasons, f.includes("severeAbdomen"), "Severe abdominal rigidity reported");

  const amberReasons: string[] = [];
  push(amberReasons, f.includes("confusion"), "Confusion / altered mental state reported");
  push(amberReasons, !isNaN(spo2) && spo2 >= 90 && spo2 < 95, `SpO2 mildly low (${spo2}%)`);
  push(amberReasons, !isNaN(temp) && temp >= 102 && temp < 104, `Moderate-high fever (${temp}°F)`);
  push(amberReasons, sys !== null && ((sys >= 140 && sys <= 180) || (sys >= 90 && sys < 100)), `BP outside normal range (${sys} systolic)`);
  push(amberReasons, dia !== null && dia >= 90 && dia <= 120, `BP diastolic elevated (${dia})`);
  push(amberReasons, !isNaN(pulse) && ((pulse >= 100 && pulse <= 130) || (pulse >= 40 && pulse < 50)), `Pulse outside normal range (${pulse} bpm)`);

  if (urgentReasons.length > 0) return { level: "urgent", reasons: urgentReasons };
  if (amberReasons.length > 0) return { level: "amber", reasons: amberReasons };
  return { level: "routine", reasons: ["All recorded vitals within normal range; symptoms consistent with a minor / routine condition."] };
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
