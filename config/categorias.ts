/**
 * Fonte única das categorias. Para criar uma nova categoria no futuro:
 * 1. Adicione um objeto aqui.
 * 2. Crie a pasta content/<slug>/.
 * 3. Use o mesmo slug no campo "categoria" dos artigos.
 *
 * A cor é um código hexadecimal, sem classes Tailwind dinâmicas.
 */
export type ConfiguracaoCategoria = {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: `#${string}`;
};

export const categorias = [
  {
    slug: "erp",
    nome: "ERP",
    descricao: "Acesso, rotinas, erros comuns, parametrização e atualização de versão.",
    icone: "🖥️",
    cor: "#0f766e",
  },
  {
    slug: "notas-fiscais",
    nome: "Notas Fiscais",
    descricao: "Emissão, rejeições SEFAZ, cancelamento, CC-e, inutilização e contingência.",
    icone: "🧾",
    cor: "#1d4ed8",
  },
  {
    slug: "fiscal-e-impostos",
    nome: "Fiscal e Impostos",
    descricao: "ICMS, PIS/COFINS, IPI, ISS, CFOP, CST/CSOSN, NCM e regimes.",
    icone: "📊",
    cor: "#7c3aed",
  },
  {
    slug: "cadastros",
    nome: "Cadastros",
    descricao: "Clientes, fornecedores, produtos, transportadoras e usuários.",
    icone: "👥",
    cor: "#b45309",
  },
  {
    slug: "programas-em-geral",
    nome: "Programas em geral",
    descricao: "Instalação, atualização, erros, configuração e licenças.",
    icone: "🧰",
    cor: "#be185d",
  },
  {
    slug: "infraestrutura-e-rede",
    nome: "Infraestrutura e Rede",
    descricao: "Impressoras, VPN, acesso remoto, Active Directory e backup.",
    icone: "🌐",
    cor: "#0369a1",
  },
  {
    slug: "procedimentos-e-boas-praticas",
    nome: "Procedimentos e Boas Práticas",
    descricao: "Padrão de atendimento, escalonamento e respostas ao cliente.",
    icone: "📋",
    cor: "#4d7c0f",
  },
] as const satisfies readonly ConfiguracaoCategoria[];

export type CategoriaSlug = (typeof categorias)[number]["slug"];

export const slugsCategorias = categorias.map((categoria) => categoria.slug) as [
  CategoriaSlug,
  ...CategoriaSlug[],
];

export function encontrarCategoria(slug: string) {
  return categorias.find((categoria) => categoria.slug === slug);
}
