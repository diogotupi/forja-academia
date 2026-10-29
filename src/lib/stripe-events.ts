import type Stripe from "stripe";
import type { PoolClient } from "pg";

const idOf = (value: string | { id: string } | null | undefined) => typeof value === "string" ? value : value?.id;
export function isSettled(status: Stripe.Checkout.Session.PaymentStatus) { return status === 'paid' || status === 'no_payment_required'; }
export function subscriptionState(status: Stripe.Subscription.Status) {
  if (status === 'active' || status === 'trialing') return 'ACTIVE';
  if (status === 'past_due' || status === 'unpaid') return 'PAST_DUE';
  if (status === 'canceled') return 'CANCELLED';
  if (status === 'incomplete_expired') return 'EXPIRED';
  return 'INCOMPLETE';
}

async function syncSubscription(client: PoolClient, stripe: Stripe, id: string) {
  // Serialize updates, then fetch current state: delayed events must not restore old access.
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [id]);
  const sub = await stripe.subscriptions.retrieve(id, { expand: ['latest_invoice'] });
  const { userId, offerId } = sub.metadata;
  if (!userId || !offerId) return;
  const offer = (await client.query<{resource_type: string; resource_id: string | null; stripe_price_id: string}>(
    'SELECT resource_type,resource_id,stripe_price_id FROM offers WHERE id=$1', [offerId])).rows[0];
  if (!offer?.resource_type) throw new Error('Unknown subscription offer');
  const item = sub.items.data.find(item => item.price.id === offer.stripe_price_id);
  if (!item || sub.items.data.length !== 1) throw new Error('Subscription price mismatch');
  const end = item.current_period_end ? new Date(item.current_period_end * 1000) : null;
  await client.query(`INSERT INTO subscriptions(user_id,resource_type,resource_id,stripe_customer_id,stripe_subscription_id,stripe_price_id,status,current_period_end,cancel_at_period_end)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(stripe_subscription_id) DO UPDATE SET status=$7,current_period_end=$8,cancel_at_period_end=$9,updated_at=now()`,
    [userId,offer.resource_type,offer.resource_id,idOf(sub.customer),id,item.price.id,subscriptionState(sub.status),end,sub.cancel_at_period_end]);
  const invoice = typeof sub.latest_invoice === 'object' ? sub.latest_invoice : null;
  const paid = sub.status === 'trialing' || (sub.status === 'active' && invoice?.status === 'paid');
  if (paid && end) {
    await client.query("UPDATE access_grants SET status='ACTIVE',expires_at=$2,updated_at=now() WHERE source='SUBSCRIPTION' AND source_reference=$1 AND status<>'REVOKED'", [id,end]);
    await client.query(`INSERT INTO access_grants(user_id,resource_type,resource_id,source,source_reference,expires_at,status)
      VALUES($1,$2,$3,'SUBSCRIPTION',$4,$5,'ACTIVE') ON CONFLICT DO NOTHING`,[userId,offer.resource_type,offer.resource_id,id,end]);
  } else if (['canceled','unpaid','paused','incomplete_expired'].includes(sub.status)) {
    await client.query("UPDATE access_grants SET status='EXPIRED',expires_at=now(),updated_at=now() WHERE source='SUBSCRIPTION' AND source_reference=$1 AND status<>'REVOKED'",[id]);
  }
  // past_due never extends the paid period. Unrelated admin/workshop grants are preserved.
}

export async function processStripeEvent(client: PoolClient, stripe: Stripe, event: Stripe.Event) {
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const source = event.data.object as Stripe.Checkout.Session;
    const session = await stripe.checkout.sessions.retrieve(source.id);
    if (!isSettled(session.payment_status)) return;
    const userId = session.metadata?.userId || session.client_reference_id;
    const offerId = session.metadata?.offerId;
    if (!offerId || !userId) return;
    const offer = (await client.query<{resource_type:string|null;resource_id:string|null}>('SELECT resource_type,resource_id FROM offers WHERE id=$1',[offerId])).rows[0];
    if (!offer) throw new Error('Unknown checkout offer');
    const purchase = (await client.query<{id:string}>(`INSERT INTO purchases(user_id,offer_id,stripe_checkout_session_id,stripe_payment_intent_id,status,amount_cents,currency,customer_email)
      VALUES($1,$2,$3,$4,'PAID',$5,$6,$7) ON CONFLICT(stripe_checkout_session_id) DO UPDATE SET status=CASE WHEN purchases.status='REFUNDED' THEN purchases.status ELSE 'PAID' END,
      stripe_payment_intent_id=EXCLUDED.stripe_payment_intent_id,amount_cents=EXCLUDED.amount_cents,currency=EXCLUDED.currency,updated_at=now() RETURNING id`,
      [userId,offerId,session.id,idOf(session.payment_intent),session.amount_total,session.currency || 'brl',session.customer_details?.email || session.customer_email])).rows[0];
    if (session.mode === 'subscription' && idOf(session.subscription)) {
      await syncSubscription(client,stripe,idOf(session.subscription)!);
    } else if (session.mode === 'payment') {
      const campaign = (await client.query<{id:string;selectable_course_count:number}>("SELECT id,selectable_course_count FROM campaigns WHERE stripe_price_id=(SELECT stripe_price_id FROM offers WHERE id=$1) AND status='ACTIVE'",[offerId])).rows[0];
      if (campaign) await client.query("INSERT INTO campaign_benefits(campaign_id,purchase_id,user_id,recipient_email,selectable_course_count,status) VALUES($1,$2,$3,$4,$5,'PENDING') ON CONFLICT(campaign_id,purchase_id) DO NOTHING",[campaign.id,purchase.id,userId,session.customer_details?.email || session.customer_email,campaign.selectable_course_count]);
      else if (offer.resource_type) await client.query("INSERT INTO access_grants(user_id,resource_type,resource_id,source,source_reference,status) VALUES($1,$2,$3,'PURCHASE',$4,'ACTIVE') ON CONFLICT DO NOTHING",[userId,offer.resource_type,offer.resource_id,session.id]);
    }
  } else if (event.type.startsWith('customer.subscription.')) {
    await syncSubscription(client,stripe,(event.data.object as Stripe.Subscription).id);
  } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
    if (subscriptionId) await syncSubscription(client,stripe,subscriptionId);
  } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await client.query("UPDATE purchases SET status=$2,updated_at=now() WHERE stripe_checkout_session_id=$1 AND status='PENDING'",[session.id,event.type.endsWith('expired')?'CANCELLED':'FAILED']);
  }
}
