export const EVENTOS_CLIENTE=["artigo_inicio_criacao","artigo_inicio_edicao","chat_aberto","diagnostico_aberto","registro_aberto"] as const;
export type EventoCliente=typeof EVENTOS_CLIENTE[number];
