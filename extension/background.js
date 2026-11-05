/* Service worker: recibe lotes de content.js, abre/activa el chat de Vita en Grok,
   pega el mensaje (resumen + JSON) y lo envía.

   ── AJUSTES ──────────────────────────────────────────────────────────────
   Si Grok cambia su HTML, edita aquí los selectores (o desde el popup, que
   los guarda en chrome.storage y tienen prioridad sobre estos valores).    */
const DEFAULTS = {
  // URL del chat de Vita. Si es una conversación/bot concreta (no la raíz),
  // solo se reutilizan pestañas cuya URL empiece por ella.
  chatUrl: "https://grok.com/",
  autoSubmit: true,   // false = solo pega el texto, no pulsa enviar
  activate: true,     // traer la pestaña de Grok al frente
  timeoutMs: 30000,   // espera máxima a que aparezca el campo de texto
  inputSelectors: [
    'textarea[aria-label*="Grok" i]',
    'textarea[aria-label*="Ask" i]',
    'div.ProseMirror[contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]',
    'textarea[placeholder]',
    'div[contenteditable="true"]',
    'textarea'
  ],
  sendSelectors: [
    'button[type="submit"]:not([disabled])',
    'button[aria-label="Submit"]:not([disabled])',
    'button[aria-label*="Send" i]:not([disabled])',
    'button[aria-label*="Enviar" i]:not([disabled])',
    'button[data-testid*="send" i]:not([disabled])'
  ]
};
// ─────────────────────────────────────────────────────────────────────────

const AGENT = { name: "Vita · Salud y longevidad", id: "5a108750-c1c9-4969-9687-35dd7ac85ecd", mcp: "btwb-mcp" };
const LOG_MAX = 30;
const inflight = new Map();

async function getConfig() {
  const { config } = await chrome.storage.local.get("config");
  return { ...DEFAULTS, ...(config || {}) };
}

/* Mismo contenido que vitaMessage() de la app, pero con el JSON compacto en una sola línea:
   los editores contenteditable (Grok) convierten la indentación en espacios no separables. */
function buildMessage(env) {
  return `@${AGENT.name} (agentId ${AGENT.id})\n` +
    `Registra en BTWB estos ${env.logs.length} logs con ${AGENT.mcp}: type "single" → log_workout · type "rounds" → log_rounds_workout. ` +
    `Un registro por elemento de "logs", en orden "seq", con fecha "date". Idempotencia: batch_id ${env.batch_id} rev ${env.revision}.\n\n` +
    (env.summary || "") + "\n\n```json\n" + JSON.stringify(env) + "\n```";
}

async function record(entry) {
  const { sent = [] } = await chrome.storage.local.get("sent");
  sent.unshift(entry);
  await chrome.storage.local.set({ sent: sent.slice(0, LOG_MAX) });
  chrome.action.setBadgeText({ text: entry.ok ? "✓" : "!" });
  chrome.action.setBadgeBackgroundColor({ color: entry.ok ? "#16a34a" : "#dc2626" });
}

function sameChat(tabUrl, chatUrl) {
  if (!tabUrl) return false;
  const clean = (u) => u.split(/[?#]/)[0].replace(/\/+$/, "");
  const u = new URL(chatUrl);
  const isRoot = (u.pathname === "/" || u.pathname === "") && !u.search;
  // raíz → solo una pestaña en la raíz (chat nuevo), nunca una conversación ajena
  return isRoot ? clean(tabUrl) === clean(chatUrl) : tabUrl.startsWith(clean(chatUrl));
}

async function getChatTab(cfg) {
  const tabs = await chrome.tabs.query({});
  let tab = tabs.find((t) => sameChat(t.url, cfg.chatUrl));
  if (!tab) {
    tab = await chrome.tabs.create({ url: cfg.chatUrl, active: cfg.activate });
  } else if (cfg.activate) {
    await chrome.tabs.update(tab.id, { active: true });
    try { await chrome.windows.update(tab.windowId, { focused: true }); } catch (e) {}
  }
  return tab;
}

async function waitComplete(tabId, ms = 30000) {
  const t0 = Date.now();
  for (;;) {
    const t = await chrome.tabs.get(tabId);
    if (t.status === "complete") return t;
    if (Date.now() - t0 > ms) return t;
    await new Promise((r) => setTimeout(r, 300));
  }
}

/* Se inyecta en la pestaña de Grok. Debe ser autocontenida (sin closures). */
async function fillAndSend(text, inputSel, sendSel, autoSubmit, timeoutMs) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (el) => el.getClientRects().length > 0;
  const find = (list) => {
    for (const s of list) {
      try {
        const el = [...document.querySelectorAll(s)].find(visible);
        if (el) return { el, sel: s };
      } catch (e) { /* selector inválido: se ignora */ }
    }
    return null;
  };
  const probe = text.slice(0, 40).split("\n")[0];
  let hit, t0 = Date.now();
  while (!(hit = find(inputSel))) {
    if (Date.now() - t0 > timeoutMs) return { ok: false, error: "No encuentro el campo de texto de Grok (¿sesión iniciada? revisa 'inputSelectors')" };
    await sleep(400);
  }
  const el = hit.el;
  const isField = el.tagName === "TEXTAREA" || el.tagName === "INPUT";
  const value = () => (isField ? el.value : el.innerText) || "";
  el.focus();
  if (isField) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    document.execCommand("selectAll", false);
    document.execCommand("insertText", false, text);
    if (!value().includes(probe)) {
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    }
  }
  await sleep(400);
  if (!value().includes(probe)) return { ok: false, error: "No se pudo escribir el mensaje en Grok (revisa 'inputSelectors')" };
  if (!autoSubmit) return { ok: true, submitted: false, input: hit.sel };

  let btn, t1 = Date.now();
  while (!(btn = find(sendSel)) && Date.now() - t1 < 8000) await sleep(250);
  if (btn) btn.el.click();
  else el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
  // confirmación: el campo se vacía tras enviar
  const t2 = Date.now();
  while (value().includes(probe) && Date.now() - t2 < 6000) await sleep(300);
  if (value().includes(probe)) return { ok: false, error: "Mensaje pegado pero no se confirmó el envío (revisa 'sendSelectors' o pulsa enviar en Grok)" };
  return { ok: true, submitted: true, input: hit.sel, send: btn ? btn.sel : "Enter" };
}

async function deliverText(text, cfg) {
  const tab = await getChatTab(cfg);
  await waitComplete(tab.id);
  const [res] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: fillAndSend,
    args: [text, cfg.inputSelectors, cfg.sendSelectors, cfg.autoSubmit, cfg.timeoutMs]
  });
  return (res && res.result) || { ok: false, error: "Sin resultado del script en Grok" };
}

async function handleBatch(m) {
  const key = m.key;
  if (inflight.has(key)) return inflight.get(key);
  const { sent = [] } = await chrome.storage.local.get("sent");
  if (sent.some((x) => x.key === key && x.ok)) return { ok: true, dup: true, msg: "Ya enviado a Vita" };

  const env = m.envelope;
  const p = (async () => {
    const cfg = await getConfig();
    let r;
    try { r = await deliverText(buildMessage(env), cfg); }
    catch (e) { r = { ok: false, error: String((e && e.message) || e) }; }
    const n = env.logs.length;
    const out = r.ok
      ? { ok: true, msg: r.submitted ? `Enviado a Vita · ${n} logs` : `Pegado en el chat de Vita · ${n} logs (pulsa enviar en Grok)` }
      : { ok: false, error: r.error };
    await record({ key, ok: out.ok, at: new Date().toISOString(), batch: env.batch_id, rev: env.revision,
      logs: n, via: m.via, msg: out.msg || out.error });
    return out;
  })();
  inflight.set(key, p);
  p.finally(() => setTimeout(() => inflight.delete(key), 10000));
  return p;
}

chrome.runtime.onMessage.addListener((m, _sender, reply) => {
  if (!m || !m.type) return;
  if (m.type === "rs-vita-batch") {
    handleBatch(m).then(reply, (e) => reply({ ok: false, error: String((e && e.message) || e) }));
    return true;
  }
  if (m.type === "rs-test") {
    getConfig()
      .then((cfg) => deliverText(`[Prueba Rebuild Strong → ${AGENT.name}] Mensaje de prueba de la extensión, ignóralo.`, cfg))
      .then(reply, (e) => reply({ ok: false, error: String((e && e.message) || e) }));
    return true;
  }
  if (m.type === "rs-defaults") { reply(DEFAULTS); return; }
});
