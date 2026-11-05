const $ = (id) => document.getElementById(id);
const st = (t, cls) => { $("st").textContent = t; $("st").className = cls || ""; };
let DEFAULTS = null;

function fill(cfg) {
  $("chatUrl").value = cfg.chatUrl;
  $("autoSubmit").checked = !!cfg.autoSubmit;
  $("activate").checked = !!cfg.activate;
  $("inputSelectors").value = cfg.inputSelectors.join("\n");
  $("sendSelectors").value = cfg.sendSelectors.join("\n");
}
const lines = (id) => $(id).value.split("\n").map((s) => s.trim()).filter(Boolean);

async function load() {
  DEFAULTS = await chrome.runtime.sendMessage({ type: "rs-defaults" });
  const { config, sent = [] } = await chrome.storage.local.get(["config", "sent"]);
  fill({ ...DEFAULTS, ...(config || {}) });
  $("log").innerHTML = sent.length
    ? sent.map((x) => `<li><span class="${x.ok ? "ok" : "ko"}">${x.ok ? "✓" : "✗"}</span> <b>${esc(x.batch)}</b> r${x.rev} · ${x.logs} logs · ${esc(x.via || "")}<br>${new Date(x.at).toLocaleString()} · ${esc(x.msg || "")}</li>`).join("")
    : "<li>Aún no se ha enviado ningún lote.</li>";
  chrome.action.setBadgeText({ text: "" });
}
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

$("save").onclick = async () => {
  let url;
  try { url = new URL($("chatUrl").value.trim()); } catch (e) { return st("URL no válida", "ko"); }
  // Hosts fuera de grok.com / x.com necesitan permiso explícito (petición dentro del clic).
  const origin = `${url.protocol}//${url.host}/*`;
  if (!(await chrome.permissions.contains({ origins: [origin] }))) {
    const granted = await chrome.permissions.request({ origins: [origin] });
    if (!granted) return st("Sin permiso para " + url.host, "ko");
  }
  const config = { chatUrl: url.href, autoSubmit: $("autoSubmit").checked, activate: $("activate").checked,
    inputSelectors: lines("inputSelectors"), sendSelectors: lines("sendSelectors") };
  await chrome.storage.local.set({ config });
  st("Guardado", "ok");
};
$("reset").onclick = async () => { await chrome.storage.local.remove("config"); fill(DEFAULTS); st("Valores por defecto restaurados", "ok"); };
$("test").onclick = async () => {
  st("Enviando mensaje de prueba…");
  const r = await chrome.runtime.sendMessage({ type: "rs-test" });
  st(r && r.ok ? (r.submitted ? "✓ Prueba enviada a Grok" : "✓ Prueba pegada (sin enviar)") : "✗ " + ((r && r.error) || "error"), r && r.ok ? "ok" : "ko");
};
load();
