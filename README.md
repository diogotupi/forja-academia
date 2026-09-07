# LiderFlix — Instituto 2630

Plataforma full-stack de cursos, e-books, assinaturas e benefícios do Instituto 2630. A aplicação usa o prefixo `/liderflix`, autenticação própria com sessão persistente, PostgreSQL, Stripe e autorização central por `AccessGrant`.

## Instalação

Requisitos: Node.js 20.9+ e PostgreSQL 15+.

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm run dev
```

Acesse `http://localhost:3000/liderflix`.

## Desenvolvimento

- `npm run dev`: servidor local.
- `npm run typecheck`: valida TypeScript.
- `npm run lint`: lint Next/React.
- `npm test`: testes das regras críticas.
- `npm run build`: build de produção.

## Banco e migrations

O schema PostgreSQL está em `migrations/`. `scripts/migrate.ts` registra cada arquivo aplicado em `schema_migrations` e executa cada migration em transação. Nunca altere o banco de produção manualmente; adicione uma nova migration numerada.

Entidades principais: `users`, `sessions`, `password_reset_tokens`, `courses`, `lessons`, `ebooks`, `lesson_progress`, `access_grants`, `subscriptions`, `offers`, `purchases`, `campaigns`, `campaign_eligible_courses`, `campaign_benefits`, `benefit_redemptions` e `processed_webhook_events`.

## Autenticação

- Cadastro gratuito com nome, email único, telefone normalizado e senha.
- Senhas com bcrypt cost 12; nunca armazenadas em texto puro.
- Sessões aleatórias armazenadas como SHA-256 e enviadas em cookie HttpOnly, SameSite=Lax e Secure em produção.
- Recuperação com token aleatório de uso único, expiração em 30 minutos e invalidação das sessões ao redefinir senha.
- Rotas de usuário e admin validam identidade no servidor.

Para criar o primeiro admin, configure `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` apenas no ambiente de desenvolvimento e execute a seed. Em produção, promova o primeiro usuário diretamente por uma migration operacional auditada ou comando administrativo controlado.

## Access control

Pagamento e permissão são separados. `src/lib/access.ts` implementa `canAccess(userId, resource)` no backend. O acesso é permitido por um grant específico ou por `ALL_ACCESS` quando o conteúdo estiver incluído. Todos os grants válidos são considerados; cancelar uma assinatura não invalida um grant de workshop ou admin.

## Stripe

Configure `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` e `STRIPE_WEBHOOK_SECRET`. Cadastre os Price IDs no painel admin/ofertas. O frontend envia somente `offerId`; o backend encontra o Price ID e o modo de pagamento no banco.

Endpoint de checkout: `POST /liderflix/api/checkout` com `{ "offerId": "slug-da-oferta" }`.

## Webhooks

Configure no Stripe:

`https://instituto2630.com.br/liderflix/api/stripe/webhook`

Eventos tratados: checkout concluído/assíncrono e ciclo de assinatura. A assinatura criptográfica é obrigatória. `processed_webhook_events` torna o processamento idempotente. Assinaturas canceladas preservam o acesso até `current_period_end`.

## Cursos e player

Cursos e aulas são gerenciados em `/liderflix/admin/cursos`. A rota `/liderflix/aula/[id]` valida acesso no servidor antes de renderizar o player. O banco guarda apenas `video_provider` e `video_id`; vídeos não entram no GitHub nem no banco.

## Vídeos

O player está preparado para um provedor privado. Configure `VIDEO_PROVIDER` e `VIDEO_SIGNING_SECRET` e implemente o adaptador de URL/tokens do provedor escolhido. Cloudflare Stream, Vimeo OTT/Enterprise ou Mux são opções adequadas; a escolha depende do contrato do Instituto.

## E-books

Gerenciados em `/liderflix/admin/ebooks`. `storage_key` deve apontar para armazenamento privado. O download final deve ser servido por endpoint autenticado que gere URL temporária após `canAccess`.

## Campanhas e workshops

Campanhas são configuradas em `/liderflix/admin/campanhas`: Price ID, cursos elegíveis, quantidade selecionável e duração. O resgate usa `SELECT ... FOR UPDATE`, valida titularidade, elegibilidade e quantidade no backend, e cria grant de origem `WORKSHOP`.

## Admin

- `/liderflix/admin`: métricas.
- `/liderflix/admin/usuarios`: busca por nome, email e telefone.
- `/liderflix/admin/usuarios/[id]`: grants separados por origem, concessão e revogação local.
- `/liderflix/admin/cursos`: cursos e aulas.
- `/liderflix/admin/ebooks`: biblioteca.
- `/liderflix/admin/campanhas`: workshops e benefícios.

Revogar um grant local não cancela cobrança Stripe. Cancelamento financeiro deve ser uma ação separada quando implementado no portal de cobrança.

## Emails

`src/lib/email.ts` fornece a abstração. Em desenvolvimento, o link de recuperação é enviado ao console. Para produção, configure `EMAIL_PROVIDER`, `EMAIL_FROM` e a chave do provedor e implemente o adaptador transacional.

## Variáveis de ambiente

Todas estão documentadas em `.env.example`. Nunca commite `.env`, chaves Stripe, credenciais PostgreSQL, secrets de autenticação, email ou vídeo.

## Configuração do `/liderflix`

`NEXT_PUBLIC_BASE_PATH=/liderflix` configura assets e rotas. O proxy do domínio deve encaminhar `/liderflix` e `/liderflix/*` para o mesmo runtime Node, preservando host, protocolo e cookies. `APP_URL` deve ser `https://instituto2630.com.br/liderflix`.

## Deploy

1. Provisionar PostgreSQL gerenciado.
2. Configurar as variáveis de `.env.example` no host.
3. Executar `npm ci`, `npm run db:migrate`, `npm run build` e `npm start`.
4. Configurar proxy de `/liderflix/*` para o runtime Node.
5. Configurar webhook Stripe.
6. Configurar email e vídeo privados.
7. Executar smoke tests com Stripe Test antes de habilitar preços reais.

GitHub Pages não é compatível com esta aplicação porque não executa backend.

## Checklist de produção

- PostgreSQL com backups e TLS.
- Secrets fortes e separados por ambiente.
- HTTPS e cookies Secure.
- Stripe em modo correto e webhook validado.
- Email transacional configurado.
- Provedor de vídeo/arquivos privados configurado.
- Admin inicial criado de forma auditável.
- Migrations, typecheck, lint, testes e build aprovados.
- Proxy `/liderflix` e callbacks testados.
- Política de privacidade, termos e suporte revisados pelo Instituto.

## Auditoria e decisões

Consulte `docs/AUDIT.md`, `docs/BRAND.md` e `docs/ARCHITECTURE.md`.
