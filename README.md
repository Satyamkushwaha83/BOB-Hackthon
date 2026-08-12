# Sehat-Sarthi — AI-Powered Virtual Village Clinic

**Sehat-Sarthi** ("Health Companion") is an open-source, AI-assisted prototype for rural health workers and remote doctors in India. It is designed to run entirely in-browser (no server required) and supports Hindi, Marathi, and English.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Patient Queue** | Live dashboard of waiting, in-progress and completed consultations |
| **Patient Intake** | Structured symptom capture with red-flag detection |
| **AI Triage** | Rule-based triage engine (urgent / amber / routine) |
| **First-Aid Guide** | Safe, condition-specific first-aid and OTC medicine guidance |
| **Doctor Consultation** | Simulated remote video-consult screen with doctor sign-off |
| **Patient Records** | Full consultation history per patient |
| **Appointments** | Booking and status management |
| **Analytics** | Consultation trend charts for clinic managers |
| **Multi-language** | English · हिंदी · मराठी UI with one-click switching |

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Health Worker | asha@clinic.demo | asha123 |
| Health Worker | manoj@clinic.demo | manoj123 |
| Health Worker | priya@clinic.demo | priya123 |
| Doctor | anita@clinic.demo | doctor123 |
| Doctor | farhan@clinic.demo | doctor123 |

---

## 🏗 Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS v4**
- **TypeScript**
- All data is **in-memory** — no database or backend required for the prototype

---

## 📁 Project Structure

```
src/
  app/          # Next.js App Router entry points
  components/   # UI components (AppShell, LoginScreen, sections, consultation flow)
  hooks/        # useSpeech — Web Speech API wrapper
  lib/          # Business logic: types, rules, i18n, seed data, auth, dates
  types/        # Global TypeScript ambient declarations
```

---

## ⚠️ Disclaimer

This is a **hackathon prototype**. All patient data is simulated in-memory and reset on every page refresh. It is **not a medical device** and must not be used for real clinical decisions without proper validation and regulatory approval.

---

## 📄 License

MIT
