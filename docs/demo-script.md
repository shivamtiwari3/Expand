# Xpand — 3-minute demo script

> Rehearse twice, timed. **3 minutes strict.**

---

## 0:00–0:20 — The problem

> "City planners and investors look at land and price — but not whether residents are actually *served*. A new tower without schools or clinics creates hidden cost: congestion, vacancy, and missed opportunity. Today that's spreadsheet guesswork."

---

## 0:20–0:40 — What we built

> "We built **Xpand** — it reads land, demand, real amenities and live listings across the UAE, scores every district on service gaps, and uses K2 Think to recommend *where to build next* — grounded on computed numbers, not vibes."

Open **http://localhost:3000/dashboard?tour=1** (or skip tour if rehearsed).

---

## 0:40–2:20 — Live demo

1. **Start state:** Dashboard open on highest-severity district (map coloured critical/emerging/ok).
2. **Map + sidebar:** "39 districts, 7 emirates — real OSM amenities joined with challenge data."
3. **District tab:** Point at **Xpand recommends** — "AI loads on every district change. Engine offline by default; K2 when configured."
4. **RFPs tab:** "Widest gap becomes an open proposal — the need, vacant land, matched investors."
5. **Ask K2:** *"Which areas are most underserved for schools?"* — narrate: "Tools pull ranked gaps, then K2 explains."
6. **Advisor:** "Anonymous wizard — role, emirate, sectors, budget — tailored insight, nothing stored."

**Pre-demo checklist:**
- [ ] `npm run dev` running · tab at `/dashboard`
- [ ] Run one district AI call backstage (warm the route)
- [ ] Screen recording of this exact flow as fallback
- [ ] Notifications off · font zoom 125%

---

## 2:20–2:50 — The "aha"

> Our "aha" is: **a critical district lights up, Xpand names the exact amenity gap, forecasts how many residents arrive next year, and surfaces an RFP with land + investors — in one screen, with cited numbers.**

---

## 2:50–3:00 — Close

> "Today we built the intelligence layer for UAE PropTech — from raw data to where to build next. With live feeds, this becomes the operating system for land, investment and communities. Thank you."

---

## Q&A prep

| Question | Answer |
|----------|--------|
| **Built today vs before?** | Full Next.js dashboard: map, gap engine, RFP board, K2 copilot, onboarding tour — not the starter template mock. |
| **100× the data?** | Precompute step scales (`build_uae.mjs`); map tiles and district aggregates stay fast; AI tools query indexed JSON. |
| **Why AI not rules?** | Engine handles all numbers; K2 narrates and answers free-form questions judges ask live — always tool-grounded. |
| **First real user?** | Abu Dhabi master planners or a PropTech fund underwriting community infrastructure. |
