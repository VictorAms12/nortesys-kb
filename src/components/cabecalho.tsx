import Link from "next/link";
import { AlternarTema } from "./alternar-tema";
import { AtalhoBusca } from "./atalho-busca";

export function Cabecalho({ nome, papel }: { nome: string; papel: "administrador" | "editor" | "leitor" }) {
  return (
    <header className="cabecalho-site no-print">
      <div className="conteiner flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg no-underline" aria-label="Nortesys, página inicial">
          <span className="grid size-11 place-items-center rounded-xl bg-teal-700 text-xl font-black text-white" aria-hidden="true">N</span>
          <span className="leading-tight">
            <strong className="block text-[var(--text)]">Nortesys</strong>
            <span className="text-xs text-[var(--muted)]">Base de Conhecimento</span>
          </span>
        </Link>
        <AtalhoBusca />
        <nav aria-label="Navegação principal" className="flex items-center gap-2">
          <Link className="botao-secundario" href="/">Início</Link>
          <Link className="botao-secundario" href="/busca">Busca</Link>
          {papel!=="leitor" && <Link className="botao-secundario" href="/admin">Painel</Link>}
          <Link className="botao-secundario" href="/#categorias">Categorias</Link>
          <span className="hidden max-w-40 truncate text-sm text-[var(--muted)] lg:inline" title={nome}>{nome}</span>
          <AlternarTema />
          <form method="post" action="/api/autenticacao/sair"><button className="botao-secundario" type="submit" title="Encerrar sessão">Sair</button></form>
        </nav>
      </div>
    </header>
  );
}
