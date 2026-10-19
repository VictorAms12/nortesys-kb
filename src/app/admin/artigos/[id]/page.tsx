import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPapel } from "../../../../lib/autenticacao-servidor";
import { obterRegistroArtigo, listarVersoesArtigo } from "../../../../lib/artigos-banco";
import { FormularioArtigo } from "../../../../components/formulario-artigo";
import { AlertaAdmin } from "../../../../components/alerta-admin";
import { AnexosArtigo } from "../../../../components/anexos-artigo";
import { listarAnexosArtigo } from "../../../../lib/anexos";
type Props={params:Promise<{id:string}>;searchParams:Promise<{aviso?:string;restaurar?:string}>};
export default async function Editar({params,searchParams}:Props){
  await exigirPapel(["administrador","editor"]);
  const {id}=await params;const {aviso,restaurar}=await searchParams;
  const registro=await obterRegistroArtigo(id);if(!registro)notFound();
  const versaoEscolhida=restaurar && /^[1-9]\d{0,8}$/.test(restaurar) ? Number(restaurar) : null;
  const historico=versaoEscolhida && !registro.arquivado ? await listarVersoesArtigo(id) : [];
  const recuperada=historico.find(v=>v.versao===versaoEscolhida && v.versao<registro.versao);
  const edicao=recuperada?{...registro,conteudo:recuperada.conteudo}:registro;
  const anexos=registro.arquivado?[]:await listarAnexosArtigo(id);
  return <section><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link href="/admin/artigos">← Todos os artigos</Link><Link href={`/admin/artigos/${id}/historico`} className="botao-secundario">Histórico de versões</Link></div>
  <h2 className="titulo-secao mb-5">{registro.arquivado?"Artigo arquivado":`Editar: ${registro.titulo}`}</h2><AlertaAdmin codigo={aviso}/>
  {registro.arquivado?<p className="cartao p-6">Este artigo foi arquivado. Consulte o histórico para revisar versões anteriores.</p>:<>{recuperada&&<p className="mb-4 rounded-lg border border-[var(--border)] p-4 text-sm"><strong>Recuperação da versão {recuperada.versao}.</strong> Revise todos os campos e clique em “Salvar nova versão”. Nada foi restaurado automaticamente. Anexos permanecem vinculados ao artigo.</p>}<FormularioArtigo registro={edicao}/><AnexosArtigo artigoId={id} iniciais={anexos}/><form action="/api/admin/artigos" method="post" className="mt-5"><input type="hidden" name="acao" value="arquivar"/><input type="hidden" name="id" value={registro.id}/><input type="hidden" name="versao" value={registro.versao}/><button type="submit" className="botao-secundario">Arquivar artigo</button></form></>}
  </section>;
}
