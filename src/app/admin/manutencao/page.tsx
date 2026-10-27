import Link from "next/link";
import {exigirPapel} from "../../../lib/autenticacao-servidor";
import {situacaoManutencao} from "../../../lib/manutencao";
import {BotaoConfirmar} from "../../../components/botao-confirmar";
import {FormularioComFeedback} from "../../../components/formulario-com-feedback";
export const dynamic="force-dynamic";
type Props={searchParams:Promise<{aviso?:string}>};
export default async function Manutencao({searchParams}:Props){
 await exigirPapel(["administrador"]);
 const [{aviso},status]=await Promise.all([searchParams,situacaoManutencao()]);
 return <section className="space-y-6">
  <div><p className="sobre-titulo">Fase 7H</p><h2 className="titulo-secao">Manutenção e estabilidade</h2>
   <p className="mt-2 text-sm text-[var(--muted)]">Rotinas manuais e seguras. Arquivos de mensagens ainda acessíveis não são excluídos.</p></div>
  {aviso&&<div role="status" className="cartao p-4 text-sm">{aviso==="concluida"?"Manutenção concluída.":aviso==="parcial"?"Manutenção parcial: alguns arquivos precisarão de nova tentativa.":"Não foi possível concluir a manutenção."}</div>}
  <div className="grid gap-3 sm:grid-cols-3">
   {[["Imagens na fila de exclusão",status.fila],["Disponíveis para nova tentativa",status.pendentes],["Sessões expiradas",status.sessoesExpiradas]].map(([nome,valor])=>
    <div className="cartao p-5" key={nome}><strong className="block text-3xl tabular-nums">{valor}</strong>
     <span className="text-sm text-[var(--muted)]">{nome}</span></div>)}
  </div>
  <div className="cartao space-y-3 p-5"><h3 className="text-lg font-bold">Executar manutenção</h3>
   <p className="text-sm leading-6 text-[var(--muted)]">Remove sessões e tentativas de login expiradas e processa até dez arquivos da fila de mensagens apagadas para todos. Falhas permanecem enfileiradas para repetição. Não remove histórico, feedback nem imagens visíveis.</p>
   <FormularioComFeedback action="/api/admin/manutencao" method="post" mensagemEnvio="Executando manutenção...">
     <input type="hidden" name="acao" value="executar"/>
     <BotaoConfirmar rotulo="Executar manutenção" mensagem="Executar a limpeza de dados expirados e imagens da fila?"/>
   </FormularioComFeedback>
  </div>
  <div className="cartao p-5"><h3 className="text-lg font-bold">Backups e recuperação</h3>
   <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Confira os backups/PITR contratados no Neon, as permissões do Blob e a capacidade de restaurar uma cópia em ambiente isolado. Essa página não cria backups e não apresenta segredos.</p>
   <Link className="mt-3 inline-block underline" href="/admin/indicadores">Consultar indicadores</Link>
  </div>
 </section>;
}
