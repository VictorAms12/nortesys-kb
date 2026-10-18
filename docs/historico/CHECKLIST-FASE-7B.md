> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Checklist de homologação — Nortesys KB Fase 7B

Marque [x] apenas após realizar e observar resultado no seu ambiente.

## Pré-requisitos
- [ ] Branch `fase-7b-recursos` contém as mudanças, sem commit de `.env.local`
- [ ] Banco Neon de testes / backup preparado
- [ ] `npm run db:migrar` executado e `db/003_interacoes.sql` aplicado
- [ ] `npm run db:verificar` bem-sucedido
- [ ] `npm run testar:fase7b` bem-sucedido
- [ ] `npm run verificar:fase7b` sem falhas (inclui lint/build)

## Editor
- [ ] Criar solução de problema com sete seções
- [ ] Criar tutorial com cinco seções e publicá-lo
- [ ] Criar guia técnico com quatro seções e publicá-lo
- [ ] Criar FAQ com pergunta e resposta e publicá-lo
- [ ] Abrir e editar artigo antigo sem campo `tipo`
- [ ] Verificar pré-visualização de Markdown, tabela, bloco de código e imagem local
- [ ] Alterar tipo de um artigo e confirmar aviso de troca de modelo
- [ ] Confirmar funcionamento de rascunho temporário da aba
- [ ] Salvar nova versão e verificar histórico
- [ ] Testar conflito de edição simultânea

## Favoritos e recentes
- [ ] Favoritar, recarregar e confirmar persistência no Neon
- [ ] Desfavoritar e confirmar remoção
- [ ] Abrir vários artigos e conferir ordenação dos recentes
- [ ] Entrar com outro usuário e conferir isolamento dos favoritos
- [ ] Desativar usuário e verificar bloqueio de acesso

## Busca e biblioteca
- [ ] Pesquisa por código de erro e texto funciona
- [ ] Filtro de solução / tutorial / guia / FAQ funciona
- [ ] Ordenação por relevância, data e título funciona
- [ ] Combinar categoria, sistema e tipo de conteúdo
- [ ] Pesquisa não mostra rascunhos para leitor
- [ ] Sidebar para Favoritos / Recentes funciona no desktop e celular

## Administração e segurança
- [ ] Administrador vê usuários e auditoria
- [ ] Editor edita artigos, mas não gerencia usuários
- [ ] Leitor não consegue executar ações administrativas diretamente pela API
- [ ] Testar confirmação de desativação e redefinição de credencial
- [ ] Testar filtros de auditoria por evento/usuário
- [ ] Origem cruzada recebe 403 em POST de interações
- [ ] Um leitor não consegue favoritar um artigo restrito ao editor
- [ ] Scanner de dados sensíveis aprovado

## Publicação
- [ ] Preview Vercel publicada sem tocar `main`
- [ ] `DATABASE_URL` da Preview aponta para branch Neon de testes
- [ ] Login, logout e páginas antigas continuam funcionando
- [ ] Revisão final em dispositivo móvel
- [ ] Somente depois de aprovação: merge na `main`
