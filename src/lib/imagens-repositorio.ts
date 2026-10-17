import { LIMITE_UPLOADS_POR_HORA } from "./imagens";
import { OBTER_IMAGEM, RESERVAR_COTA_IMAGEM } from "./imagens-sql";
import type { DependenciasImagens, RegistroImagem } from "./imagens-servico";

type Consulta = <T>(sql: string, parametros?: unknown[]) => Promise<T[]>;
export function criarRepositorioImagens(consultar: Consulta): Pick<DependenciasImagens, "reservarCota" | "inserir" | "estado" | "obter"> {
  return {
    reservarCota: async usuario => (await consultar(RESERVAR_COTA_IMAGEM, [usuario, LIMITE_UPLOADS_POR_HORA])).length > 0,
    inserir: async imagem => {
      await consultar(`INSERT INTO kb_imagens (id,blob_caminho,mime,tamanho,usuario_id,descricao,largura,altura)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [imagem.id, imagem.caminho, imagem.mime, imagem.tamanho, imagem.usuario, imagem.alt, imagem.largura, imagem.altura]);
    },
    estado: async (id, estado) => {
      const rows = await consultar(`UPDATE kb_imagens SET estado=$2 WHERE id=$1 RETURNING id`, [id, estado]);
      if (!rows.length) throw new Error("Metadados indisponíveis");
    },
    obter: async id => (await consultar<RegistroImagem>(OBTER_IMAGEM, [id]))[0] ?? null,
  };
}
