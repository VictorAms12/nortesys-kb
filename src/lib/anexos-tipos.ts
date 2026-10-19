/** Contrato de exibição, sem carregar bibliotecas de servidor no componente cliente. */
export type AnexoArtigo = {id:string;nome:string;tamanho:number;enviado_em:string};

/** Define se o navegador pode pré-visualizar o PDF ou deve baixá-lo. */
export function disposicaoAnexoPDF(nome: string, visualizar: boolean): string {
  const modo = visualizar ? "inline" : "attachment";
  const nomeCodificado = encodeURIComponent(nome);
  return `${modo}; filename="documento.pdf"; filename*=UTF-8''${nomeCodificado}`;
}
