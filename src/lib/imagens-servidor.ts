import "server-only";
import { consultar } from "./banco";
import { NOME_COOKIE, obterSessao } from "./sessao";
import { criarRotasImagens } from "./imagens-servico";
import { criarRepositorioImagens } from "./imagens-repositorio";
import { criarArmazenamentoBlob } from "./imagens-blob";

/** O SDK resolve OIDC + BLOB_STORE_ID ou BLOB_READ_WRITE_TOKEN; nenhum segredo chega ao cliente. */
export const rotasImagens = criarRotasImagens({
  diagnosticar: diagnostico => console.error("[imagens]", diagnostico),
  sessao: req => obterSessao(req.cookies.get(NOME_COOKIE)?.value),
  ...criarRepositorioImagens(consultar),
  ...criarArmazenamentoBlob(),
});
