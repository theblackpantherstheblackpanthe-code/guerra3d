import { getStore } from "@netlify/blobs";

// Painel privado: /pedidos?chave=SUA_CHAVE  (a chave fica em PAINEL_CHAVE no Netlify)
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const brl = v => Number(v).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });

export default async (req) => {
  const chave = (globalThis.Netlify?.env.get("PAINEL_CHAVE")) || process.env.PAINEL_CHAVE;
  const dada = new URL(req.url).searchParams.get("chave") || "";
  if (!chave || dada !== chave) return new Response("Acesso negado", { status:403, headers:{ "content-type":"text/plain; charset=utf-8" } });

  const store = getStore("pedidos");
  const { blobs } = await store.list();
  const keys = blobs.map(b => b.key).sort().reverse().slice(0, 200);
  const pedidos = (await Promise.all(keys.map(k => store.get(k, { type:"json" })))).filter(Boolean);

  const cards = pedidos.map(p => `
    <div class="p"><div class="t"><b>${esc(p.pedido)}</b><span>${new Date(p.quando).toLocaleString("pt-BR",{ timeZone:"America/Sao_Paulo" })}</span></div>
      <div>${p.itens.map(i => "• "+esc(i)).join("<br>")}</div>
      <div class="v">${brl(p.total)} · ${esc(p.tipo)} · MP nº ${esc(p.mp)}</div>
      <div class="e">📍 <b>${esc(p.nome)}</b><br>${esc(p.linha1)}<br>${esc(p.linha2)}<br>CEP ${esc(p.cep)}</div>
      <a href="${esc(p.etiqueta)}" target="_blank">🏷️ Abrir etiqueta</a></div>`).join("") || "<p>Nenhum pedido pago ainda.</p>";

  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pedidos – Guerra 3D</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="60">
<style>body{font-family:system-ui,sans-serif;background:#05070d;color:#fff;margin:0;padding:16px}h1{font-size:22px}
.p{background:#111827;border:1px solid #1f2a3d;border-radius:14px;padding:14px;margin:12px 0;max-width:560px}
.t{display:flex;justify-content:space-between;gap:10px;margin-bottom:8px}.t span{color:#9aa7bd;font-size:13px}
.v{color:#00c8ff;margin:8px 0}.e{color:#dbe4f3;font-size:14px;margin-bottom:10px}
a{display:inline-block;background:#1e8fff;color:#fff;text-decoration:none;padding:9px 14px;border-radius:30px;font-weight:600}</style></head>
<body><h1>🛒 Pedidos pagos – Guerra 3D</h1><p style="color:#9aa7bd">Atualiza sozinho a cada minuto. ${pedidos.length} pedido(s).</p>${cards}</body></html>`,
    { headers:{ "content-type":"text/html; charset=utf-8", "cache-control":"no-store" } });
};
