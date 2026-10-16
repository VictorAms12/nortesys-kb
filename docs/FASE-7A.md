# Nortesys KB — Fase 7A (redesign da interface)

Esta entrega parte da **Fase 6 completa com a correção de lint**. O redesign mantém a paleta já existente (verde-petróleo no claro e verde-menta no escuro), o PostgreSQL no Neon, o login individual, os papéis e a estrutura dos artigos.

## Etapas implementadas

- **7A.1 — Design system:** refinamento de tipografia, espaçamentos, cartões, estados de foco, formulários, botões e modo de movimento reduzido sem substituir a paleta.
- **7A.2 — Layout:** sidebar única, recolhimento persistido em `localStorage`, botão de abertura no mobile, fechamento por Escape e backdrop, indicação de página ativa, breadcrumb e busca global (Ctrl/Cmd + K).
- **7A.3 — Conhecimento:** página inicial redesenhada com dados reais de artigos acessíveis ao perfil; páginas gerais `/artigos` e `/categorias`; manutenção da busca e das páginas individuais; leitura com sumário adaptado ao espaço disponível.
- **7A.4 — Administração:** dashboard com indicadores reais do Neon, listas de artigos/usuários/auditoria reorganizadas e editor com divisão visual de seções; preservação das ações e formulários existentes.
- **7A.5 — Polimento e verificação:** regras mobile, desktop, tema automático, acessibilidade básica, preferências de movimento reduzido, testes estáticos de navegação e checklist.

## Instalação por Git Bash (Windows)

1. Confirme que seu projeto local está na última Fase 6 corrigida e com suas mudanças salvas no Git.
2. Desenvolva na branch `fase-7a-redesign`, nunca diretamente na `main` de produção.
3. Extraia o ZIP de atualização na raiz do repositório, substituindo os arquivos de mesmo caminho. **Não substitua o `.env.local`.**
4. Rode:

```bash
npm install
npm run testar:fase7a
npm run verificar:fase7a
npm run dev
```

Abra `http://localhost:3000` e autentique-se normalmente. A Fase 7A **não adiciona migrações de banco**: não é necessário executar `db:migrar` novamente somente por esta atualização.

Se o ambiente não estiver com as variáveis necessárias, mantenha `DATABASE_URL` somente no `.env.local`, nunca no repositório. Em Preview, use preferencialmente branch de banco do Neon separada da produção para testes editoriais.

## Testes manuais importantes

- Desktop: links corretos, indicação ativa, sidebar recolhida e expandida, estado lembrado após recarregar, busca Ctrl+K e logout.
- Celular: botão de menu, fundo para fechar, Escape, navegação por toque e ausência de rolagem horizontal.
- Permissões: leitor não vê links de administração; editor vê dashboard e artigos, não usuários/auditoria; administrador vê todas as opções. **As rotas seguem protegidas no servidor**, não apenas pelo menu.
- Artigos: páginas Markdown e artigos do Neon; links diretos e índice de seções.
- Temas: claro, escuro, automático e contraste de controles.
- Admin: cadastro de conta fictícia, edição de artigos, auditoria e histórico já existentes.

## GitHub e Vercel

```bash
git status
git add .
git commit -m "Fase 7A - sidebar e redesign completo"
git push -u origin fase-7a-redesign
```

Confirme que **não há `.env.local` preparado para commit**. Valide o Preview da branch na Vercel. Não faça merge na `main` até o lint, o build, a navegação e as operações principais estarem confirmados. Nenhuma alteração é aplicada automaticamente ao GitHub/Vercel apenas pela extração do ZIP.

## Observações e limites

- As contagens na página inicial incluem artigos disponíveis ao perfil, inclusive rascunhos para membros editoriais. O dashboard administrativo conta apenas registros do banco Neon; informa essa distinção na tela.
- Os artigos antigos Markdown seguem fora do editor administrativo. Não há nova API nem novo modelo de dados nesta fase.
- A navegação lateral recolhida é uma preferência por **navegador**, não por usuário.
- A validação automatizada de `testar:fase7a` é estrutural e **não substitui** os testes no navegador, `npm run lint` ou `npm run build`.
