import type {DocumentoBusca} from "../../src/lib/indice-busca";
import {carregarArtigos} from "../../src/lib/artigos";
import {criarIndiceBusca} from "../../src/lib/indice-busca";
/** Corpus sintético, sem ler Neon de produção. */
function artigo(url:string,titulo:string,resumo:string,tags:string[],conteudoBusca:string,codigosErro:string[]=[],sistema="Nortesys"):DocumentoBusca {
 return {url,titulo,resumo,tags,conteudoBusca,codigosErro,sistema,nomeCategoria:"Suporte técnico",
  categoria:url.split("/")[2],nivel:"N1",status:"revisado",tipo:"tutorial",
  atualizadoEm:"2026-10-01",revisarAte:undefined} as DocumentoBusca;
}
export function documentosOuro():DocumentoBusca[]{
 return [
  ...criarIndiceBusca(carregarArtigos()),
  artigo("/artigos/infra/impressora-spooler","Configurar impressora e spooler",
    "Impressão de documentos e fila de impressão",["impressora","imprimir","spooler","impressao"],
    "Como configurar impressora, instalar drivers, limpar fila de impressão e reiniciar spooler."),
  artigo("/artigos/notas-fiscais/emissao-nfe","Emissão de NF-e e DANFE",
    "Nota fiscal eletrônica e geração de XML",["nfe","nota fiscal eletrônica","danfe","xml","chave de acesso"],
    "Erro 539 ao transmitir a nota fiscal eletrônica. Corrigir rejeição 539 e imprimir DANFE.",["539"]),
  artigo("/artigos/notas-fiscais/emissao-nfce","Emissão de NFC-e",
    "Nota fiscal do consumidor eletrônica",["nfce","nota fiscal consumidor","cupom"],
    "Emitir NFC-e no caixa, corrigir rejeição 602 e consultar o consumidor.",["602"]),
  artigo("/artigos/fiscal/cfop","Configuração de CFOP 6102",
    "Natureza de operação e código fiscal",["cfop","6102"],
    "Selecionar o CFOP 6102 conforme a operação e a orientação fiscal.",["6102"]),
  artigo("/artigos/fiscal/cst-csosn","CST e CSOSN",
    "Código de situação tributária",["cst","csosn","tributacao"],
    "Diferenças de CST e CSOSN na emissão de nota fiscal."),
  artigo("/artigos/fiscal/ncm","Cadastro de NCM",
    "Classificação fiscal de produtos",["ncm","classificacao"],
    "Conferir NCM de mercadoria no cadastro de produto."),
  artigo("/artigos/certificados/a1-a3","Instalar certificado digital A1 e A3",
    "Certificado de assinatura digital",["certificado digital","a1","a3","certificados"],
    "Instalar certificado A1 ou A3 e testar assinatura digital do emissor."),
  artigo("/artigos/cadastros/fornecedor","Cadastrar fornecedor",
    "Cadastro e atualização de fornecedores",["fornecedor","fornecedores"],
    "Cadastrar fornecedor no ERP e validar dados do cadastro."),
  artigo("/artigos/cadastros/produto","Cadastrar produtos no ERP",
    "Cadastro de produto e atualização de estoque",["produto","produtos"],
    "Criar cadastro de produtos e revisar grupo, marca e fornecedor."),
  artigo("/artigos/infra/vpn","Configurar VPN e ponto de rede",
    "Conectar filial e testar cabos",["vpn","rede","conexao"],
    "Configurar VPN, verificar conexão, testar ponto de rede, cabo e IP."),
  artigo("/artigos/infra/lentidao","Resolver lentidão no ERP",
    "Sistema lento e demora para abrir",["lentidao","lento","demora"],
    "Analisar lentidão do sistema, banco e rede antes de otimizar."),
  artigo("/artigos/infra/login","Erro ao entrar no sistema",
    "Falha de autenticação no login",["login","acesso","senha"],
    "Corrigir falha de login quando o sistema não abre ou trava."),
  artigo("/artigos/infra/backup","Restaurar backup PostgreSQL",
    "Procedimentos de backup e restauração",["backup","restauracao","postgresql"],
    "Restaurar arquivo de backup e verificar integridade dos dados."),
  artigo("/artigos/fiscal/ibscbs","Reforma tributária IBS e CBS",
    "Novos impostos e classificação fiscal",["ibs","cbs","reforma tributaria"],
    "Reforma tributária, base de cálculo de IBS e CBS e configuração de imposto.")
 ];
}
