export interface VitalsToValidate {
  temp: string;
  bp: string;
  pulse: string;
  spo2: string;
}

export type ValidatedField = "temp" | "bp" | "pulse" | "spo2" | "age";

export interface VitalValidationError {
  field: ValidatedField;
  fieldLabel: string;
  message: string;
  bounds: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<ValidatedField, string | null>;
  errorList: VitalValidationError[];
  firstErrorField?: ValidatedField;
}

/**
 * Validates Body Temperature in Fahrenheit (°F).
 * Clinical bounds: 80.0°F to 115.0°F
 */
export function validateTemperature(tempStr: string): VitalValidationError | null {
  const trimmed = (tempStr || "").trim();
  const bounds = "80.0°F to 115.0°F";
  const fieldLabel = "Temperature (°F)";

  if (!trimmed) {
    return {
      field: "temp",
      fieldLabel,
      message: "Invalid Entry: Temperature is required.",
      bounds,
    };
  }

  const val = Number(trimmed);
  if (isNaN(val)) {
    return {
      field: "temp",
      fieldLabel,
      message: "Invalid Entry: Temperature must be a valid number.",
      bounds,
    };
  }

  if (val < 80.0 || val > 115.0) {
    return {
      field: "temp",
      fieldLabel,
      message: `Invalid Entry: Temperature (${val}°F) must be between 80.0°F and 115.0°F.`,
      bounds,
    };
  }

  return null;
}

/**
 * Validates Blood Pressure in mmHg.
 * Clinical bounds:
 * - Format: "Systolic/Diastolic" (e.g., "120/80")
 * - Systolic: 50 to 260 mmHg
 * - Diastolic: 30 to 150 mmHg
 * - Systolic > Diastolic
 */
export function validateBloodPressure(bpStr: string): VitalValidationError | null {
  const trimmed = (bpStr || "").trim();
  const fieldLabel = "Blood Pressure (mmHg)";
  const bounds = "Format: Systolic/Diastolic (e.g. 120/80), Systolic: 50-260 mmHg, Diastolic: 30-150 mmHg, Systolic > Diastolic";

  if (!trimmed) {
    return {
      field: "bp",
      fieldLabel,
      message: "Invalid Entry: Blood Pressure is required.",
      bounds,
    };
  }

  const match = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) {
    return {
      field: "bp",
      fieldLabel,
      message: "Invalid Entry: Blood Pressure format must strictly follow 'Systolic/Diastolic' (e.g., '120/80').",
      bounds: "Format: Systolic/Diastolic (e.g. 120/80)",
    };
  }

  const sys = parseInt(match[1], 10);
  const dia = parseInt(match[2], 10);

  if (sys < 50 || sys > 260) {
    return {
      field: "bp",
      fieldLabel,
      message: `Invalid Entry: Systolic Blood Pressure (${sys} mmHg) must be between 50 and 260 mmHg.`,
      bounds: "Systolic: 50 to 260 mmHg",
    };
  }

  if (dia < 30 || dia > 150) {
    return {
      field: "bp",
      fieldLabel,
      message: `Invalid Entry: Diastolic Blood Pressure (${dia} mmHg) must be between 30 and 150 mmHg.`,
      bounds: "Diastolic: 30 to 150 mmHg",
    };
  }

  if (sys <= dia) {
    return {
      field: "bp",
      fieldLabel,
      message: `Invalid Entry: Systolic Blood Pressure (${sys} mmHg) must be strictly greater than Diastolic Blood Pressure (${dia} mmHg).`,
      bounds: "Systolic > Diastolic",
    };
  }

  return null;
}

/**
 * Validates Heart Rate / Pulse in beats per minute (bpm).
 * Clinical bounds: Integer between 30 bpm and 250 bpm
 */
export function validatePulse(pulseStr: string): VitalValidationError | null {
  const trimmed = (pulseStr || "").trim();
  const fieldLabel = "Heart Rate / Pulse (bpm)";
  const bounds = "30 bpm to 250 bpm (integer)";

  if (!trimmed) {
    return {
      field: "pulse",
      fieldLabel,
      message: "Invalid Entry: Heart Rate / Pulse is required.",
      bounds,
    };
  }

  if (!/^\d+$/.test(trimmed)) {
    return {
      field: "pulse",
      fieldLabel,
      message: "Invalid Entry: Heart Rate / Pulse must be an integer.",
      bounds,
    };
  }

  const val = parseInt(trimmed, 10);
  if (val < 30 || val > 250) {
    return {
      field: "pulse",
      fieldLabel,
      message: `Invalid Entry: Heart Rate / Pulse (${val} bpm) must be between 30 bpm and 250 bpm.`,
      bounds: "30 bpm to 250 bpm",
    };
  }

  return null;
}

/**
 * Validates Oxygen Saturation (SpO2 %).
 * Clinical bounds: Integer between 50% and 100%
 */
export function validateSpO2(spo2Str: string): VitalValidationError | null {
  const trimmed = (spo2Str || "").trim();
  const fieldLabel = "SpO2 (%)";
  const bounds = "50% to 100% (integer)";

  if (!trimmed) {
    return {
      field: "spo2",
      fieldLabel,
      message: "Invalid Entry: SpO2 is required.",
      bounds,
    };
  }

  if (!/^\d+$/.test(trimmed)) {
    return {
      field: "spo2",
      fieldLabel,
      message: "Invalid Entry: SpO2 must be an integer.",
      bounds,
    };
  }

  const val = parseInt(trimmed, 10);
  if (val < 50 || val > 100) {
    return {
      field: "spo2",
      fieldLabel,
      message: `Invalid Entry: SpO2 (${val}%) must be between 50% and 100%.`,
      bounds: "50% to 100%",
    };
  }

  return null;
}

/**
 * Validates Patient Age in years.
 * Clinical bounds: Integer between 0 and 120 years
 */
export function validateAge(ageStr: string): VitalValidationError | null {
  const trimmed = (ageStr || "").toString().trim();
  const fieldLabel = "Age (years)";
  const bounds = "0 to 120 years (integer)";

  if (!trimmed) {
    return {
      field: "age",
      fieldLabel,
      message: "Invalid Entry: Age is required.",
      bounds,
    };
  }

  if (!/^\d+$/.test(trimmed)) {
    return {
      field: "age",
      fieldLabel,
      message: "Invalid Entry: Age must be an integer.",
      bounds,
    };
  }

  const val = parseInt(trimmed, 10);
  if (val < 0 || val > 120) {
    return {
      field: "age",
      fieldLabel,
      message: `Invalid Entry: Age (${val} years) must be between 0 and 120 years.`,
      bounds: "0 to 120 years",
    };
  }

  return null;
}

/**
 * Runs all physiological validation checks for temperature, blood pressure, pulse, SpO2, and age.
 */
export function validateAllClinicalInputs(
  vitals: VitalsToValidate,
  age: string
): ValidationResult {
  const tempErr = validateTemperature(vitals.temp);
  const bpErr = validateBloodPressure(vitals.bp);
  const pulseErr = validatePulse(vitals.pulse);
  const spo2Err = validateSpO2(vitals.spo2);
  const ageErr = validateAge(age);

  const errorList: VitalValidationError[] = [];
  if (tempErr) errorList.push(tempErr);
  if (bpErr) errorList.push(bpErr);
  if (pulseErr) errorList.push(pulseErr);
  if (spo2Err) errorList.push(spo2Err);
  if (ageErr) errorList.push(ageErr);

  return {
    isValid: errorList.length === 0,
    errors: {
      temp: tempErr?.message || null,
      bp: bpErr?.message || null,
      pulse: pulseErr?.message || null,
      spo2: spo2Err?.message || null,
      age: ageErr?.message || null,
    },
    errorList,
    firstErrorField: errorList[0]?.field,
  };
}
