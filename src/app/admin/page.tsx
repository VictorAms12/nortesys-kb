import Link from "next/link";
import { exigirPapel } from "../../lib/autenticacao-servidor";
import { consultar } from "../../lib/banco";
import { IconeInterface } from "../../components/icone-interface";
export default async function Dashboard() {
  const usuario=await exigirPapel(["administrador","editor"]);
  const [artigos,usuarios]=await Promise.all([
    consultar<{total:number;publicados:number;rascunhos:number}>(`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE status='revisado')::int AS publicados,
      count(*) FILTER (WHERE status='rascunho')::int AS rascunhos
      FROM kb_artigos WHERE arquivado=false`),
    usuario.papel==="administrador"?consultar<{total:number}>("SELECT count(*)::int AS total FROM kb_usuarios WHERE ativo=true"):Promise.resolve([]),
  ]);
  const indicadores=[
    {label:"Artigos no banco",valor:artigos[0]?.total??0,icone:"livro" as const},
    {label:"Publicados",valor:artigos[0]?.publicados??0,icone:"escudo" as const},
    {label:"Rascunhos",valor:artigos[0]?.rascunhos??0,icone:"arquivo" as const},
    ...(usuario.papel==="administrador"?[{label:"Usuários ativos",valor:usuarios[0]?.total??0,icone:"usuarios" as const}]:[]),
  ];
  return <div className="space-y-7">
   <section aria-label="Indicadores administrativos" className="admin-resumo-grade">
    {indicadores.map(ind=><div className="admin-resumo-item" key={ind.label}>
     <span>{ind.label}</span><strong className="tabular-nums">{ind.valor}</strong>
    </div>)}
   </section>
   <section className="painel-lista" aria-labelledby="gerenciar-base">
    <div className="cabecalho-lista"><h2 id="gerenciar-base">Gerenciar a base</h2></div>
    <div className="admin-acessos-lista">
     <Link href="/admin/artigos" className="admin-acesso"><IconeInterface nome="artigos"/>
      <span><strong>Artigos e versões</strong><small>Criar, revisar, publicar e arquivar</small></span></Link>
     {usuario.papel==="administrador"&&<>
      <Link href="/admin/usuarios" className="admin-acesso"><IconeInterface nome="usuarios"/>
       <span><strong>Usuários</strong><small>Contas, acesso e permissões</small></span></Link>
      <Link href="/admin/auditoria" className="admin-acesso"><IconeInterface nome="auditoria"/>
       <span><strong>Auditoria</strong><small>Ações administrativas recentes</small></span></Link>
      <Link href="/admin/indicadores" className="admin-acesso"><IconeInterface nome="indicadores"/>
       <span><strong>Indicadores e feedback</strong><small>Consultas, avaliações e lacunas</small></span></Link>
      <Link href="/admin/manutencao" className="admin-acesso"><IconeInterface nome="manutencao"/>
       <span><strong>Manutenção</strong><small>Limpeza segura e fila de imagens</small></span></Link>
     </>}
    </div>
   </section>
   <p className="text-xs text-[var(--muted)]">Indicadores do Neon; artigos históricos em Markdown não entram na contagem do banco.</p>
  </div>;
}
