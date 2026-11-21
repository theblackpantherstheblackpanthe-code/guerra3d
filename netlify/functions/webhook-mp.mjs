import { token } from "../lib/loja.mjs";
import { getStore } from "@netlify/blobs";

// O Mercado Pago chama esta função quando um pagamento muda.
// Se estiver aprovado, manda o pedido + link da etiqueta para o WhatsApp da loja (CallMeBot).
const LOJA_WHATS = "+5527981647374";
const brl = v => Number(v).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });

export default async (req) => {
  const ok = new Response("ok");
  try {
    const url = new URL(req.url);
    let body = {}; try { body = await req.json(); } catch {}
    const tipo = body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic");
    const id = String(body?.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id") || "");
    if (tipo !== "payment" || !/^\d{5,20}$/.test(id) || !token()) return ok;

    // Confere direto no Mercado Pago (ninguém consegue fingir um pagamento)
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers:{ Authorization:`Bearer ${token()}` } });
    if (!r.ok) return ok;
    const p = await r.json();
    if (p.status !== "approved") return ok;

    // Não avisar duas vezes o mesmo pagamento
    let store = null;
    try { store = getStore("pagamentos-avisados"); if (await store.get(id)) return ok; } catch {}

    const m = p.metadata || {};
    const cep = String(m.cep||"").replace(/^(\d{5})(\d{3})$/, "$1-$2");
    const tipoPg = { bank_transfer:"Pix", credit_card:"Cartão de crédito", debit_card:"Cartão de débito", account_money:"Saldo Mercado Pago", prepaid_card:"Cartão pré-pago" }[p.payment_type_id] || p.payment_type_id;
    const etq = Buffer.from(JSON.stringify({ n:m.pedido, d:{ nome:m.nome, linha1:m.linha1, linha2:m.linha2 }, c:cep,
      i:String(m.itens||"").split(" | ").filter(Boolean), pg:tipoPg, t:p.transaction_amount })).toString("base64url");
    const site = m.site || url.origin;
    const texto =
`🛒 *NOVA VENDA – PAGAMENTO APROVADO* ✅

🧾 Pedido *${m.pedido}*
${String(m.itens||"").split(" | ").map(i=>"• "+i).join("\n")}
💰 Total: *${brl(p.transaction_amount)}* (${tipoPg})
Mercado Pago nº ${p.id}

📍 *Enviar para:*
${m.nome}
${m.linha1}
${m.linha2}
CEP ${cep}

🏷️ Etiqueta: ${site}/#etiqueta=${etq}`;

    const key = (globalThis.Netlify?.env.get("CALLMEBOT_KEY")) || process.env.CALLMEBOT_KEY;
    if (!key) { console.log("CALLMEBOT_KEY não configurada", texto); return ok; }
    const z = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(LOJA_WHATS)}&text=${encodeURIComponent(texto)}&apikey=${encodeURIComponent(key)}`);
    console.log("CallMeBot", z.status);
    if (z.ok && store) { try { await store.set(id, new Date().toISOString()); } catch {} }
  } catch (e) { console.log("webhook erro", e?.message); }
  return ok;
};
