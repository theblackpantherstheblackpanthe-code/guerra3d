import { json, token } from "../lib/loja.mjs";

// Confere no Mercado Pago se o pagamento foi mesmo aprovado (não confia só no link de volta).
export default async (req) => {
  const id = new URL(req.url).searchParams.get("id")||"";
  if (!/^\d{5,20}$/.test(id)) return json({ erro:"id inválido" }, 400);
  if (!token()) return json({ erro:"não configurado" }, 503);
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers:{ "Authorization":`Bearer ${token()}` } });
  if (!r.ok) return json({ erro:"pagamento não encontrado" }, 404);
  const p = await r.json();
  return json({ id:p.id, status:p.status, pedido:p.external_reference, valor:p.transaction_amount, tipo:p.payment_type_id });
};
