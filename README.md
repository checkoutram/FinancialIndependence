# FIRE — Financial Independence Tracker

A privacy-first, offline FIRE (Financial Independence, Retire Early) planner.
React + TypeScript + Vite + Tailwind CSS 4 + Chart.js, wrapped in Capacitor for Android.

## Features

- **PIN-encrypted local storage** — all data is encrypted with AES-256-GCM (key derived
  from your PIN via PBKDF2) and never leaves the device. No account, no cloud.
- **7 screens**: Overview (FIRE status, gap analysis, allocation, milestones, net worth,
  cash flow), Inputs (family, employment, cash flow, assumptions), Assets & Liabilities,
  Goals (children education/marriage, retirement, others), Projections (tabbed charts +
  year-by-year tables), FIRE Types (Lean/Coast/Barista/Slow/Full/Chubby/Fat), and
  Calculation Validation against the Excel planning template (7 automated checks).
- **Multi-currency** — track INR and USD side by side with a configurable FX rate.
- **Country profiles** — India, USA, Canada, Australia, UK, UAE set currency,
  default returns and account labels.
- **Excel-faithful engine** — glide paths, SIP step-ups, first-year partial months and
  withdrawal schedules replicate the source workbook exactly (see the Validate tab).
- Dark theme by default with a light toggle; mobile-first; print-friendly.

## Data entry

Nothing is pre-filled. Every input includes an explanation and an example
(e.g. "Monthly take-home — net pay credited to your bank. Example: 6838 (USD).").
Financial assets can be mapped to Retirement or Children goals so projections know
which corpus funds which goal.

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # production build to dist/
npx cap sync android
```

## Android APK

Every push to `main` runs `.github/workflows/build-apk.yml`, which builds the web app,
syncs Capacitor and produces `app-debug.apk` as a workflow artifact (`finplan-apk`).

The web build also deploys to GitHub Pages via `.github/workflows/deploy-pages.yml`.
