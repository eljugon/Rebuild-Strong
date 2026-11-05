# Extensión «Rebuild Strong → Vita»

Extensión mínima de navegador (Manifest V3, sin dependencias) que hace que **«Aceptar y loguear todos»**
llegue solo a Vita: abre o activa el chat de Vita en Grok, pega el mensaje (resumen + JSON del lote) y lo envía.
No hace falta copiar ni pegar nada. La app sigue siendo 100 % estática. En el iPhone y en GitHub Pages,
sin esta extensión, el lote sale por el transporte por defecto: `POST` a
`https://rebuild-strong-vita.eljugon.workers.dev/` (la clave del webhook está en el Worker, no en el cliente).
En el escritorio, si la extensión está instalada, sigue ganando: se registra más tarde con
`setVitaTransport` y pega el mensaje en el chat de Grok. Es opcional.

## Instalación (Chrome / Edge / Brave)

1. Descarga el repo (`git clone https://github.com/eljugon/Rebuild-Strong` o *Code → Download ZIP* y descomprímelo).
2. Abre `chrome://extensions` (en Edge: `edge://extensions`).
3. Activa **Modo de desarrollador**.
4. Pulsa **Cargar descomprimida** y elige la carpeta `extension/` del repo.
5. Fija la extensión en la barra y ábrela (icono «R»):
   - **URL del chat de Vita**: pega la URL del chat o bot de Vita en Grok (p. ej. `https://grok.com/c/<id>`).
     Por defecto es `https://grok.x.ai/` (la raíz, que redirige a grok.com): se envía a un chat nuevo de Grok,
     y el mensaje empieza por `@Vita · Salud y longevidad (agentId …)` para dirigirlo a Vita.
   - Pulsa **Guardar**. Si la URL no es de grok.com, grok.x.ai ni x.com, el navegador te pedirá permiso para ese dominio.
   - Pulsa **Enviar prueba**: se abre o activa Grok y debe aparecer un mensaje de prueba enviado.
6. Asegúrate de tener la **sesión iniciada en Grok** en ese navegador.

Tras actualizar el repo (`git pull`), pulsa ↻ en la tarjeta de la extensión en `chrome://extensions`
y recarga la pestaña de la app.

## Probar el flujo completo

1. Abre https://eljugon.github.io/Rebuild-Strong/ y entra en una sesión (Semana → día).
2. En **Propuesta de logs · BTWB** revisa o edita los logs y pulsa **Aceptar y loguear todos**.
3. Esto es lo que debe pasar:
   - el botón pasa a «Logueando N entradas…» y la sesión queda marcada como **✓ Hecha**;
   - se abre o activa la pestaña del chat de Vita, aparece el mensaje y se envía;
   - la app muestra **«Enviado a Vita · N logs»**;
   - Vita procesa el lote según [`docs/vita-btwb-logs.md`](../docs/vita-btwb-logs.md) y responde con el resultado de cada log.
4. Si algo falla (Grok sin sesión, selector desactualizado…), la app muestra **«Error: …»** con el motivo.
   La sesión sigue marcada como hecha. Corrige el problema y pulsa **Reintentar** o **Reenviar a Vita**.
5. El popup de la extensión muestra los últimos envíos (✓ / ✗, lote, vía y mensaje). El icono muestra ✓ o !
   según el último envío.

Para probar en local, sirve el repo con `python3 -m http.server 8000` y abre `http://localhost:8000/`.
La extensión también se activa en `localhost`.

## Cómo funciona

```
App (index.html)                       extensión
──────────────────                     ─────────────────────────────────────────────
Aceptar → VitaBridge.send(env)  ──▶  page-bridge.js (mundo de la página)
  ├ guarda en p16w-vita-outbox        └ se registró con RebuildStrong.setVitaTransport()
  ├ evento rebuildstrong:vita-batch          │ postMessage
  └ transporte(env) ◀── resultado ── content.js (mundo aislado) ──▶ background.js (service worker)
                                      └ fallback: vigila el outbox      ├ dedupe batch_id|revision|created_at
                                                                        ├ busca/crea la pestaña del chat de Vita
                                                                        └ inyecta fillAndSend(): pega + envía
```

- **Vía principal**: la extensión se registra como transporte de la app, así el botón muestra el resultado real.
- **Fallbacks**: evento `rebuildstrong:vita-batch` (si la app no expone `setVitaTransport`) y vigilancia de
  `localStorage["p16w-vita-outbox"]`. Solo se envían entradas nuevas: los lotes que ya estaban al cargar la página nunca se reenvían.
- **Sin duplicados**: el mismo lote (`batch_id|revision|created_at`) se envía una sola vez aunque llegue por varias vías.
  «Reenviar a Vita» en la app genera un `created_at` nuevo y sí vuelve a enviarlo (es intencionado).
  Vita deduplica por `batch_id` + `revision`.
- **Pestaña de Grok**: si la URL configurada es un chat concreto, se reutiliza la pestaña cuya URL empieza por ella.
  Si es la raíz, solo se reutiliza una pestaña en la raíz, nunca una conversación ajena. Si no hay ninguna, se crea.
- **Mensaje**: `@Vita … (agentId …)` + instrucciones + resumen legible + bloque ```json``` con el envelope
  en **una sola línea**, porque el editor de Grok rompe la indentación.
- **Validación**: solo se aceptan envelopes con `schema: rebuild-strong.btwb-log-batch/v1` y el `agentId` de Vita.

## Si Grok cambia su interfaz (selectores)

Los selectores se prueban en orden y gana el primero que encuentre un elemento visible.

- **Desde el popup**: despliega «Selectores», edita uno por línea y pulsa Guardar. Con «Por defecto» vuelves a los de serie.
- **En código**: bloque `DEFAULTS` al principio de [`background.js`](background.js) (`inputSelectors`, `sendSelectors`).

Para encontrar el selector bueno, en Grok haz clic derecho → *Inspeccionar* sobre el cuadro de texto o el botón de enviar.
Si ningún selector de envío encaja, la extensión pulsa Enter en el campo. Para que solo pegue sin enviar,
desmarca «Enviar automáticamente». Entonces la app mostrará «Pegado en el chat de Vita… (pulsa enviar en Grok)».

## Archivos

| Archivo          | Qué hace |
|------------------|----------|
| `manifest.json`  | MV3. Se inyecta en `https://eljugon.github.io/Rebuild-Strong/*` (y `localhost`). Permisos: `storage`, `scripting` y hosts de Grok. |
| `page-bridge.js` | Mundo de la página: se registra como transporte de la app o escucha el evento. |
| `content.js`     | Mundo aislado: valida, pasa el lote al service worker y vigila el outbox. |
| `background.js`  | Service worker: configuración, pestaña de Grok, pegado y envío, deduplicación e historial. |
| `popup.html/js`  | Configuración (URL, envío automático, selectores), botón de prueba e historial. |

## Privacidad

La extensión no usa servidores propios. El lote solo viaja desde la pestaña de la app hasta la pestaña de Grok
dentro de tu navegador. La configuración y el historial de envíos se guardan en `chrome.storage.local`.
