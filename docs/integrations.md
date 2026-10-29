# Academia de Liderança — conexões

## Ofertas aprovadas

- Curso individual: BRL 999 centavos, recorrência mensal.
- Academia: BRL 4999 centavos, recorrência mensal, todos os cursos atuais e futuros.
- Acesso depende da confirmação do Stripe. Cancelamento pelo portal vale no fim do período pago.

## Ambiente de produção

Projeto Vercel `liderflix`, equipe `diogotupis-projects`.
`APP_URL=https://liderflix.vercel.app/liderflix`
`NEXT_PUBLIC_BASE_PATH=/liderflix`
`TRUSTED_ORIGINS=https://liderflix.vercel.app`

Segredos privados: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BREVO_API_KEY`.
`STRIPE_ACCOUNT_ID` deve identificar a conta do cliente antes de rodar o provisionamento.
Checkout hospedado não precisa de chave pública Stripe no navegador.
Nunca colocar segredos em `NEXT_PUBLIC_*`, no Git ou em mensagens.

## Provisionamento Stripe

1. Confirmar a conta do cliente. Usar chave de testes e banco separado para testar; não provisionar ofertas de teste no banco de produção.
2. Disponibilizar as variáveis em um arquivo `.env.stripe.local` ignorado pelo Git, incluindo a conexão de banco correta.
3. Executar `node --env-file=.env.stripe.local scripts/setup-stripe.mjs`.
4. O script cria/reutiliza os produtos e preços, associa as ofertas ao banco, configura o portal e o endpoint `https://liderflix.vercel.app/liderflix/api/stripe/webhook`.
5. Ao criar um endpoint novo, o segredo é gravado em `.env.stripe-webhook.local`, nunca impresso. Configurar esse segredo e a chave privada como variáveis privadas do ambiente Production no Vercel.
6. Publicar novamente para aplicar as variáveis. Para um endpoint existente, recuperar o segredo pelo Dashboard; o Stripe não o retorna pela API.
7. Validar entrega do evento no Stripe e o acesso após checkout em ambiente de testes antes de liberar vendas. O script não realiza cobranças.

Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`.
Versão do endpoint: `2025-08-27.basil`, compatível com o SDK instalado.
Eventos são deduplicados na mesma transação do acesso; falhas retornam 500 para nova tentativa.
As notificações recuperam o estado atual da assinatura para evitar restauração indevida por eventos atrasados.
Reembolsos e disputas precisam de análise operacional no Stripe; não implementamos revogação automática baseada nesses eventos.

## Brevo

1. Criar a conta e verificar o e-mail de acesso.
2. Cadastrar o remetente do Instituto e autenticar o domínio com os registros DNS fornecidos pelo Brevo.
3. Criar uma chave da API transacional e salvar em `BREVO_API_KEY` no Vercel Production.
4. Definir `EMAIL_FROM` com o nome e endereço efetivamente verificados e `EMAIL_PROVIDER=brevo`.
5. Publicar novamente. Testar recuperação de senha de uma conta autorizada e verificar recebimento e validade do link.
6. Não ativar Brevo sem chave e remetente válido. O modo `console` não entrega e-mails em produção.

## Verificações

`node --env-file=.env.stripe.local scripts/check-integrations.mjs` apresenta o estado das integrações sem exibir segredos.
`npm test` cobre pagamentos pendentes, renovação, cancelamento, incompatibilidade de preços e acesso.
Novos cursos: rodar novamente o provisionamento após a publicação para criar a oferta individual de R$ 9,99. O acesso pela Academia independe dessa oferta.
