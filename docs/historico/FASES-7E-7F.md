# Fases 7E e 7F — triagem, busca, relacionamento e ferramentas de suporte

> A funcionalidade de importação assistida foi removida por duplicar recursos do editor normal.

Aplicadas sobre a branch \`fase-7c2-7c3-anexos-editorial\`, mantendo 7D fora do escopo.

## 7E
- Rota protegida \`/diagnostico\` com fluxos por assunto: NF-e/NFC-e, impressão, acesso, instalação. Cada fluxo conduz à pesquisa e apresenta artigos que a conta autenticada tem permissão para acessar; não realiza diagnóstico fiscal automático.
- Pesquisa com equivalências limitadas de vocabulário (NF-e/NFE, NFC-e/NFCE, impressão, login e IBS/CBS). O termo exato mantém prioridade; sugestões por sinônimo não superam correspondências diretas.
- Busca também funciona ao selecionar filtros sem termo pesquisado.
- Na leitura, sugestões de artigos relacionadas baseadas em códigos de erro, tags e palavras relevantes do título; evita usar categoria isoladamente como indício suficiente.

## 7F
- \`/ferramentas/registro\`: formulário com nove campos da padronização de suporte, prévia e cópia para área de transferência. Sem persistência no Neon, upload, telemetria ou armazenamento local de dados fornecidos.
- \`/admin/importar\`: recebe arquivos TXT/Markdown (até 150 KB) ou texto colado manualmente de um PDF. Cria rascunho revisável no modelo oficial, com edição Markdown e metadados antes de salvar.
- PDF **não é extraído automaticamente**; o analista deve abrir um PDF permitido e copiar o texto selecionado. A ferramenta não chama serviços externos de IA, não anexa o arquivo automaticamente e não publica o artigo.
- Ao salvar, usa a API editorial existente, com todas as verificações, validações e histórico já implementados.

## Validação
\`\`\`bash
npm run verificar:revisao
npm run testar:ferramentas
npm run build:revisao
\`\`\`
Teste com usuários leitor/editor e confirme que \`/admin/importar\` exige perfil editorial. Importação de conteúdo fiscal requer revisão até e conferência das fontes. Verifique se o rascunho não aparece a leitores e se diagnósticos não exibem artigos não publicados.

Nenhuma migração SQL nova ou nova variável Vercel é necessária para 7E/7F.
