/**
 * Fonte única das categorias. Para criar uma nova categoria no futuro:
 * 1. Adicione um objeto aqui.
 * 2. Crie a pasta content/<slug>/.
 * 3. Use o mesmo slug no campo "categoria" dos artigos.
 *
 * Ícones seguem o mesmo conjunto de traços da interface.
 */
export type ConfiguracaoCategoria = {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
};

export const categorias = [
  {
    slug: "erp",
    nome: "ERP",
    descricao: "Acesso, rotinas, erros comuns, parametrização e atualização de versão.",
    icone: "erp",
  },
  {
    slug: "notas-fiscais",
    nome: "Notas Fiscais",
    descricao: "Emissão, rejeições SEFAZ, cancelamento, CC-e, inutilização e contingência.",
    icone: "nota",
  },
  {
    slug: "fiscal-e-impostos",
    nome: "Fiscal e Impostos",
    descricao: "ICMS, PIS/COFINS, IPI, ISS, CFOP, CST/CSOSN, NCM e regimes.",
    icone: "fiscal",
  },
  {
    slug: "cadastros",
    nome: "Cadastros",
    descricao: "Clientes, fornecedores, produtos, transportadoras e usuários.",
    icone: "cadastros",
  },
  {
    slug: "programas-em-geral",
    nome: "Programas em geral",
    descricao: "Instalação, atualização, erros, configuração e licenças.",
    icone: "programas",
  },
  {
    slug: "infraestrutura-e-rede",
    nome: "Infraestrutura e Rede",
    descricao: "Impressoras, VPN, acesso remoto, Active Directory e backup.",
    icone: "rede",
  },
  {
    slug: "procedimentos-e-boas-praticas",
    nome: "Procedimentos e Boas Práticas",
    descricao: "Padrão de atendimento, escalonamento e respostas ao cliente.",
    icone: "procedimentos",
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
