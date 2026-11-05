# Logs de sesión → BTWB vía Vita

Contrato entre la app (Rebuild Strong, `index.html`) y el agente **Vita · Salud y longevidad**
(`agentId: 5a108750-c1c9-4969-9687-35dd7ac85ecd`), que registra en BTWB con el MCP no oficial `btwb-mcp`.

## Flujo en la app

1. En el detalle de sesión, el panel **Propuesta de logs · BTWB** divide la sesión de `P` en logs:
   | Bloque de `P` (`kind` / `tag`)                 | Logs propuestos                           |
   |-----------------------------------------------|-------------------------------------------|
   | `main` (básico)                               | 1 `single` (top set/series + back-off)    |
   | `main` `SS · BÁSICO` (A ⇄ B)                  | 1 `single` por movimiento                 |
   | `ss` `SS ANTAG` / `SEC`                       | 1 `single` por movimiento                 |
   | `ss` `SS ACC`                                 | 1 `rounds` con todos los movimientos      |
   | `oly`                                         | 1 `single` (el complex como movimiento)   |
   | `wod` / `home`                                | 1 `rounds` (AMRAP / por tiempo / EMOM)    |
   | `cond` con intervalos (`9×10"…`)              | 1 `rounds` (intervalos)                   |
   | `cond` continuo (Zona 2)                      | 1 `single`                                |
   | `TEST` (1RM)                                  | 1 `single` por movimiento testeado        |
   | `warmup` / `mob`                              | se omite (opcional: botón «Calent.» → notas de sesión) |
2. Cada log se puede activar/desactivar, editar (series, reps, kg, RPE, tempo, resultado, nota, scaled),
   añadir/quitar series, **agrupar con el siguiente** (→ `rounds`) o **separar** un `rounds` en `single`s.
   Las ediciones se guardan en `localStorage["p16w-logs-v1"]`.
3. **Aceptar y loguear todos**: marca la sesión como hecha (`localStorage["p16w-v17"]`), construye el
   envelope, lo guarda en `localStorage["p16w-vita-outbox"]` (últimos 40), emite el evento
   `window` `rebuildstrong:vita-batch` y lo entrega al transporte (ver más abajo).
   Antes de aceptar, no se envía nada ni se marca nada como hecho.

## Envelope (`schema: rebuild-strong.btwb-log-batch/v1`)

```jsonc
{
  "schema": "rebuild-strong.btwb-log-batch/v1",
  "batch_id": "P14W01S1-2026-11-05",   // código de sesión + fecha → clave de idempotencia
  "revision": 1,                        // sube cada vez que el usuario re-edita y vuelve a aceptar
  "created_at": "2026-11-05T16:00:31Z",
  "target": { "agent": "Vita · Salud y longevidad", "agentId": "5a108750-…", "mcp": "btwb-mcp",
              "tools": { "single": "log_workout", "rounds": "log_rounds_workout" } },
  "session": { "code": "P14W01S1", "week": 1, "block": "B1 · Estructural", "day": "LUN",
               "dayname": "Lunes", "focus": "…", "date": "2026-11-05", "notes": null, "completed_local": true },
  "logs": [ /* solo los logs activos, en orden */ ],
  "summary": "texto legible de todo el lote"
}
```

### Log `single` → `log_workout`

```jsonc
{
  "seq": 1, "id": "L…", "type": "single", "tool": "log_workout",
  "title": "Back Squat", "date": "2026-11-05",
  "movement": { "name": "Back Squat", "btwb_name": "Back Squat" },   // btwb_name null si no hay mapeo
  "rows": [   // agrupado, tal como lo ve el usuario
    { "label": "Top set", "sets": 1, "reps": 5, "reps_text": "5", "load_kg": 122.5, "load_mode": "absolute",
      "rpe": 8.5, "tempo": "30X1", "extra": null, "text": null, "readable": "Top set: 5 reps @ 122,5 kg (RPE 8,5) · 30X1" }
  ],
  "sets": [   // expandido, una entrada por serie real → lo que se pasa a log_workout
    { "set": 1, "label": "Top set", "reps": 5, "reps_text": "5", "load_kg": 122.5, "load_mode": "absolute", "rpe": 8.5, "tempo": "30X1" },
    { "set": 2, "label": "Back-off · Widowmaker", "reps": 20, "load_kg": 75, … }
  ],
  "result": null, "is_test": false, "scaled": false, "notes": "buena velocidad",
  "description": "texto legible del log (para las notas de BTWB)",
  "prescribed": "texto original de P", "source": { "blocks": ["Back Squat · Estructural"], "kind": "main", "tag": "AHAFA · ROT 1" }
}
```

### Log `rounds` → `log_rounds_workout`

```jsonc
{
  "seq": 4, "type": "rounds", "tool": "log_rounds_workout",
  "title": "WOD CrossFit · AMRAP 10'", "scheme": "AMRAP 10'", "rounds": null,
  "result": "5+12",                                  // texto libre: rondas+reps, mm:ss, cal…
  "movements": [
    { "name": "thrusters con barra", "btwb_name": "Thruster",
      "prescription": [ { "reps": 12, "reps_text": "12", "load_kg": 42.5, "load_mode": "absolute", … } ] }
  ],
  "scaled": false, "notes": null, "description": "…", "prescribed": "…", "source": { … }
}
```

### Semántica de campos

- `load_mode: "added_to_bodyweight"` → lastre (`+25 kg` en dominadas/fondos). `load_kg` es solo el lastre.
- `reps_text` manda cuando contiene `+`: `"2+2+2"` = cluster (una serie de 6 con pausas intra),
  `"8+8"` = por lado; `reps` es la suma. Los myo-reps / rest-pause (`"10+4×3"`) ya vienen expandidos en `sets`.
- `text` != null → prescripción compuesta que no se pudo estructurar (p. ej. «6 dominadas + 8 remos»): úsala tal cual.
- `is_test: true` → intento de 1RM: el resultado está en `sets[0].load_kg` (o en `result`).

## Qué debe hacer Vita

1. Comprobar `schema`. Si ya procesó `batch_id` con la misma `revision`, no duplicar (responder «ya registrado»).
   Con `revision` mayor, avisar de que es una corrección (BTWB no edita: preguntar si borrar/re-loguear).
2. Recorrer `logs` en orden `seq`:
   - `tool == "log_workout"` → una llamada por log con `movement.btwb_name ?? movement.name`, `date`,
     y las series de `sets` (reps + `load_kg`; si `load_mode` es `added_to_bodyweight`, registrar como lastre).
   - `tool == "log_rounds_workout"` → una llamada con `title`/`scheme`, `rounds`, `movements[]` (reps + carga
     de `prescription[0]`) y `result` como puntuación.
   - En ambos: `notes` + `description` en las notas del workout; marcar scaled si `scaled`.
   - Añadir `session.notes` (si existe) a las notas del primer log.
3. Responder con un resumen por log (`seq` → ok / error) para que el usuario sepa qué quedó registrado.

## Gancho de envío (sin MCP real todavía)

Por defecto, sin transporte, la app **copia al portapapeles** un mensaje dirigido a Vita (instrucciones +
resumen + JSON) para pegar en su chat. Para conectar un envío automático:

```js
RebuildStrong.setVitaTransport(async envelope => {
  // p. ej. POST a un bridge propio que reenvíe al agente Vita
  const r = await fetch("https://<tu-bridge>/vita", { method: "POST", body: JSON.stringify(envelope) });
  if (!r.ok) throw new Error("HTTP " + r.status);          // → estado "Error" en la UI
  return { msg: "Enviado a Vita" };                         // → estado "Enviado a Vita"
});
```

Otras utilidades en `window.RebuildStrong`: `buildEnvelope(week, day)`, `vitaMessage(envelope)`,
`outbox()`, `resetDraft(week, day)`. También puedes escuchar
`window.addEventListener("rebuildstrong:vita-batch", e => e.detail)`.
