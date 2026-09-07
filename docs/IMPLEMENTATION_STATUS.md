# Estado da implementação LiderFlix

## Implementado

- Identidade visual LiderFlix baseada no site oficial do Instituto 2630.
- Logo oficial local, sem hotlink.
- Next.js 16 + TypeScript + App Router e `basePath=/liderflix`.
- PostgreSQL com migrations transacionais e constraints.
- Cadastro gratuito, login, logout, sessão persistente e redefinição de senha.
- Roles USER/ADMIN e proteção server-side.
- Catálogo dinâmico, página comercial, player protegido e progresso.
- E-books com regra gratuita, específica ou ALL_ACCESS.
- AccessGrant central, múltiplas fontes e validade independente.
- Checkout por oferta segura, sem preço vindo do frontend.
- Webhook Stripe com verificação de assinatura e idempotência.
- Assinaturas individuais e ALL_ACCESS modeladas.
- Campanhas configuráveis e resgate transacional de workshop.
- Admin: dashboard, usuários, grants, cursos, aulas, e-books e campanhas.
- Seed separada de produção.
- README, `.env.example`, lint, typecheck, testes e build.

## Validações executadas

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado.
- `npm test`: 8 testes aprovados.
- `npm run build`: aprovado no Next.js 16.3.4.
- `npm audit`: zero vulnerabilidades conhecidas.
- QA visual: home e cadastro abertos no navegador, logo/assets carregados, console sem erros.

## Dependências externas pendentes

1. PostgreSQL: fornecer `DATABASE_URL`; necessária para migrations e fluxos autenticados.
2. Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` e Price IDs; necessários para checkout real.
3. Email: escolher provedor e fornecer credencial; necessário para entrega de recuperação e emails transacionais.
4. Vídeo: escolher provedor privado e credencial; necessário para playback protegido.
5. Arquivos: escolher storage privado para e-books e materiais.
6. Infraestrutura/DNS: runtime Node e proxy de `instituto2630.com.br/liderflix/*`.

## Hardening ainda dependente de infraestrutura

- Rate limiting distribuído (Redis/KV) para múltiplas instâncias.
- Testes de integração com PostgreSQL e Stripe Test.
- URLs assinadas do provedor de vídeo e storage.
- Monitoramento, logs estruturados, alertas de webhook e backups.
- Entrega dos demais templates de email após seleção do provedor.

Não considerar a aplicação comercialmente liberada até concluir os itens externos e executar os fluxos QA B–G do briefing em ambiente de staging.
