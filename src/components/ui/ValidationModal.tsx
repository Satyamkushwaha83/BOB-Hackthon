"use client";

import { useEffect } from "react";
import { VitalValidationError } from "@/lib/validation";

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: VitalValidationError[];
}

export function ValidationModal({ isOpen, onClose, errors }: ValidationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || errors.length === 0) return null;

  return (
    <div
      aria-modal="true"
      role="alertdialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-red-100 max-w-lg w-full overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3 text-white">
          <div className="p-2 bg-red-700/60 rounded-full text-xl flex-shrink-0">
            🚨
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">
              Invalid Clinical Vitals Entry
            </h3>
            <p className="text-xs text-red-100 mt-0.5">
              Form submission blocked due to physiological out-of-range value(s)
            </p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-600 font-medium">
            Please correct the following vital sign(s) before generating the clinical summary:
          </p>

          <div className="space-y-3">
            {errors.map((err) => (
              <div
                key={err.field}
                className="bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-1 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-red-900">
                    {err.fieldLabel}
                  </span>
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-200 text-red-800">
                    Out of Bounds
                  </span>
                </div>
                <p className="text-xs font-semibold text-red-700">
                  {err.message}
                </p>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-red-100 flex items-center gap-1">
                  <span className="font-semibold text-slate-600">Valid Bounds:</span>{" "}
                  <span>{err.bounds}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2"
          >
            <span>✏️ Review & Correct Vitals</span>
          </button>
        </div>
      </div>
    </div>
  );
}
