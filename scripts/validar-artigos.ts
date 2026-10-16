import { carregarArtigos } from "../src/lib/artigos";

try {
  const artigos = carregarArtigos();
  console.log(`✅ ${artigos.length} artigo(s) Markdown validado(s).`);
  for (const artigo of artigos) {
    console.log(`   • ${artigo.caminho} (${artigo.status}; ${artigo.nivel})`);
  }
} catch (erro) {
  console.error(erro instanceof Error ? erro.message : String(erro));
  process.exitCode = 1;
}
