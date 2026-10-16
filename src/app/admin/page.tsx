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
  return <div className="space-y-8">
    <section aria-label="Indicadores administrativos" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{indicadores.map(ind=><div key={ind.label} className="cartao indicador-admin"><span className="icone-indicador"><IconeInterface nome={ind.icone}/></span><strong>{ind.valor}</strong><span className="text-sm text-[var(--muted)]">{ind.label}</span></div>)}</section>
    <section className="cartao p-6"><div className="cabecalho-secao"><div><p className="sobre-titulo">Acesso rápido</p><h2 className="titulo-secao">Gerenciar a base</h2></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Link href="/admin/artigos" className="atalho-admin"><IconeInterface nome="artigos"/><span><strong>Artigos e versões</strong><small>Criar, revisar, publicar e arquivar conteúdos</small></span><IconeInterface nome="seta"/></Link>{usuario.papel==="administrador"&&<><Link href="/admin/usuarios" className="atalho-admin"><IconeInterface nome="usuarios"/><span><strong>Usuários</strong><small>Contas, acesso e permissões</small></span><IconeInterface nome="seta"/></Link><Link href="/admin/auditoria" className="atalho-admin"><IconeInterface nome="auditoria"/><span><strong>Auditoria</strong><small>Consultar ações administrativas recentes</small></span><IconeInterface nome="seta"/></Link></>}</div></section>
    <p className="text-sm leading-7 text-[var(--muted)]">Indicadores do banco Neon. Os artigos históricos em Markdown continuam na biblioteca e não entram na contagem de artigos do banco.</p>
  </div>;
}
