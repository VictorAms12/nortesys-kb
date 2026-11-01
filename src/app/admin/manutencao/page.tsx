import Link from "next/link";
import {exigirPapel} from "../../../lib/autenticacao-servidor";
import {situacaoManutencao} from "../../../lib/manutencao";
import {consultar} from "../../../lib/banco";
import {BotaoConfirmar} from "../../../components/botao-confirmar";
import {FormularioComFeedback} from "../../../components/formulario-com-feedback";
export const dynamic="force-dynamic";
type Props={searchParams:Promise<{aviso?:string}>};
export default async function Manutencao({searchParams}:Props){
 await exigirPapel(["administrador"]);
 const [{aviso},status,alias]=await Promise.all([
  searchParams,situacaoManutencao(),
  consultar<{disponivel:boolean}>("SELECT to_regclass('public.kb_artigo_aliases') IS NOT NULL AS disponivel")
 ]);
 return <section className="space-y-6">
  <div><h2 className="titulo-secao">Manutenção e estabilidade</h2>
   <p className="mt-2 text-sm text-[var(--muted)]">Rotinas manuais e seguras. Arquivos de mensagens ainda acessíveis não são excluídos.</p></div>
  {!status.habilitada&&<p className="aviso-artigo p-4 text-sm" role="status">Migração 009 pendente no Neon. As ferramentas de manutenção permanecerão desativadas até a instalação. O chat existente continua funcionando.</p>}
  {!alias[0]?.disponivel&&<p className="aviso-artigo p-4 text-sm" role="alert">Migração 017 pendente no Neon: URLs antigas de artigos não serão redirecionadas. Confira db:status e aplique a migração antes de publicar.</p>}
  {aviso&&<div role="status" className="cartao p-4 text-sm">{aviso==="concluida"?"Manutenção concluída.":aviso==="parcial"?"Manutenção parcial: alguns arquivos precisarão de nova tentativa.":"Não foi possível concluir a manutenção."}</div>}
  <div className="admin-resumo-grade">
   {[["Imagens na fila de exclusão",status.fila],["Disponíveis para nova tentativa",status.pendentes],["Sessões expiradas",status.sessoesExpiradas]].map(([nome,valor])=>
    <div className="admin-resumo-item" key={nome}><span>{nome}</span><strong className="tabular-nums">{valor}</strong></div>)}
  </div>
  <div className="cartao space-y-3 p-5"><h3 className="text-lg font-bold">Executar manutenção</h3>
   <p className="text-sm leading-6 text-[var(--muted)]">Remove sessões e tentativas de login expiradas e processa até dez arquivos da fila de mensagens apagadas para todos. Falhas permanecem enfileiradas para repetição. Não remove histórico, feedback nem imagens visíveis.</p>
   {status.habilitada&&<FormularioComFeedback action="/api/admin/manutencao" method="post" mensagemEnvio="Executando manutenção...">
     <input type="hidden" name="acao" value="executar"/>
     <BotaoConfirmar rotulo="Executar manutenção" mensagem="Executar a limpeza de dados expirados e imagens da fila?"/>
   </FormularioComFeedback>}
  </div>
  <div className="cartao p-5"><h3 className="text-lg font-bold">Backups e recuperação</h3>
   <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Confira os backups/PITR contratados no Neon, as permissões do Blob e a capacidade de restaurar uma cópia em ambiente isolado. Essa página não cria backups e não apresenta segredos.</p>
   <Link className="mt-3 inline-block underline" href="/admin/indicadores">Consultar indicadores</Link>
  </div>
 </section>;
}
