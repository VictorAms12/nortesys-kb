import Link from "next/link";
import Image from "next/image";
import {notFound} from "next/navigation";
import {exigirSessao} from "../../../lib/autenticacao-servidor";
import {consultar} from "../../../lib/banco";
export const dynamic="force-dynamic";
type Pessoa={id:string;nome:string;usuario:string;papel:string;bio:string|null;avatar_caminho:string|null;presenca:string};
export default async function Colaborador({params}:{params:Promise<{id:string}>}){
 await exigirSessao();
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const pessoas=await consultar<Pessoa>(`SELECT u.id,u.nome,u.usuario,u.papel,u.bio,u.avatar_caminho,
 CASE WHEN p.visto_em>NOW()-INTERVAL '120 seconds' THEN CASE
 WHEN p.ativo_em>NOW()-INTERVAL '5 minutes' THEN 'online' ELSE 'ausente' END ELSE 'offline' END AS presenca
 FROM kb_usuarios u LEFT JOIN kb_chat_presenca p ON p.usuario_id=u.id
 WHERE u.id=$1 AND u.ativo=true LIMIT 1`,[id]);
 const pessoa=pessoas[0];if(!pessoa)notFound();
 return <main id="conteudo" className="conteiner py-9"><p className="sobre-titulo">Equipe Nortesys</p><h1 className="titulo-pagina mt-2">Perfil do colaborador</h1>
 <div className="cartao mt-6 max-w-xl space-y-5 p-6">
 <div className="flex items-center gap-4">
 <div className="avatar-sidebar !h-16 !w-16 overflow-hidden text-2xl">{pessoa.avatar_caminho?
 <Image unoptimized src={"/api/perfil/avatar/"+pessoa.id} width={64} height={64} alt="Foto do colaborador" className="h-full w-full object-cover"/>:
 pessoa.nome[0]?.toUpperCase()}</div>
 <div><h2 className="text-xl font-bold">{pessoa.nome}</h2><p className="text-sm text-[var(--muted)]">@{pessoa.usuario} · {pessoa.papel}</p></div></div>
 <p className="text-sm text-[var(--muted)]">Disponibilidade aproximada: {pessoa.presenca}</p>
 <p className="border-t border-[var(--border)] pt-4 text-sm">{pessoa.bio||"Sem apresentação profissional cadastrada."}</p>
 <Link href="/chat" className="botao-primario">Abrir chat da equipe</Link>
 </div></main>;
}
