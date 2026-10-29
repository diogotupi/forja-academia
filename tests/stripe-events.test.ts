import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import type { PoolClient } from 'pg';
import { processStripeEvent, isSettled, subscriptionState } from '../src/lib/stripe-events';

function fixture(status='active', invoiceStatus='paid') {
  const query=vi.fn(async(sql:string)=>({rows:sql.includes('FROM offers')?[{resource_type:'COURSE',resource_id:'course-1',stripe_price_id:'price_1'}]:sql.includes('RETURNING id')?[{id:'purchase-1'}]:[],rowCount:1}));
  const sub={id:'sub_1',metadata:{userId:'user-1',offerId:'offer-1'},customer:'cus_1',status,cancel_at_period_end:false,items:{data:[{price:{id:'price_1'},current_period_end:1900000000}]},latest_invoice:{status:invoiceStatus}};
  const retrieve=vi.fn(async()=>sub);
  const checkout=vi.fn(async()=>({id:'cs_1',payment_status:'paid',metadata:{userId:'user-1',offerId:'offer-1'},mode:'subscription',subscription:'sub_1',amount_total:999,currency:'brl'}));
  return {query,sub,retrieve,checkout,client:{query} as unknown as PoolClient,stripe:{subscriptions:{retrieve},checkout:{sessions:{retrieve:checkout}}} as unknown as Stripe};
}
const event=(type:string,object:unknown)=>({id:'evt_1',type,data:{object}} as Stripe.Event);
describe('Stripe access lifecycle',()=>{
  it('does not fulfill unpaid Checkout sessions',async()=>{
    const f=fixture();f.checkout.mockResolvedValueOnce({id:'cs_1',payment_status:'unpaid'} as never);
    await processStripeEvent(f.client,f.stripe,event('checkout.session.completed',{id:'cs_1'}));
    expect(f.query).not.toHaveBeenCalled();
  });
  it('creates a purchase when a webhook arrives before checkout persistence',async()=>{
    const f=fixture();await processStripeEvent(f.client,f.stripe,event('checkout.session.async_payment_succeeded',{id:'cs_1'}));
    expect(f.query.mock.calls.some(([sql])=>sql.includes('INSERT INTO purchases'))).toBe(true);
    expect(f.query.mock.calls.some(([sql])=>sql.includes('INSERT INTO access_grants'))).toBe(true);
  });
  it('uses current Stripe state instead of a stale active subscription event',async()=>{
    const f=fixture('canceled');await processStripeEvent(f.client,f.stripe,event('customer.subscription.updated',{id:'sub_1',status:'active'}));
    expect(f.retrieve).toHaveBeenCalledWith('sub_1',{expand:['latest_invoice']});
    expect(f.query.mock.calls.some(([sql])=>sql.includes("status='EXPIRED'")&&sql.includes("source='SUBSCRIPTION'"))).toBe(true);
    expect(f.query.mock.calls.some(([sql])=>sql.includes('INSERT INTO access_grants'))).toBe(false);
  });
  it('keeps paid access during cancellation scheduled at period end',async()=>{
    const f=fixture();f.sub.cancel_at_period_end=true;
    await processStripeEvent(f.client,f.stripe,event('customer.subscription.updated',{id:'sub_1'}));
    expect(f.query.mock.calls.some(([sql])=>sql.includes('INSERT INTO access_grants'))).toBe(true);
  });
  it('does not extend the access period after failed renewal',async()=>{
    const f=fixture('past_due','open');await processStripeEvent(f.client,f.stripe,event('invoice.payment_failed',{parent:{subscription_details:{subscription:'sub_1'}}}));
    expect(f.query.mock.calls.some(([sql])=>sql.includes('access_grants'))).toBe(false);
  });
  it('extends paid access on invoice.paid',async()=>{
    const f=fixture();await processStripeEvent(f.client,f.stripe,event('invoice.paid',{parent:{subscription_details:{subscription:'sub_1'}}}));
    expect(f.query.mock.calls.some(([sql])=>sql.includes("expires_at=$2")&&sql.includes("status='ACTIVE'"))).toBe(true);
  });
  it('does not grant active subscriptions with an unpaid invoice',async()=>{
    const f=fixture('active','open');await processStripeEvent(f.client,f.stripe,event('customer.subscription.updated',{id:'sub_1'}));
    expect(f.query.mock.calls.some(([sql])=>sql.includes('access_grants'))).toBe(false);
  });
  it('marks only pending purchases as failed',async()=>{
    const f=fixture();await processStripeEvent(f.client,f.stripe,event('checkout.session.async_payment_failed',{id:'cs_1'}));
    expect(f.query.mock.calls[0][0]).toContain("status='PENDING'");
  });
  it('rejects unrelated price changes instead of granting the wrong course',async()=>{
    const f=fixture();f.sub.items.data[0].price.id='price_other';
    await expect(processStripeEvent(f.client,f.stripe,event('customer.subscription.updated',{id:'sub_1'}))).rejects.toThrow('price mismatch');
  });
  it('distinguishes settlement and subscription statuses',()=>{
    expect(isSettled('paid')).toBe(true);expect(isSettled('unpaid')).toBe(false);
    expect(subscriptionState('canceled')).toBe('CANCELLED');expect(subscriptionState('incomplete_expired')).toBe('EXPIRED');
  });
});
