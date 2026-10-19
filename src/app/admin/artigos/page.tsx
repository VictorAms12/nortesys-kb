import Link from "next/link";
import { exigirPapel } from "../../../lib/autenticacao-servidor";
import { listarRegistrosArtigos } from "../../../lib/artigos-banco";
import { AlertaAdmin } from "../../../components/alerta-admin";
import { PesquisaAdminArtigos } from "../../../components/pesquisa-admin-artigos";
import { TIPOS_CONTEUDO, tipoConteudoValido } from "../../../lib/tipos-conteudo";
import matter from "gray-matter";
function nomeTipo(conteudo:string):string { const tipo:unknown=matter(conteudo).data.tipo;return TIPOS_CONTEUDO[tipoConteudoValido(tipo)?tipo:"solucao"].nome; }
type Props={searchParams:Promise<{aviso?:string}>};
export default async function Artigos({searchParams}:Props) {
  await exigirPapel(["administrador","editor"]);
  const artigos=await listarRegistrosArtigos();
  const {aviso}=await searchParams;
  return <section className="space-y-6">
    <AlertaAdmin codigo={aviso}/>
    <div className="cabecalho-pagina"><div><p className="sobre-titulo">Conteúdo editorial</p><h2 className="titulo-secao">Gerenciar artigos</h2><p className="mt-2 text-sm text-[var(--muted)]">{artigos.length} registro(s) no Neon, incluindo arquivados.</p></div><Link className="botao-primario" href="/admin/artigos/novo">+ Novo artigo</Link></div>
    <PesquisaAdminArtigos artigos={artigos.map(a=>({id:a.id,titulo:a.titulo,categoria:a.categoria,slug:a.slug,status:a.status,arquivado:a.arquivado,versao:a.versao,tipo:nomeTipo(a.conteudo)}))}/>
    <p className="text-xs leading-6 text-[var(--muted)]">Os artigos antigos em arquivos Markdown continuam na biblioteca, mas sua edição permanece disponível apenas no código-fonte.</p>
  </section>;
}
