// Catálogo e frete conferidos no servidor (o cliente não consegue mudar preço).
// Se mudar preço ou frete no site, mude aqui também.
export const PRODUTOS = {
  1: { nome: "Axolote Articulado", preco: 28.99,
       cores: ["Verde","Branco","Amarelo","Azul","Roxo","Preto","Bege","Dourado"] },
};
export const FRETE = { "ES":12.90, "Sudeste":18.90, "Sul":24.90, "Centro-Oeste":26.90, "Nordeste":28.90, "Norte":34.90 };
export function regiaoPorCep(cep){
  const n = +String(cep).replace(/\D/g,"").slice(0,5);
  if(n>=29000 && n<=29999) return "ES";
  if(n>=1000 && n<=39999) return "Sudeste";
  if(n>=40000 && n<=65999) return "Nordeste";
  if((n>=66000 && n<=69999) || (n>=76800 && n<=77999)) return "Norte";
  if(n>=70000 && n<=79999) return "Centro-Oeste";
  if(n>=80000 && n<=99999) return "Sul";
  return null;
}
export const json = (obj, status=200) => new Response(JSON.stringify(obj), { status, headers: { "content-type":"application/json" } });
export const token = () => (globalThis.Netlify?.env.get("MP_ACCESS_TOKEN")) || process.env.MP_ACCESS_TOKEN;
