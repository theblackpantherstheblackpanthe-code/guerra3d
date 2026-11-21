import { getStore } from "@netlify/blobs";

// Abra /.netlify/functions/telegram-setup depois de mandar "oi" para o seu bot no Telegram.
// Ele descobre o seu chat e guarda, para os avisos de venda chegarem lá.
export default async () => {
  const tk = (globalThis.Netlify?.env.get("TELEGRAM_TOKEN")) || process.env.TELEGRAM_TOKEN;
  const out = (t, s=200) => new Response(t, { status:s, headers:{ "content-type":"text/plain; charset=utf-8" } });
  if (!tk) return out("Falta a chave TELEGRAM_TOKEN no Netlify.", 503);
  const r = await fetch(`https://api.telegram.org/bot${tk}/getUpdates`);
  const d = await r.json().catch(()=>({}));
  if (!d.ok) return out("Token do Telegram inválido.", 400);
  const msg = [...(d.result||[])].reverse().find(u => u.message?.chat?.id)?.message;
  if (!msg) return out("Mande uma mensagem (ex.: oi) para o seu bot no Telegram e abra esta página de novo.");
  await getStore("config").set("telegram_chat", String(msg.chat.id));
  await fetch(`https://api.telegram.org/bot${tk}/sendMessage`, { method:"POST", headers:{ "content-type":"application/json" },
    body: JSON.stringify({ chat_id: msg.chat.id, text: "✅ Guerra 3D conectada! Os avisos de venda vão chegar aqui." }) });
  return out(`Pronto! Conectado com ${msg.chat.first_name || "você"}. Os avisos de venda vão chegar no Telegram.`);
};
