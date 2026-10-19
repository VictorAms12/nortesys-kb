import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPapel } from "../../../../../lib/autenticacao-servidor";
import { listarVersoesArtigo, obterRegistroArtigo } from "../../../../../lib/artigos-banco";
type Props={params:Promise<{id:string}>};
export default async function Historico({params}:Props){
  await exigirPapel(["administrador","editor"]);
  const {id}=await params;const atual=await obterRegistroArtigo(id);if(!atual)notFound();
  const versoes=await listarVersoesArtigo(id);
  return <section><Link href={`/admin/artigos/${id}`}>← Voltar ao artigo</Link><h2 className="titulo-secao my-5">Histórico: {atual.titulo}</h2>
  <p className="mb-5 text-sm text-[var(--muted)]">Cada edição é registrada com data, editor e conteúdo daquela versão. Você pode comparar o conteúdo de uma versão anterior com o atual ou recuperá-lo como uma nova edição.</p>
  <div className="grid gap-4">{versoes.map(v=><details className="cartao p-5" key={v.versao}><summary className="cursor-pointer font-semibold">Versão {v.versao} · {v.acao} · {v.editor??"Usuário removido"} · {new Date(v.data).toLocaleString("pt-BR")}</summary><div className="mt-3 flex flex-wrap gap-3">{!atual.arquivado&&v.versao<atual.versao&&<Link className="botao-secundario" href={`/admin/artigos/${id}?restaurar=${v.versao}`}>Preparar restauração</Link>}</div><div className="mt-4 grid gap-3 lg:grid-cols-2"><div><h3 className="mb-2 text-sm font-bold">Versão {v.versao}</h3><pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] p-4 text-xs">{v.conteudo}</pre></div><div><h3 className="mb-2 text-sm font-bold">Versão atual ({atual.versao})</h3><pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] p-4 text-xs">{atual.conteudo}</pre></div></div></details>)}</div>
  </section>;
}
