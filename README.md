# Guerra 3D – loja online

- `index.html`: o site inteiro (imagens embutidas).
- `netlify/functions/`: pagamento no débito pelo Mercado Pago (Checkout Pro).
- `netlify/lib/loja.mjs`: preços e frete conferidos no servidor. Se mudar preço ou frete no site, mude aqui também.

Configuração no Netlify: variável `MP_ACCESS_TOKEN` com o Access Token de produção do Mercado Pago.

## Avisos de venda
- Painel de pedidos pagos: `/.netlify/functions/pedidos?chave=<PAINEL_CHAVE>`
- Variáveis no Netlify: `MP_ACCESS_TOKEN`, `PAINEL_CHAVE`, opcionais `CALLMEBOT_KEY` (WhatsApp) e `TELEGRAM_TOKEN` (Telegram, depois abrir `/.netlify/functions/telegram-setup`).
