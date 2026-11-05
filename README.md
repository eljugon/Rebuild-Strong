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

## 🐂 Icono (pantalla de inicio)

El icono de la app es el logo de El Toro (`icons/`): `apple-touch-icon.png` 180×180 (iPhone),
167/152 (iPad), `icon-192.png` / `icon-512.png` (manifest) y `favicon-32.png`. Los PNG se generan desde el logo
original, centrado sobre fondo naranja con margen para las esquinas redondeadas de iOS.

## ✅ Cómo probar

**Logs → Vita** (requiere la extensión, ver [`extension/README.md`](extension/README.md)):
1. Instala la extensión (`chrome://extensions` → Modo desarrollador → *Cargar descomprimida* → `extension/`),
   ten la sesión iniciada en Grok y, en el popup, pon la URL del chat de Vita y pulsa «Enviar prueba».
2. Abre https://eljugon.github.io/Rebuild-Strong/, entra en una sesión y pulsa **Aceptar y loguear todos**.
3. La sesión pasa a ✓ Hecha, se abre o activa Grok, el mensaje (resumen + JSON) se envía solo, y la app muestra
   «Enviado a Vita · N logs». Vita responde con el resultado de cada log en BTWB.

**Icono de El Toro en el iPhone**:
1. Si ya tenías la app en la pantalla de inicio con el icono «17», bórrala (iOS guarda el icono al añadirla).
2. En Safari abre https://eljugon.github.io/Rebuild-Strong/ (si ves el icono viejo, recarga la página;
   GitHub Pages puede tardar unos minutos en publicar).
3. Pulsa Compartir → **Añadir a pantalla de inicio**: la vista previa y el icono deben mostrar el logo de El Toro.

## ▶️ Run locally

python3 -m http.server 8000

Open:
http://localhost:8000

---

⚠️ This repo is currently a prototype. The goal is to evolve it into a real produc