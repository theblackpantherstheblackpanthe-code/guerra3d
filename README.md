# Guerra 3D – loja online

- `index.html`: o site inteiro (imagens embutidas).
- `netlify/functions/`: pagamento no débito pelo Mercado Pago (Checkout Pro).
- `netlify/lib/loja.mjs`: preços e frete conferidos no servidor. Se mudar preço ou frete no site, mude aqui também.

Configuração no Netlify: variável `MP_ACCESS_TOKEN` com o Access Token de produção do Mercado Pago.
