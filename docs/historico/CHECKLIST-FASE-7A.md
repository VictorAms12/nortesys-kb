> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Checklist de homologação — Nortesys KB / Fase 7A

## Preparação e qualidade
- [ ] Instalei a atualização na branch `fase-7a-redesign`
- [ ] O `.env.local` foi preservado e não está versionado
- [ ] `npm run testar:fase7a` concluiu sem erros
- [ ] `npm run verificar:fase7a` concluiu sem erros (inclui lint e build)
- [ ] A implantação Preview da branch concluiu sem falhas

## Sidebar, header e acessibilidade
- [ ] Sidebar está presente nas páginas autenticadas, mas não na tela de login
- [ ] No desktop, posso recolher/expandir a sidebar
- [ ] A preferência permanece ao recarregar a página
- [ ] O item ativo corresponde à página atual
- [ ] O botão de menu aparece no celular e abre o painel
- [ ] O painel mobile fecha por Escape, pelo fundo e ao escolher um item
- [ ] O menu fechado não permanece acessível via Tab no celular
- [ ] Funciona o atalho Ctrl+K / Cmd+K
- [ ] A busca do cabeçalho leva à página correta
- [ ] Botões, links e campos permitem navegação por teclado

## Navegação e telas
- [ ] `/`, `/artigos`, `/categorias`, `/busca` abrem sem 404
- [ ] Categorias individuais e artigos antigos Markdown carregam
- [ ] Artigos do Neon permanecem na listagem e podem ser abertos
- [ ] Índice de seções dos artigos não cobre o conteúdo
- [ ] Dashboard administrativo mostra dados reais do banco
- [ ] Usuários, artigos e auditoria continuam funcionando
- [ ] Criar/editar/publicar artigo segue funcionando
- [ ] Login, sessão e logout continuam funcionando

## Permissões e responsividade
- [ ] Leitor não visualiza links administrativos e não abre rotas protegidas
- [ ] Editor vê dashboard e editor, mas não usuários/auditoria
- [ ] Administrador vê todos os itens pertinentes
- [ ] Tema claro, escuro e automático funcionam
- [ ] Layout testado em 360 px, 768 px, 1024 px e desktop amplo
- [ ] Não existe rolagem horizontal indesejada
- [ ] Preferência do usuário por redução de movimento é respeitada

## Publicação
- [ ] Preview de `fase-7a-redesign` aprovado pelos envolvidos
- [ ] Nenhuma credencial ou conteúdo interno indevido está no repositório
- [ ] Após aprovação, PR revisado e merge na `main`
- [ ] Produção da Vercel testada após o merge

**Observação:** esta etapa não exige executar novas migrações SQL.
