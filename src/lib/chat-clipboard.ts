/** Utilitários de área de transferência do chat; sem acesso a DOM ou rede. */
import {MIMES_IMAGEM,TAMANHO_MAXIMO_IMAGEM} from "./imagens";

export type DadosTransferenciaImagem=Pick<DataTransfer,"items"|"files">;

/** Extrai apenas imagens binárias, deixando o colar texto funcionar normalmente. */
export function imagensDaTransferencia(dados:DadosTransferenciaImagem):File[]{
 const imagens:File[]=[];
 for(const item of Array.from(dados.items??[])){
  if(item.kind!=="file"||!item.type.startsWith("image/"))continue;
  const arquivo=item.getAsFile();
  if(arquivo)imagens.push(arquivo);
 }
 if(imagens.length)return imagens;
 // Compatibilidade com navegadores que fornecem arquivos só em clipboardData.files.
 return Array.from(dados.files??[]).filter(arquivo=>arquivo.type.startsWith("image/"));
}

/** Mesmas restrições já aplicadas pelo upload tradicional do chat. */
export function validarArquivoImagemChat(arquivo:File):string|null{
 if(!MIMES_IMAGEM.some(mime=>mime===arquivo.type))return "Selecione uma imagem PNG, JPEG ou WebP.";
 if(arquivo.size===0||arquivo.size>TAMANHO_MAXIMO_IMAGEM)return "A imagem precisa ter até 2 MB.";
 return null;
}
