import Link from "next/link";
import { categorias } from "../../config/categorias";

export default function NaoEncontrada() {
  return <main id="conteudo" className="conteiner py-20 text-center">
    <p className="text-5xl font-black text-teal-700">404</p>
    <h1 className="mt-4 text-3xl font-bold">Não encontramos essa página.</h1>
    <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">O endereço pode ter mudado ou o artigo ainda não foi publicado. Use a busca global para encontrar o procedimento ou navegue pelas categorias.</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3"><Link className="botao-primario" href="/busca">Pesquisar artigos</Link><Link className="botao-secundario" href="/">Voltar ao início</Link></div>
    <div className="mt-8 flex flex-wrap justify-center gap-2">{categorias.map(c=><Link className="botao-secundario" key={c.slug} href={`/categorias/${c.slug}`}>{c.nome}</Link>)}</div>
  </main>;
}
