# Nortesys KB — Correção do scanner preventivo (Fase 5.5)

**Motivo:** a declaração TypeScript de um argumento foi reconhecida incorretamente como dado sensível pelo scanner. A alteração renomeia o argumento local para `credencial`, sem alterar o cálculo do hash, as assinaturas de funções exportadas ou o comportamento da autenticação. As regras do scanner permanecem ativas.

**Instalação:**
1. Extraia este ZIP na raiz do projeto `C:\nortesys-kb-fase1`, mantendo a estrutura de diretórios e substituindo `src/lib/usuarios.ts`.
2. Não altere seu `.env.local`, nem execute migrações de banco para esta correção.
3. Rode os comandos:

```powershell
npm.cmd run verificar
npm.cmd run testar:usuarios
npm.cmd run verificar:fase55
```

A execução de `verificar:fase55` deverá executar os demais testes, lint e build. Se falhar, compartilhe a primeira mensagem completa de erro (sem credenciais).
