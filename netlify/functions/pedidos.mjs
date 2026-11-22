import { getStore } from "@netlify/blobs";

// Painel privado: /pedidos?chave=SUA_CHAVE  (a chave fica em PAINEL_CHAVE no Netlify)
// Botões: ✅ marcar como feito / desfazer, 🗑️ excluir do painel.
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const brl = v => Number(v).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });

export default async (req) => {
  const chave = (globalThis.Netlify?.env.get("PAINEL_CHAVE")) || process.env.PAINEL_CHAVE;
  const url = new URL(req.url);
  let form = null;
  if (req.method === "POST") { try { form = Object.fromEntries(new URLSearchParams(await req.text())); } catch { form = {}; } }
  const dada = (form && form.chave) || url.searchParams.get("chave") || "";
  if (!chave || dada !== chave) return new Response("Acesso negado", { status:403, headers:{ "content-type":"text/plain; charset=utf-8" } });

  const store = globalThis.__G3D_STORE || getStore("pedidos");

  if (form && form.id && /^[\w-]{1,80}$/.test(form.id)) {
    if (form.acao === "excluir") await store.delete(form.id);
    else if (form.acao === "feito" || form.acao === "desfazer") {
      const p = await store.get(form.id, { type:"json" });
      if (p) { p.feito = form.acao === "feito"; p.feitoEm = p.feito ? new Date().toISOString() : null; await store.setJSON(form.id, p); }
    }
    return new Response(null, { status:303, headers:{ Location: `${url.pathname}?chave=${encodeURIComponent(chave)}` } });
  }

  const { blobs } = await store.list();
  const keys = blobs.map(b => b.key).sort().reverse().slice(0, 300);
  const lista = (await Promise.all(keys.map(async k => ({ k, p: await store.get(k, { type:"json" }) })))).filter(x => x.p);
  lista.sort((a, b) => (a.p.feito === b.p.feito ? 0 : a.p.feito ? 1 : -1));
  const pend = lista.filter(x => !x.p.feito).length;

  const botao = (k, acao, txt, cls, confirma) =>
    `<form method="post" ${confirma ? `onsubmit="return confirm('${confirma}')"` : ""}><input type="hidden" name="chave" value="${esc(chave)}"><input type="hidden" name="id" value="${esc(k)}"><input type="hidden" name="acao" value="${acao}"><button class="${cls}">${txt}</button></form>`;

  const cards = lista.map(({ k, p }) => `
    <div class="p${p.feito ? " ok" : ""}"><div class="t"><b>${p.feito ? "✅ " : "🟡 "}${esc(p.pedido)}</b><span>${new Date(p.quando).toLocaleString("pt-BR",{ timeZone:"America/Sao_Paulo" })}</span></div>
      <div>${(p.itens||[]).map(i => "• "+esc(i)).join("<br>")}</div>
      <div class="v">${brl(p.total)} · ${esc(p.tipo)} · MP nº ${esc(p.mp)}</div>
      <div class="e">📍 <b>${esc(p.nome)}</b><br>${esc(p.linha1)}<br>${esc(p.linha2)}<br>CEP ${esc(p.cep)}</div>
      <div class="b"><a href="${esc(p.etiqueta)}" target="_blank">🏷️ Etiqueta</a>
        ${p.feito ? botao(k, "desfazer", "↩️ Desfazer", "g") : botao(k, "feito", "✅ Feito", "ok")}
        ${botao(k, "excluir", "🗑️ Excluir", "x", `Excluir o pedido ${esc(p.pedido)} do painel? Isso não pode ser desfeito.`)}</div></div>`).join("")
    || "<p>Nenhum pedido pago ainda.</p>";

  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pedidos – Guerra 3D</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="60">
<style>body{font-family:system-ui,sans-serif;background:#05070d;color:#fff;margin:0;padding:16px}h1{font-size:22px}
.p{background:#111827;border:1px solid #1f2a3d;border-radius:14px;padding:14px;margin:12px 0;max-width:560px}
.p.ok{opacity:.55;border-color:#25d366}
.t{display:flex;justify-content:space-between;gap:10px;margin-bottom:8px}.t span{color:#9aa7bd;font-size:13px}
.v{color:#00c8ff;margin:8px 0}.e{color:#dbe4f3;font-size:14px;margin-bottom:10px}
.b{display:flex;flex-wrap:wrap;gap:8px}.b form{margin:0}
a,button{display:inline-block;border:0;cursor:pointer;color:#fff;text-decoration:none;padding:9px 14px;border-radius:30px;font:600 14px system-ui}
a{background:#1e8fff}button.ok{background:#1faa55}button.g{background:#374151}button.x{background:#b42318}</style></head>
<body><h1>🛒 Pedidos pagos – Guerra 3D</h1><p style="color:#9aa7bd">${pend} para enviar · ${lista.length - pend} feito(s). Atualiza sozinho a cada minuto.</p>${cards}</body></html>`,
    { headers:{ "content-type":"text/html; charset=utf-8", "cache-control":"no-store" } });
};
