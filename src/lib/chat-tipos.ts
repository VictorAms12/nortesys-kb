export const CHAT_GERAL_ID="00000000-0000-4000-8000-000000000001";
export const CHAT_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type PresencaChat="online"|"ausente"|"offline";
export type UsuarioChat={id:string;nome:string;usuario:string;presenca:PresencaChat};
export type ConversaChat={id:string;tipo:"geral"|"privada";nome:string;naoLidas:number;ultimaMensagem:string|null;ultimoHorario:string|null;outroId:string|null};
export type ReferenciaMensagem={id:number;autor:string|null;texto:string};
export type MensagemChat={id:number;conversaId:string;autorId:string;autor:string;texto:string;criadoEm:string;apagadaParaTodos:boolean;temImagem:boolean;respondendoAId:number|null;respostaA:ReferenciaMensagem|null};
export type EstadoChat={eu:string;usuarios:UsuarioChat[];conversas:ConversaChat[];ablyConfigurado:boolean};
