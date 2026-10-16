import Link from "next/link";
import { exigirPapel } from "../../lib/autenticacao-servidor";
import { consultar } from "../../lib/banco";
export default async function Dashboard() {
  const usuario=await exigirPapel(["administrador","editor"]);
  const [artigos,usuarios]=await Promise.all([
    consultar<{total:number}>("SELECT count(*)::int AS total FROM kb_artigos WHERE arquivado=false"),
    usuario.papel==="administrador"?consultar<{total:number}>("SELECT count(*)::int AS total FROM kb_usuarios WHERE ativo=true"):Promise.resolve([]),
  ]);
  return <section className="grid gap-4 sm:grid-cols-2">
    <Link href="/admin/artigos" className="cartao p-6 no-underline"><p className="sobre-titulo">Artigos no banco</p><strong className="mt-2 block text-3xl">{artigos[0]?.total??0}</strong><p className="mt-3 text-[var(--muted)]">Criar, revisar, publicar e consultar o histórico →</p></Link>
    {usuario.papel==="administrador" && <Link href="/admin/usuarios" className="cartao p-6 no-underline"><p className="sobre-titulo">Usuários ativos</p><strong className="mt-2 block text-3xl">{usuarios[0]?.total??0}</strong><p className="mt-3 text-[var(--muted)]">Gerenciar colaboradores e permissões →</p></Link>}
    <p className="text-sm leading-7 text-[var(--muted)] sm:col-span-2">Os artigos antigos em Markdown seguem disponíveis. Os artigos criados no painel são persistidos no Neon, incluindo seu histórico de versões.</p>
  </section>;
}
