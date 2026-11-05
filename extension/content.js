/* Mundo aislado en la página de Rebuild Strong.
   1) Recibe envelopes de page-bridge.js (transporte / evento) y los pasa al service worker.
   2) Fallback: vigila localStorage["p16w-vita-outbox"] y envía las entradas nuevas
      (las que ya estaban al cargar la página se ignoran: nunca reenvía lotes antiguos).
   El service worker deduplica por batch_id|revision|created_at, así que llegar por
   las dos vías no envía dos veces. */
(() => {
  const TAG = "rs-vita-ext";
  const OUTBOX = "p16w-vita-outbox";
  const SCHEMA = "rebuild-strong.btwb-log-batch/v1";
  const AGENT_ID = "5a108750-c1c9-4969-9687-35dd7ac85ecd";

  const keyOf = (e) => [e.batch_id, e.revision, e.created_at].join("|");
  const valid = (e) =>
    !!e && e.schema === SCHEMA && Array.isArray(e.logs) && e.logs.length > 0 &&
    !!e.target && e.target.agentId === AGENT_ID;

  async function send(envelope, text, via) {
    try {
      return await chrome.runtime.sendMessage({
        type: "rs-vita-batch", key: keyOf(envelope), envelope, text, via, page: location.href
      });
    } catch (err) {
      return { ok: false, error: "Extensión no disponible: " + (err && err.message ? err.message : err) };
    }
  }

  window.addEventListener("message", async (e) => {
    if (e.source !== window || e.origin !== location.origin) return;
    const d = e.data;
    if (!d || d.tag !== TAG || d.dir !== "to-ext" || d.ready) return;
    const res = valid(d.envelope)
      ? await send(d.envelope, d.text || null, d.via)
      : { ok: false, error: "Envelope no válido (schema/agentId)" };
    window.postMessage({ tag: TAG, dir: "to-page", id: d.id, res: res || { ok: false, error: "Sin respuesta" } }, location.origin);
  });

  // Fallback por outbox
  const read = () => { try { return JSON.parse(localStorage.getItem(OUTBOX) || "[]"); } catch (e) { return []; } };
  const seen = new Set(read().map(keyOf));
  setInterval(() => {
    for (const env of read()) {
      const k = keyOf(env);
      if (seen.has(k)) continue;
      seen.add(k);
      if (valid(env)) send(env, null, "outbox");
    }
  }, 1500);
})();
