export type DadoSensivel = { tipo: string; inicio: number };
export function detectarDadosSensiveis(texto: string): DadoSensivel[];
export function listarOcorrencias(raiz: string, dir?: string): Array<{ arquivo: string; linha: number; tipo: string }>;
