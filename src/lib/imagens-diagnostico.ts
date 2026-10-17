import { BlobAccessError, BlobClientTokenExpiredError, BlobStoreNotFoundError } from "@vercel/blob";

export type EtapaImagem = "blob_gravar" | "banco_confirmar" | "blob_compensar" | "banco_compensar";
export type DiagnosticoImagem = { etapa: EtapaImagem; codigo: string };

/** Classifica internamente o erro; nunca retorna mensagem, URL, token ou stack do SDK. */
export function diagnosticoImagem(falha: unknown, etapa: EtapaImagem): DiagnosticoImagem {
  if (etapa === "banco_confirmar" || etapa === "banco_compensar") return { etapa, codigo: "IMAGEM_BANCO_CONFIRMACAO" };
  const mensagem = falha instanceof Error ? falha.message : "";
  let codigo = "BLOB_FALHA_NAO_IDENTIFICADA";
  if (/No blob credentials found|No read-write token found/i.test(mensagem)) codigo = "BLOB_CREDENCIAIS_AUSENTES";
  else if (/OIDC is enabled.*not for this token.s environment/i.test(mensagem)) codigo = "BLOB_OIDC_AMBIENTE_NAO_PERMITIDO";
  else if (falha instanceof BlobClientTokenExpiredError || /token.*expired|expired.*token/i.test(mensagem)) codigo = "BLOB_CREDENCIAL_EXPIRADA";
  else if (falha instanceof BlobAccessError) codigo = "BLOB_ACESSO_NEGADO";
  else if (falha instanceof BlobStoreNotFoundError) codigo = "BLOB_STORE_NAO_ENCONTRADO";
  else if (/no storeId was found/i.test(mensagem)) codigo = "BLOB_STORE_ID_AUSENTE";
  else if (/(?:access|private|public).*(?:store|mismatch)|store.*(?:access|private|public)/i.test(mensagem)) codigo = "BLOB_MODO_ARMAZENAMENTO";
  return { etapa, codigo };
}
