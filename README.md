# Rebuild Strong

Rebuild Strong is a mobile-first training program app prototype built around the El Toro Training methodology.

## 🚀 Product Vision
A premium training companion for athletes who want structured strength, conditioning and progression tracking — without complexity.

## 🧠 Current Status
- Mobile-first web prototype
- 16-week structured program
- iPhone-style UI (PWA-ready base)
- Fully static (no user tracking yet)

## 🧱 Next Architecture (Target)

src/   data/          Program & exercises (JSON)   components/    UI building blocks   screens/       App views   services/      Logic (progression, storage)

## 🗺️ Roadmap

### Phase 1 — Stabilise (NOW)
- Document product & architecture
- Define data model
- Prepare PWA basics

### Phase 2 — Refactor
- Extract program into JSON
- Separate CSS & JS
- Add local progress tracking

### Phase 3 — Product
- Workout logging
- Progress tracking
- Personalization (1RM)

### Phase 4 — iPhone App
- SwiftUI
- Local storage + sync
- App Store ready

## ▶️ Run locally

python3 -m http.server 8000

Open:
http://localhost:8000

---

⚠️ This repo is currently a prototype. The goal is to evolve it into a real produc