import assert from "node:assert/strict";
import {test} from "node:test";
import {imagensDaTransferencia,validarArquivoImagemChat,type DadosTransferenciaImagem} from "../src/lib/chat-clipboard";

const arquivo=(nome:string,tipo:string,tamanho=10)=>new File([new Uint8Array(tamanho)],nome,{type:tipo});
function transferir(itens:{kind:"file"|"string";type:string;arquivo?:File|null}[],files:File[]=[]):DadosTransferenciaImagem{
 return {items:itens.map(item=>({
   kind:item.kind,type:item.type,getAsFile:()=>item.arquivo??null
  })) as unknown as DataTransferItemList,files:files as unknown as FileList};
}
test("Ctrl+V de texto puro não anexa imagem",()=>{
 assert.deepEqual(imagensDaTransferencia(transferir([{kind:"string",type:"text/plain"}])),[]);
});
test("Ctrl+V com texto + print prioriza a imagem e mantém o texto digitado",()=>{
 const print=arquivo("captura.png","image/png");
 assert.deepEqual(imagensDaTransferencia(transferir([
  {kind:"string",type:"text/plain"},{kind:"string",type:"text/html"},
  {kind:"file",type:"image/png",arquivo:print}
 ])),[print]);
});
test("Fallback para arquivos quando o navegador não fornece imagem em items",()=>{
 const print=arquivo("clipboard.jpg","image/jpeg");
 assert.deepEqual(imagensDaTransferencia(transferir([], [print,arquivo("arquivo.pdf","application/pdf")])),[print]);
});
test("Ctrl+V ignora arquivos não-imagem e identifica múltiplas imagens",()=>{
 const a=arquivo("a.webp","image/webp"),b=arquivo("b.png","image/png");
 const anexos=imagensDaTransferencia(transferir([
  {kind:"file",type:"application/pdf",arquivo:arquivo("d.pdf","application/pdf")},
  {kind:"file",type:"image/webp",arquivo:a},{kind:"file",type:"image/png",arquivo:b}
 ]));
 assert.deepEqual(anexos,[a,b]);
});
test("Upload e colagem compartilham validação de tipo, tamanho e arquivo vazio",()=>{
 assert.equal(validarArquivoImagemChat(arquivo("c.png","image/png")),null);
 assert.equal(validarArquivoImagemChat(arquivo("c.jpeg","image/jpeg")),null);
 assert.equal(validarArquivoImagemChat(arquivo("c.webp","image/webp")),null);
 assert.match(validarArquivoImagemChat(arquivo("anim.gif","image/gif"))??" ",/PNG, JPEG ou WebP/);
 assert.match(validarArquivoImagemChat(arquivo("vazia.png","image/png",0))??" ",/2 MB/);
 assert.match(validarArquivoImagemChat(arquivo("grande.png","image/png",2*1024*1024+1))??" ",/2 MB/);
 assert.equal(validarArquivoImagemChat(arquivo("limite.png","image/png",2*1024*1024)),null);
});
