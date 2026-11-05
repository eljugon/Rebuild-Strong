/* Corre en el mundo de la página (world: MAIN), donde vive window.RebuildStrong.
   - Si la app expone setVitaTransport → la extensión se registra como transporte: el botón
     "Aceptar y loguear todos" espera la respuesta real (Enviado a Vita / error).
   - Si no (versión antigua), escucha el evento rebuildstrong:vita-batch.
   Se comunica con content.js (mundo aislado) por window.postMessage con TAG. */
(() => {
  if (window.__rsVitaExt) return;
  window.__rsVitaExt = true;
  const TAG = "rs-vita-ext";
  const TIMEOUT_MS = 120000;
  const pending = new Map();
  let seq = 0;

  window.addEventListener("message", (e) => {
    const d = e.data;
    if (e.source !== window || !d || d.tag !== TAG || d.dir !== "to-page") return;
    const p = pending.get(d.id);
    if (!p) return;
    pending.delete(d.id);
    clearTimeout(p.timer);
    if (d.res && d.res.ok) p.ok({ msg: d.res.msg || "Enviado a Vita" });
    else p.ko(new Error((d.res && d.res.error) || "La extensión no pudo enviar el lote"));
  });

  function post(env, via) {
    return new Promise((ok, ko) => {
      const id = `${++seq}-${Date.now()}`;
      const RS = window.RebuildStrong;
      let text = null;
      try { if (RS && typeof RS.vitaMessage === "function") text = RS.vitaMessage(env); } catch (e) {}
      const timer = setTimeout(() => {
        if (pending.delete(id)) ko(new Error("Vita no respondió a tiempo (extensión)"));
      }, TIMEOUT_MS);
      pending.set(id, { ok, ko, timer });
      window.postMessage({ tag: TAG, dir: "to-ext", id, via, envelope: JSON.parse(JSON.stringify(env)), text }, location.origin);
    });
  }

  const RS = window.RebuildStrong;
  if (RS && typeof RS.setVitaTransport === "function") {
    RS.setVitaTransport((env) => post(env, "transport"));
    window.postMessage({ tag: TAG, dir: "to-ext", ready: "transport" }, location.origin);
  } else {
    window.addEventListener("rebuildstrong:vita-batch", (e) => {
      if (e.detail) post(e.detail, "event").catch(() => {});
    });
    window.postMessage({ tag: TAG, dir: "to-ext", ready: "event" }, location.origin);
  }
})();
