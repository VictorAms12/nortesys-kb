import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPapel } from "../../../../lib/autenticacao-servidor";
import { obterRegistroArtigo } from "../../../../lib/artigos-banco";
import { FormularioArtigo } from "../../../../components/formulario-artigo";
import { AlertaAdmin } from "../../../../components/alerta-admin";
type Props={params:Promise<{id:string}>;searchParams:Promise<{aviso?:string}>};
export default async function Editar({params,searchParams}:Props){
  await exigirPapel(["administrador","editor"]);
  const {id}=await params;const {aviso}=await searchParams;
  const registro=await obterRegistroArtigo(id);if(!registro)notFound();
  return <section><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link href="/admin/artigos">← Todos os artigos</Link><Link href={`/admin/artigos/${id}/historico`} className="botao-secundario">Histórico de versões</Link></div>
  <h2 className="titulo-secao mb-5">{registro.arquivado?"Artigo arquivado":`Editar: ${registro.titulo}`}</h2><AlertaAdmin codigo={aviso}/>
  {registro.arquivado?<p className="cartao p-6">Este artigo foi arquivado. Consulte o histórico para revisar versões anteriores.</p>:<><FormularioArtigo registro={registro}/><form action="/api/admin/artigos" method="post" className="mt-5"><input type="hidden" name="acao" value="arquivar"/><input type="hidden" name="id" value={registro.id}/><input type="hidden" name="versao" value={registro.versao}/><button type="submit" className="botao-secundario">Arquivar artigo</button></form></>}
  </section>;
}
