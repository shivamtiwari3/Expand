<div align="center">

<img src="public/readme-banner.svg" alt="Xpand — UAE service gap intelligence" width="100%" />

<br /><br />

**See what every area in the UAE is missing — and where to build next.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![K2 Think](https://img.shields.io/badge/K2_Think-V2-6366f1?style=flat-square)](https://k2think.ai/)
[![PropTech Challenge](https://img.shields.io/badge/Abu_Dhabi-AI_PropTech-ced7e3?style=flat-square)](https://challenge.evoost.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Demo →](#submission) · [Guided tour](#demo-flow) · [Architecture](#architecture)

</div>

---

## Submission

| | |
|---|---|
| **Project** | **Xpand** — Decision Intelligence for UAE PropTech |
| **Demo** | **http://localhost:3000** (landing) · **http://localhost:3000/dashboard?tour=1** (guided tour) |
| **Track** | Decision Intelligence |
| **AI** | K2 Think V2 — preconfigured in [`.env`](.env) |
| **Repo** | https://github.com/shivamtiwari3/Expand |

```bash
npm install && npm run dev
# → open http://localhost:3000
```

No extra setup — K2 API key is included for the hackathon demo.

---

## What is Xpand?

**Xpand** is decision intelligence for land, investment and communities — built for the [Abu Dhabi AI PropTech Challenge](https://challenge.evoost.ai/). It joins challenge datasets (parcels, communities, transactions, investors) with **real OpenStreetMap amenities** and **live UAE listings** to:

1. **Detect service gaps** across 39 districts in 7 emirates  
2. **Forecast 12-month demand** from price momentum and growth  
3. **Turn gaps into RFPs** — need, land and matched investors  
4. **Explain with AI** — K2 Think when configured, fast grounded engine offline  

> Data is synthetic outside Abu Dhabi core figures — never present as official market data.

---

## Demo flow

<table>
<tr>
<td width="50%">

### Landing · `/`
Marketing site with animated hero, feature grid and scroll sections for **Map · Gaps · RFPs · Community · Ask Xpand**.

**CTA:** [Start guided tour →](http://localhost:3000/dashboard?tour=1)

</td>
<td width="50%">

### Dashboard · `/dashboard`
Interactive MapLibre map + district sidebar + AI right rail.

**9-step onboarding** spotlights each panel on first visit (replay anytime via **Tour** in the header).

</td>
</tr>
</table>

### 3-minute pitch script

| Time | Beat |
|------|------|
| **0:00** | Planners can't see *where* services will break next — Xpand scores every district |
| **0:20** | Open dashboard → critical district lights up on the map |
| **0:45** | **Xpand recommends** — AI grounded on gaps + forecast + investors |
| **1:30** | Open matching **RFP** → vacant land + interested funds |
| **2:00** | **Ask K2:** *"Which areas lack primary care?"* |
| **2:30** | **Advisor wizard** — tailored insight for role / budget |
| **2:50** | *"Today a prototype — with real feeds, the intelligence layer for UAE PropTech."* |

Full script: [`docs/demo-script.md`](docs/demo-script.md)

---

## Quick start

```bash
git clone https://github.com/shivamtiwari3/Expand.git
cd Expand
npm install
npm run dev
```

Open **http://localhost:3000** — landing page  
Open **http://localhost:3000/dashboard?tour=1** — guided onboarding

K2 Think is **on by default** (see [`.env`](.env)). Switch to offline mode:

```bash
XPAND_AI_PROVIDER=engine
```

All model calls run **server-side** via `POST /api/run` — keys never touch the browser.

---

## Architecture

```
Landing (/)          Dashboard (/dashboard)
     │                      │
     └──────►  Map + Sidebar + Right rail tabs
                         │
                    POST /api/run
                         │
              LangGraph (lib/ai/graph.ts)
                 gather → synthesize? → finalize
                         │
           ┌─────────────┴─────────────┐
     Xpand engine (default)      K2 Think V2
     lib/engine.ts               lib/ai/model.ts
```

| Tab | Mode | What it does |
|-----|------|--------------|
| District | `district` | Auto AI recommendation on district select |
| RFPs | — | Open proposals from widest gaps |
| Community | — | Ventures matched to district needs |
| Ask K2 | `qa` | Free-form Q&A across UAE data |
| Advisor | `insights` | Role → emirate → sectors → budget wizard |

**Data pipeline:** `scripts/build_uae.mjs` → `lib/xpand-data.json` + `lib/live-snapshot.json`

---

## Project structure

```
app/
  page.tsx              Landing + demo sections
  dashboard/page.tsx    Main interactive app + onboarding tour
  api/run/route.ts      Server-side AI endpoint
components/
  dashboard/            Map, sidebar, panels, OnboardingTour
  marketing/            Hero, header, demo-flow sections
lib/
  engine.ts             Gap scoring, forecast, RFP generation
  ai/                   LangGraph pipeline, K2 client, tools
public/
  readme-banner.svg     Animated README header
docs/
  demo-script.md        3-minute pitch (filled in)
```

---

## Built with

- **Next.js 16** · App Router · TypeScript · Tailwind 4  
- **MapLibre GL** — UAE district map with severity styling  
- **LangGraph + LangChain** — tool-grounded AI pipeline  
- **[K2 Think V2](https://k2think.ai/)** — MBZUAI reasoning model (optional)  
- **Framer Motion** — landing animations + onboarding tour  

---

## Links

- 🌐 Challenge: https://challenge.evoost.ai  
- 📦 Datasets: [eVoost on HuggingFace](https://huggingface.co/datasets/eVoost/abu-dhabi-ai-proptech-challenge)  
- 🐙 This repo: https://github.com/shivamtiwari3/Expand  

---

<div align="center">

**Built for the Abu Dhabi AI PropTech Challenge** · MIT License · Shivam Tiwari

*Synthetic demo data — for hackathon prototype purposes only.*

</div>
