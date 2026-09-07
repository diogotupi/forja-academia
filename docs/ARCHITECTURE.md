# Arquitetura proposta

## Aplicação

- Next.js App Router + TypeScript.
- Base path configurável, com produção em `/liderflix`.
- Server Components por padrão; Client Components somente para interação.
- PostgreSQL como fonte de verdade.
- Migrations SQL versionadas.
- Sessões em cookie HttpOnly/Secure e persistência no banco.
- Senhas com hash forte; tokens de redefinição armazenados como hash.

## Domínios

- Identity: usuários, credenciais, sessões, recuperação e roles.
- Catalog: cursos, aulas, e-books, publicação e mídia.
- Learning: progresso e conclusão.
- Entitlements: AccessGrants e `canAccess` central.
- Commerce: ofertas, assinaturas, pedidos e Stripe.
- Campaigns: workshops, benefícios e resgates transacionais.
- Admin: usuários, conteúdo, campanhas e grants.
- Messaging: abstração de emails transacionais.

## Regra de acesso

`canAccess(userId, resource)` permite quando existir grant `ACTIVE`, dentro da validade, específico para o recurso ou `ALL_ACCESS` aplicável. Revogar um grant nunca revoga outro. Cancelamento financeiro não altera diretamente a autorização; webhooks atualizam assinatura e grants respeitando o período pago.

## Infraestrutura

GitHub Pages deixa de ser destino de produção quando o backend entrar. O domínio `instituto2630.com.br/liderflix` deverá encaminhar `/liderflix/*` para um runtime Node com PostgreSQL. Vídeos permanecem em provedor privado; o banco armazena provider/id.
