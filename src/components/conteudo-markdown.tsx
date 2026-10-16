import { isValidElement, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { caixasDeDestaque } from "../lib/markdown";
import { BlocoCodigo } from "./bloco-codigo";
import { ImagemAmpliavel } from "./imagem-ampliavel";

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
          p({ children }) {
            // Uma imagem sozinha não deve ficar dentro de <p><figure>, pois isso gera HTML inválido.
            if (isValidElement(children) && children.type === ImagemAmpliavel) return <>{children}</>;
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
            // As imagens ficam no /public da própria aplicação, sem URLs externas.
            if (!caminho.startsWith("/") || caminho.startsWith("//")) {
              return <span className="text-sm text-[var(--muted)]">[Imagem indisponível: use /imagens/nome.webp]</span>;
            }
            return <ImagemAmpliavel src={caminho} alt={alt || "Imagem ilustrativa do procedimento"} legenda={title} />;
          },
          a({ href, children }) {
            const destino = href ?? "#";
            const externo = /^https?:\/\//i.test(destino);
            return <a href={destino} target={externo ? "_blank" : undefined} rel={externo ? "noopener noreferrer" : undefined}>{children}</a>;
          },
        }}
      >{markdown}</Markdown>
    </div>
  );
}
