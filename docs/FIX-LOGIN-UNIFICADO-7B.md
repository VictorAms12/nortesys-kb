# Nortesys KB — Fix unificado para login + contas + viewport (Fase 7B)

Este pacote contém a nova tela visual completa, a correção da submissão do formulário (os inputs deixam de ser `disabled` durante o envio), a remoção da exigência mínima de caracteres para **senha** no login, cadastro e redefinição, e a adaptação responsiva de altura.

- **Os nomes de usuário mantêm 3 a 40 caracteres**, começando com letra minúscula, por existir uma restrição de integridade no Neon. Usuário e senha continuam obrigatórios.
- Senhas podem ter **1 a 256 caracteres** ao criar/redefinir pelo painel (não se aceitam senhas vazias ou só com espaços). O login permite até 1024 caracteres para preservar compatibilidade de credenciais anteriores.
- Senhas não são expostas no banco: mantém `scrypt` com `salt` por usuário.
- A lógica de sessão, anti-CSRF e limitação de tentativas **não foi desativada**.
- O sistema permite senhas curtas por solicitação do administrador, **mas recomenda-se usar senhas fortes e únicas**. Uma senha curta compromete a segurança da base e de dados internos.
- A cópia dos arquivos **não modifica senhas existentes**. Não é necessário migrar o Neon.
- Em alturas de tela muito baixas, zoom ou acessibilidade, rolagem pode continuar necessária para evitar corte de campos.

## Instalação

1. Confirme `git status` e que está usando uma branch limpa para não misturar alterações anteriores.
2. Extraia o ZIP de atualização **na raiz da Fase 7B atual**, preservando `.env.local`.
3. Execute `node scripts/testar-login-unificado.mjs`, `npm run testar:usuarios`, `npm run testar:seguranca`, `npm run lint` e `npm run build`.
4. Faça login local real com uma conta existente; depois crie conta de teste com senha personalizada e verifique a autenticação. Experimente redefinir a senha e confirmar que a anterior foi revogada.
5. Somente após validar: commit e push para a `main`.

## Arquivos incluídos

`src/app/entrar/page.tsx`, `src/components/formulario-login.tsx`, `src/app/globals.css`, `src/lib/usuarios.ts`, `src/lib/admin-usuarios.ts`, `src/app/api/admin/usuarios/route.ts`, `src/app/admin/usuarios/page.tsx`, `scripts/testar-login-visual.mjs`, `scripts/testar-login-unificado.mjs`.

Não inclua `.env.local`, contas de teste ou segredos no Git.
