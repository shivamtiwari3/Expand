# Xpand — Submission

**Project name:** Xpand  
**Track:** Decision Intelligence  
**Demo:** http://localhost:3000  
**Repository:** https://github.com/shivamtiwari3/Expand  

---

## What judges should open

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Landing — problem framing + feature overview |
| http://localhost:3000/dashboard | Live dashboard — map, gaps, RFPs, K2 |
| http://localhost:3000/dashboard?tour=1 | Guided 60s onboarding (optional opener) |

---

## Run before the demo (2 minutes)

```bash
cd xpand-app   # or your clone folder
npm install
npm run dev
```

Wait for **Ready** → open http://localhost:3000 in a clean browser window.

**Backstage warm-up (30 seconds):**
1. Click **Open the dashboard**
2. Let **Xpand recommends** load for the default district
3. Switch to **Ask K2** and run one question

K2 Think is **preconfigured** in [`.env`](../.env) — no copy/paste needed.

---

## 3-minute demo path

1. **Landing** (`/`) — one sentence on the problem  
2. **Dashboard** — map with severity colours  
3. **District tab** — AI recommendation (grounded numbers)  
4. **RFPs** — gap → proposal with land + investors  
5. **Ask K2** — live question  
6. **Close** — vision line  

Full script: [`demo-script.md`](./demo-script.md)

---

## What Xpand does (one line)

Reads UAE land, demand, real amenities and live listings → scores service gaps per district → turns gaps into RFPs → explains with K2 Think, grounded on computed data.

---

## Team notes

- Synthetic data outside Abu Dhabi core — labelled in UI footer  
- AI runs server-side via `POST /api/run` — K2 key in [`.env`](../.env)  
- Replay tour anytime: **Tour** button in dashboard header  
