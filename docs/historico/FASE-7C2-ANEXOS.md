# Fase 7C.2 — Anexos PDF privados

Esta entrega adiciona documentos PDF a artigos existentes. Os arquivos são guardados em um store privado do Vercel Blob; o Neon mantém nome, tamanho, autoria, estado e vínculo com o artigo. Leitores acessam somente documentos associados a artigos visíveis para seu perfil; editores e administradores podem baixar anexos dos artigos, inclusive rascunhos.

## Antes de validar no Preview

1. Selecione o **banco de testes** correto no Neon, confirme branch e database; execute o arquivo inteiro `db/005_anexos.sql` no SQL Editor.
2. Confira se o store Blob privado está ligado ao ambiente Preview dessa branch e se a autenticação OIDC ou token de servidor funciona nesse ambiente.
3. Crie um artigo de teste e salve. Na página de edição, envie um PDF pequeno. Confira download como editor; publique o artigo e confira como leitor.
4. Teste falta de sessão (401), artigo em rascunho para leitor (404), PDF inválido (415), limite acima de 3 MiB (413), cota horária (429) e falhas Blob.

## Limitações deliberadas

- Upload somente de PDFs com até 3 MiB. Upload direto de PDFs maiores precisa de arquitetura separada e revisão das garantias de privacidade; a Vercel limita a carga HTTP de funções.
- Download forçado, sem visualização inline nem parsing ou indexação do conteúdo do PDF. Nome do arquivo não é executado nem refletido em headers sem codificação.
- Não há exclusão automática, pois documentos vinculados podem fazer parte do histórico. Estado de upload com falha fica no banco para reconciliação.
- Anexos são vinculados à identidade UUID do artigo, mesmo após edição de categoria/slug; duplicações não copiam anexos.

## Verificação SQL no banco de testes

```sql
SELECT to_regclass('public.kb_anexos') AS anexos,
       to_regclass('public.kb_anexo_limites') AS limites;
SELECT id,nome,tamanho,estado,artigo_id,enviado_em FROM kb_anexos ORDER BY enviado_em DESC LIMIT 10;
```

Aplicar migração 005 separadamente em cada ambiente, **antes** de publicar sua versão de código. Não modificar o banco de produção durante a validação em Preview.
