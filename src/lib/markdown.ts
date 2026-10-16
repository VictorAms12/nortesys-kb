import { remark } from "remark";

type MarkdownRoot = ReturnType<ReturnType<typeof remark>["parse"]>;

// Apenas tipos para a travessia da árvore já produzida pelo remark.
type NoMarcacao = {
  type: string;
  name?: string;
  children?: NoMarcacao[];
  value?: string;
  data?: {
    hName?: string;
    hProperties?: Record<string, string | string[]>;
  };
};

const TIPOS = {
  aviso: { rotulo: "Aviso", estilo: "aviso" },
  dica: { rotulo: "Dica", estilo: "dica" },
  atencao: { rotulo: "Atenção", estilo: "atencao" },
} as const;

/** Plugin de remark: :::aviso, :::dica e :::atencao viram caixas acessíveis. */
export function caixasDeDestaque() {
  return (arvore: MarkdownRoot) => {
    function percorrer(no: NoMarcacao) {
      if (no.type === "containerDirective" && no.name && no.name in TIPOS) {
        const tipo = TIPOS[no.name as keyof typeof TIPOS];
        no.data = {
          ...no.data,
          hName: "aside",
          hProperties: { className: ["destaque", `destaque-${tipo.estilo}`], role: "note" },
        };
        no.children ??= [];
        no.children.unshift({
          type: "paragraph",
          children: [{ type: "strong", children: [{ type: "text", value: tipo.rotulo }] }],
        });
      }
      no.children?.forEach(percorrer);
    }
    percorrer(arvore as unknown as NoMarcacao);
  };
}

/** Copia apenas os itens da seção 'Solução passo a passo', numerados e sem sintaxe Markdown. */
export function extrairPassos(texto: string): string {
  const arvore = remark().parse(texto);
  const linhas: string[] = [];
  function textoSimples(no: unknown): string {
    if (!no || typeof no !== "object") return "";
    const atual = no as { value?: string; children?: unknown[] };
    return typeof atual.value === "string"
      ? atual.value
      : (atual.children ?? []).map(textoSimples).join("");
  }
  for (const no of arvore.children) {
    if (no.type !== "list") continue;
    for (const item of no.children) {
      const linha = textoSimples(item).replace(/\s+/g, " ").trim();
      if (linha) linhas.push(`${linhas.length + 1}. ${linha}`);
    }
  }
  return linhas.length ? linhas.join("\n") : texto.trim();
}
