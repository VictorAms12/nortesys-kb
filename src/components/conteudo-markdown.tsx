import { isValidElement, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { caixasDeDestaque } from "../lib/markdown";
import { URL_IMAGEM_PRIVADA } from "../lib/imagens";
import { BlocoCodigo } from "./bloco-codigo";
import { ImagemAmpliavel } from "./imagem-ampliavel";

/** Detecta imagens na árvore HTML original do Markdown. */
function contemImagem(no: unknown): boolean {
  if (!no || typeof no !== "object") return false;
  const atual = no as { tagName?: string; children?: unknown[] };
  return atual.tagName === "img" || (Array.isArray(atual.children) && atual.children.some(contemImagem));
}

function textoNo(no: ReactNode): string {
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(textoNo).join("");
  if (isValidElement<{ children?: ReactNode }>(no)) return textoNo(no.props.children);
  return "";
}

export function ConteudoMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="markdown-article">
      <Markdown
        remarkPlugins={[remarkGfm, remarkDirective, caixasDeDestaque]}
        // HTML embutido no Markdown não é interpretado, evitando scripts arbitrários.
        skipHtml
        components={{
          p({ node, children }) {
            // Parágrafos com imagem recebem seu próprio espaçamento.
            if (contemImagem(node)) return <div className="my-4">{children}</div>;
            return <p>{children}</p>;
          },
          pre({ children }) {
            const elemento = isValidElement<{ className?: string; children?: ReactNode }>(children) ? children : null;
            const idioma = elemento?.props.className?.match(/language-([\w-]+)/)?.[1];
            const codigo = textoNo(elemento?.props.children ?? children).replace(/\n$/, "");
            return <BlocoCodigo codigo={codigo} idioma={idioma} />;
          },
          img({ src, alt, title }) {
            const caminho = typeof src === "string" ? src : "";
            // Preserva assets locais; novas imagens usam somente a rota autenticada.
            if (!caminho.startsWith("/") || caminho.startsWith("//") || /[\\\u0000-\u001f]/.test(caminho) ||
                (caminho.startsWith("/api/") && !URL_IMAGEM_PRIVADA.test(caminho))) {
              return <span className="text-sm text-[var(--muted)]">[Imagem indisponível: use uma imagem enviada pelo editor ou /imagens/nome.webp]</span>;
            }
            return <ImagemAmpliavel key={caminho} src={caminho} alt={alt || "Imagem ilustrativa do procedimento"} legenda={title} />;
          },
          a({ node, href, children }) {
            const destino = href ?? "#";
            const externo = /^https?:\/\//i.test(destino);
            // O ampliador contém um botão: não aninhar controles dentro de links.
            if (contemImagem(node)) return <span>{children}<a href={destino} target={externo ? "_blank" : undefined} rel={externo ? "noopener noreferrer" : undefined}>Abrir link da imagem</a></span>;
            return <a href={destino} target={externo ? "_blank" : undefined} rel={externo ? "noopener noreferrer" : undefined}>{children}</a>;
          },
        }}
      >{markdown}</Markdown>
    </div>
  );
}
