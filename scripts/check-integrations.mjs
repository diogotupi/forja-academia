// Reports readiness without printing credentials or customer data.
import pg from "pg";
import Stripe from "stripe";
const configured = value => Boolean(value && !/placeholder|replace|configure|pending|example|your_/i.test(value));
const key = process.env.STRIPE_SECRET_KEY;
const report = {
  appUrl: process.env.APP_URL,
  trustedOrigins: process.env.TRUSTED_ORIGINS,
  stripeKey: configured(key) ? (key.startsWith('sk_live_') || key.startsWith('rk_live_') ? 'live' : 'test') : 'missing-or-placeholder',
  webhookSecret: configured(process.env.STRIPE_WEBHOOK_SECRET),
  emailProvider: process.env.EMAIL_PROVIDER || 'console',
  emailKey: configured(process.env.BREVO_API_KEY) || configured(process.env.RESEND_API_KEY),
};
if (configured(key)) {
  try {
    const stripe = new Stripe(key);
    const account = await stripe.accounts.retrieve();
    report.stripeAccount = { id: account.id, chargesEnabled: account.charges_enabled, payoutsEnabled: account.payouts_enabled };
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
    report.webhooks = endpoints.data.map(e => ({ url: e.url, status: e.status, events: e.enabled_events }));
  } catch (error) { report.stripeApi = error.type || 'unavailable'; }
}
if (process.env.DATABASE_URL) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    report.database = 'connected';
    report.offers = (await pool.query('SELECT slug,name,payment_mode,active,stripe_price_id FROM offers ORDER BY slug')).rows;
    report.paymentCounts = (await pool.query('SELECT status,count(*)::int AS count FROM purchases GROUP BY status')).rows;
  } catch { report.database = 'connection-or-query-failed'; }
  finally { await pool.end(); }
}
console.log(JSON.stringify(report, null, 2));
