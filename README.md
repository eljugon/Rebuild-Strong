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

## 📝 Logs de sesión → BTWB (vía Vita)

El detalle de cada sesión incluye **Propuesta de logs**: la sesión se divide en los logs reales de BTWB
(básicos, superseries, acondicionamiento/WOD), cada uno editable, y «Aceptar y loguear todos» marca la sesión
como hecha y prepara el lote para el agente Vita. Contrato y gancho de envío: [`docs/vita-btwb-logs.md`](docs/vita-btwb-logs.md).

**Envío automático a Vita**: instala la extensión de navegador de [`extension/`](extension/README.md)
(Chrome/Edge → *Cargar descomprimida*). Con ella, al aceptar, el lote se pega y se envía solo en el chat de Vita
en Grok, sin copiar y pegar. Sin la extensión, la app copia el mensaje al portapapeles como antes.

## ▶️ Run locally

python3 -m http.server 8000

Open:
http://localhost:8000

---

⚠️ This repo is currently a prototype. The goal is to evolve it into a real produc