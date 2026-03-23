# Candidate Dashboard

A React + Vite + Tailwind CSS recruitment pipeline dashboard.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Project structure

```
src/
├── constants/        # Shared enums & config (statuses, question bank)
├── data/             # Seed data (candidates)
├── utils/            # Pure helper functions
├── hooks/            # Custom React hooks (state & logic)
│   ├── useToast.js
│   ├── useCandidates.js
│   ├── useFilters.js
│   ├── useSelection.js
│   └── useQuestionnaire.js
└── components/
    ├── common/       # Reusable primitives (icons, badges, pagination, toast)
    ├── layout/       # Page-level sections (header, stats, filters, bulk bar)
    ├── candidates/   # Candidate card, table row, action buttons
    └── modals/       # Schedule, delete, questionnaire, sent-questions drawer
```
