> Documento historico. Retrata uma etapa anterior; use o [indice atual](../README.md) para configurar e operar o projeto.

# Nortesys KB — Fase 6: Painel administrativo

## O que esta entrega faz

- `/admin`: visão geral, restrita a **administrador** ou **editor**.
- `/admin/usuarios`: somente **administrador**; criar usuários, alterar nome/perfil, redefinir credenciais, ativar e desativar.
- `/admin/auditoria`: somente **administrador**; mostra até 100 eventos administrativos, sem armazenar credenciais nos registros.
- `/admin/artigos`: **administrador** ou **editor**; criar, editar, revisar, publicar e arquivar artigos persistidos no PostgreSQL.
- `/admin/artigos/<id>/historico`: versões numeradas com o editor, data e Markdown de cada revisão.
- Home, busca, categorias e páginas de artigo combinam arquivos Markdown existentes e artigos persistidos no Neon. Artigos recém-criados como *rascunho* não aparecem para o perfil **leitor**; *revisados* ficam visíveis.

## Instruções no Windows (PowerShell)

1. Faça backup da pasta atual ou crie uma branch no Git.
2. Extraia o pacote `Atualizacao` na raiz da Fase 5.5, substituindo apenas os arquivos correspondentes.
3. Preserve `.env.local` e a URL do banco que já está conectada ao Neon.
4. Execute os comandos nesta ordem:

```powershell
cd C:\nortesys-kb-fase1
npm.cmd install
npm.cmd run db:migrar
npm.cmd run db:verificar
npm.cmd run testar:fase6
npm.cmd run verificar:fase6
npm.cmd run dev
```

`db:migrar` aplica `001_auth.sql` e `002_painel.sql` de maneira idempotente (`CREATE TABLE IF NOT EXISTS`); não apaga usuários e sessões. Execute **antes** do build em seu computador e antes de publicar na Vercel. Use um banco de testes ou branch isolada no Neon para homologação.

5. Entre com uma conta cujo perfil seja **administrador**. Acesse `http://localhost:3000/admin`.
6. Crie uma conta de teste do tipo **leitor** na seção Usuários. O responsável define uma credencial inicial de pelo menos 12 caracteres e transmite ao colaborador por canal privado.
7. Em Artigos, crie um procedimento fictício em rascunho preenchendo as sete seções Markdown e confira que só editor/administrador o encontra.
8. Alterne o artigo para `revisado` e confira a aparição na busca e para usuários leitores. Edite e confira o histórico. Teste o arquivamento somente com conteúdo fictício.

## Permissões

| Ação | Administrador | Editor | Leitor |
|---|---:|---:|---:|
| Ler artigos revisados e pesquisar | Sim | Sim | Sim |
| Ver/editar rascunhos do painel | Sim | Sim | Não |
| Criar, editar, publicar e arquivar artigos | Sim | Sim | Não |
| Consultar histórico de artigos | Sim | Sim | Não |
| Criar/desativar usuários, redefinir credenciais | Sim | Não | Não |
| Consultar auditoria administrativa | Sim | Não | Não |

O controle de permissão é aplicado **no servidor**, inclusive em rotas `POST` e páginas; ocultar um botão não é considerado proteção.

## Persistência e limitações desta etapa

- Artigos antigos na pasta `content/` continuam **somente leitura**, evitando alterações locais efêmeras na Vercel. Para editá-los no painel, recrie-os como artigos do banco com um identificador diferente e valide antes de remover o arquivo antigo pelo Git.
- As categorias ainda são as sete categorias oficiais definidas em `config/categorias.ts`; podem ser selecionadas nos formulários, mas não criadas pelo painel. Tags e códigos de erro podem ser alterados por artigo.
- O histórico mantém snapshots do Markdown a cada criação/edição/arquivamento; é de leitura, sem botão de restaurar.
- Não há recuperação automática de senha por e-mail nem MFA. Administradores redefinem credenciais manualmente.
- A proteção contra desativação do último administrador é verificada no servidor. Antes de uso com alta concorrência ou acesso crítico, reforçar no banco a regra sob transações concorrentes.
- O scanner de arquivos não verifica conteúdo digitado pelos colaboradores no navegador. Faça revisão humana e políticas de privacidade; nunca inclua senhas, XMLs reais, CPF/CNPJ de clientes ou dados internos não autorizados.
- Migrações PostgreSQL devem ser testadas em backup/branch isolada antes da implantação corporativa.
- O sistema depende do Neon estar disponível. Sem PostgreSQL acessível, a aplicação falha de forma fechada para conteúdos protegidos.

## GitHub e desenvolvimento entre PCs

```powershell
# No PC em que começou a mudança:
git switch -c fase-6-painel-admin
git add .
git status
git commit -m "Fase 6 - painel administrativo"
git push -u origin fase-6-painel-admin

# No outro PC (repo já clonado):
git fetch origin
git switch fase-6-painel-admin
git pull
npm.cmd install
```

Não envie `.env.local` ao GitHub. Se quiser testar no PC de casa, configure o ambiente local com as variáveis seguras obtidas diretamente do Neon. Para **produção**, use env vars privadas da Vercel e revise segurança e políticas de publicação da empresa antes do deploy.

## Solução de problemas

- **Tabela kb_artigos não existe:** execute `npm.cmd run db:migrar` com o `.env.local` correto.
- **Não aparece link do Painel:** sua conta provavelmente possui perfil leitor. Confira `npm.cmd run usuario:listar` e altere pelo comando de administração com autorização.
- **Artigo inválido:** revise as sete seções `##` do editor, suas datas e os campos obrigatórios; artigos fiscais exigem data de revisão.
- **Conflito de edição:** reabra o formulário antes de salvar; versões são comparadas no servidor para evitar substituir uma edição mais recente.
- **Artigo antigo não editável:** foi escrito como Markdown em `content/`; a edição pela web fica restrita aos artigos salvos no PostgreSQL.

## Próximas melhorias sugeridas (não inclusas)

Pré-visualização Markdown lado a lado; fluxo de aprovação de duas pessoas; importador de arquivos Markdown antigos; categorias dinâmicas; anexos com armazenamento de objetos e antivírus; MFA e recuperação de credenciais; restauração de versões e exportação/backup automático.
