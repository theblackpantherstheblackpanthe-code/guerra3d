import { PRODUTOS, FRETE, regiaoPorCep, json, token } from "../lib/loja.mjs";

// Cria o pagamento no Mercado Pago (Checkout Pro) e devolve o link para o cliente pagar.
export default async (req) => {
  if (req.method !== "POST") return json({ ok:true, pronto: !!token(), modo: !token() ? "sem token" : (token().startsWith("TEST-") ? "teste" : "producao") });
  if (!token()) return json({ erro:"Pagamento no cartão ainda não configurado." }, 503);
  let b; try { b = await req.json(); } catch { return json({ erro:"Pedido inválido." }, 400); }

  const itens = [];
  for (const it of (b.itens||[]).slice(0,30)) {
    const p = PRODUTOS[it.id]; const q = Math.min(99, Math.max(1, parseInt(it.q)||0));
    if (!p || (p.cores && !p.cores.includes(it.cor))) return json({ erro:"Produto inválido." }, 400);
    itens.push({ id:String(it.id), title:`${p.nome}${it.cor?" - "+it.cor:""}`, quantity:q, unit_price:p.preco, currency_id:"BRL" });
  }
  const reg = regiaoPorCep(b.cep||"");
  if (!itens.length || !reg) return json({ erro:"Carrinho ou CEP inválido." }, 400);
  itens.push({ id:"frete", title:`Frete (${reg})`, quantity:1, unit_price:FRETE[reg], currency_id:"BRL" });

  const num = String(b.num||"").replace(/[^A-Z0-9]/gi,"").slice(0,20) || ("G3D"+Date.now().toString(36).toUpperCase());
  const site = new URL(req.url).origin;
  const pref = {
    items: itens,
    external_reference: num,
    statement_descriptor: "GUERRA3D",
    payer: { name: String(b.nome||"").slice(0,80) },
    payment_methods: { excluded_payment_types: [{ id:"ticket" }, { id:"atm" }], installments: 1, default_installments: 1 },
    back_urls: { success: `${site}/?mp=ok`, pending: `${site}/?mp=pendente`, failure: `${site}/?mp=falhou` },
    auto_return: "approved",
    metadata: { pedido: num, endereco: b.endereco||null, cep: b.cep||"" },
  };
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method:"POST", headers:{ "Authorization":`Bearer ${token()}`, "Content-Type":"application/json" }, body: JSON.stringify(pref),
  });
  const d = await r.json().catch(()=>({}));
  if (!r.ok) return json({ erro:"O Mercado Pago recusou o pedido.", detalhe:d.message||r.status }, 502);
  return json({ link: d.init_point, pedido: num });
};
