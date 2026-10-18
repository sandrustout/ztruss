# TripWise Directory Structure (Complete Project Layout)

```
stocks/ (repo root)
├── .gitignore
├── README.md
├── docs/
│   ├── API_PROVIDERS.md
│   ├── ER_DIAGRAM.md
│   └── SCREENSHOT_CHECKLIST.md
├── supabase/
│   └── migrations/
│       ├── 20260101000000_initial_schema.sql
│       └── 20260101000001_seed_destinations.sql
├── backend/
│   ├── .env.example
│   ├── Dockerfile
│   ├── render.yaml
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── errors.py
│   │   │   ├── logging.py
│   │   │   ├── rate_limit.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── profile.py
│   │   │   ├── destination.py
│   │   │   ├── trip.py
│   │   │   ├── flight.py
│   │   │   ├── hotel.py
│   │   │   ├── billing.py
│   │   │   └── history.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── common.py
│   │   │   ├── profile.py
│   │   │   ├── destination.py
│   │   │   ├── trip.py
│   │   │   ├── flight.py
│   │   │   ├── hotel.py
│   │   │   └── billing.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py
│   │   │       ├── health.py
│   │   │       ├── stats.py
│   │   │       ├── auth.py
│   │   │       ├── destinations.py
│   │   │       ├── flights.py
│   │   │       ├── hotels.py
│   │   │       ├── trips.py
│   │   │       ├── bills.py
│   │   │       ├── bookings.py
│   │   │       └── history.py
│   │   ├── providers/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── opentripmap.py
│   │   │   ├── geoapify.py
│   │   │   ├── openmeteo.py
│   │   │   ├── amadeus.py
│   │   │   ├── duffel.py
│   │   │   ├── nager.py
│   │   │   ├── wikipedia.py
│   │   │   ├── rates.py
│   │   │   └── traffic.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ranking.py
│   │   │   ├── scheduling.py
│   │   │   ├── pricing.py
│   │   │   ├── savings.py
│   │   │   ├── festivals.py
│   │   │   ├── optimise.py
│   │   │   ├── billing.py
│   │   │   └── booking.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── time.py
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_health.py
│       ├── test_auth.py
│       ├── test_ranking.py
│       ├── test_savings.py
│       ├── test_scheduling.py
│       └── test_validation.py
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vercel.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── app/
        │   ├── providers.tsx
        │   └── router.tsx
        ├── store/
        │   ├── themeStore.ts
        │   ├── authStore.ts
        │   └── tripDraftStore.ts
        ├── styles/
        │   ├── tokens.css
        │   └── globals.css
        ├── types/
        │   └── index.ts
        ├── lib/
        │   ├── api.ts
        │   ├── supabase.ts
        │   └── formatters.ts
        ├── components/
        │   ├── ui/
        │   │   ├── Button.tsx
        │   │   ├── Input.tsx
        │   │   ├── Chip.tsx
        │   │   ├── Skeleton.tsx
        │   │   ├── Toast.tsx
        │   │   ├── Dialog.tsx
        │   │   ├── Tabs.tsx
        │   │   └── Tooltip.tsx
        │   ├── layout/
        │   │   ├── Navbar.tsx
        │   │   ├── Footer.tsx
        │   │   ├── ThemeToggle.tsx
        │   │   ├── AuthMenu.tsx
        │   │   └── Layout.tsx
        │   ├── auth/
        │   │   └── ProtectedRoute.tsx
        │   ├── reactbits/
        │   │   ├── TextType.tsx
        │   │   ├── CountUp.tsx
        │   │   ├── LogoLoop.tsx
        │   │   ├── ScrollStack.tsx
        │   │   ├── CardSwap.tsx
        │   │   └── Folder.tsx
        │   ├── search/
        │   ├── flights/
        │   ├── stays/
        │   ├── places/
        │   ├── events/
        │   ├── planner/
        │   ├── bill/
        │   └── history/
        └── pages/
            ├── HomePage.tsx
            ├── LoginPage.tsx
            ├── ProfilePage.tsx
            ├── TripsPage.tsx
            ├── HistoryPage.tsx
            ├── SearchPage.tsx
            ├── DestinationPage.tsx
            ├── TripPlannerPage.tsx
            ├── BillPage.tsx
            ├── SharedTripPage.tsx
            ├── AboutPage.tsx
            └── NotFoundPage.tsx
```
