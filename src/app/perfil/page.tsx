import {exigirSessao} from "../../lib/autenticacao-servidor";
import {PerfilResumo} from "../../components/perfil-resumo";
export const dynamic="force-dynamic";
export default async function PaginaPerfil(){
 await exigirSessao();
 return <main id="conteudo" className="conteiner py-9"><p className="sobre-titulo">Minha conta</p><h1 className="titulo-pagina mt-2">Perfil do colaborador</h1><p className="texto-introducao mt-3">Consulte sua identificação e as preferências vinculadas à sua conta.</p><PerfilResumo/></main>;
}
