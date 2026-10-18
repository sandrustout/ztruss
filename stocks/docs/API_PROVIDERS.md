# TripWise API Providers and Integration Matrix

This document provides configuration details, purpose, free tier limits, and graceful degradation behavior for all external service providers integrated behind the TripWise backend adapter layer.

| Provider | Purpose | Free Tier Limits | Key Environment Variable | Feature Impact If Absent |
|---|---|---|---|---|
| OpenTripMap | Places of interest, tourist categories, popularity ratings, wiki references | 10,000 requests/day free tier | `OPENTRIPMAP_KEY` | Falls back to Geoapify places and local destination landmarks. |
| Geoapify | Geocoding, location autocomplete, place categories, routing distance and duration | 3,000 requests/day free tier | `GEOAPIFY_KEY` | Falls back to Nominatim for geocoding and estimated haversine routing. |
| Open-Meteo | Climate averages, 7-day weather forecasts, temperature ranges | Free open API, 10,000 calls/day, no API key required | None (open endpoint) | Graceful offline message: "Weather data currently unavailable". |
| Amadeus Self-Service (Test) | Flight offers search, cheapest dates calendar, airport lookups | 2,000 test requests/month free tier | `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` | Duffel test offers used; if both absent, returns cached/fallback offers. |
| Duffel (Test Mode) | Flight search offers and sandbox test bookings | Unlimited sandbox requests with Duffel test token | `DUFFEL_TOKEN` | Amadeus flight offers used; if absent, sandbox booking simulated locally. |
| Nager.Date | Public holidays and national calendar events by country | Free open API, no key required | None (open endpoint) | Festival panel displays: "No national holidays found for dates". |
| Wikipedia / Wikidata | Monument descriptions, historical notes, licensed photo metadata | Free open REST API, requires descriptive User-Agent | None (uses configured User-Agent header) | Descriptions fallback to generic place category notes. |
| ExchangeRate-API / Frankfurter | Real-time multi-currency conversion rates (cached 12h) | Free tier open endpoints | `EXCHANGERATE_API_KEY` (optional for Frankfurter) | Uses cached base conversion matrix (1 USD = 83.5 INR). |
| TomTom / HERE (Traffic) | Live and typical time-of-day traffic congestion multipliers | 2,500 free requests/day | `TOMTOM_KEY` | Applies documented peak-hour buffer (1.25x morning/evening peak). |
| Razorpay (Test Mode) | Sandbox payment order creation and checkout signature verification | Test mode keys provided via free sandbox dashboard | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | System runs in offline sandbox mode: "Sandbox payment. No real money charged". |
| Supabase | PostgreSQL database, JWT authentication, Storage bucket for images | Free project tier (500MB DB, 1GB Storage, 50,000 MAU) | `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` | Local SQLite database fallback and mock JWT validation for local development. |

## Health Check Endpoint
The health of all configured providers is reported live via `GET /api/v1/health/providers`.
Each provider reports:
```json
{
  "provider": "opentripmap",
  "configured": true,
  "status": "healthy",
  "latency_ms": 112
}
```
If a provider key is absent, the backend returns `"configured": false, "status": "unconfigured"` and degrades features without failing the request.
