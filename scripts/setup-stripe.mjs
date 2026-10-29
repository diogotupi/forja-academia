// Run with an ignored environment file after confirming the client's account ID.
// Creates recurring prices and an endpoint; never charges a customer.
import Stripe from 'stripe';
import pg from 'pg';
import { writeFileSync } from 'node:fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const account = await stripe.accounts.retrieve();
if (!process.env.STRIPE_ACCOUNT_ID || account.id !== process.env.STRIPE_ACCOUNT_ID) throw new Error('Confirm STRIPE_ACCOUNT_ID before setup');
const appUrl = new URL(process.env.APP_URL);
if (appUrl.protocol !== 'https:') throw new Error('HTTPS APP_URL required');
const pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
try {
  const courses = (await pool.query("SELECT id,slug,title FROM courses WHERE status='PUBLISHED' ORDER BY slug")).rows;
  const plans = [{slug:'academia-mensal',title:'Academia de Liderança — acesso total',amount:4999,type:'ALL_ACCESS',id:null},
    ...courses.map(c=>({slug:c.slug+'-mensal',title:c.title,amount:999,type:'COURSE',id:c.id}))];
  for (const plan of plans) {
    const lookup = 'academia_2630_'+plan.slug+'_brl_month_'+plan.amount;
    let price = (await stripe.prices.list({lookup_keys:[lookup],limit:1})).data[0];
    if (!price) {
      const product = await stripe.products.create({name:plan.title,metadata:{integration:'academia_2630',offerSlug:plan.slug}},{idempotencyKey:'product:'+lookup});
      price = await stripe.prices.create({product:product.id,currency:'brl',unit_amount:plan.amount,recurring:{interval:'month'},lookup_key:lookup},{idempotencyKey:'price:'+lookup});
    }
    if (!price.active || price.unit_amount!==plan.amount || price.currency!=='brl' || price.recurring?.interval!=='month' || price.recurring.interval_count!==1) throw new Error('Existing price mismatch: '+plan.slug);
    await pool.query(`INSERT INTO offers(slug,name,stripe_price_id,payment_mode,resource_type,resource_id,active) VALUES($1,$2,$3,'subscription',$4,$5,true)
      ON CONFLICT(slug) DO UPDATE SET name=$2,stripe_price_id=$3,payment_mode='subscription',resource_type=$4,resource_id=$5,active=true,updated_at=now()`,[plan.slug,plan.title,price.id,plan.type,plan.id]);
    if(plan.id) await pool.query('UPDATE courses SET stripe_price_id=$2,monthly_price_cents=999,included_in_all_access=true,updated_at=now() WHERE id=$1',[plan.id,price.id]);
    console.log('Plan configured:',plan.slug,plan.amount);
  }
  const url=process.env.APP_URL.replace(/\/$/,'')+'/api/stripe/webhook';
  const enabled_events=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','customer.subscription.paused','customer.subscription.resumed','invoice.paid','invoice.payment_failed'];
  const endpoints=await stripe.webhookEndpoints.list({limit:100});
  let endpoint=endpoints.data.find(e=>e.url===url);
  if(endpoint) await stripe.webhookEndpoints.update(endpoint.id,{enabled_events,disabled:false});
  else {
    // Pin to the schema of the installed Stripe SDK (v18).
    endpoint=await stripe.webhookEndpoints.create({url,enabled_events,api_version:'2025-08-27.basil',description:'Academia de Liderança — acesso e assinaturas'});
    writeFileSync('.env.stripe-webhook.local','STRIPE_WEBHOOK_SECRET='+endpoint.secret+'\n',{mode:0o600});
  }
  const configurations=await stripe.billingPortal.configurations.list({limit:100});
  if(!configurations.data.some(c=>c.active&&c.metadata?.integration==='academia_2630')) {
    await stripe.billingPortal.configurations.create({business_profile:{headline:'Academia de Liderança'},metadata:{integration:'academia_2630'},features:{subscription_cancel:{enabled:true,mode:'at_period_end'},payment_method_update:{enabled:true},invoice_history:{enabled:true}});
  }
  console.log('Webhook:',endpoint.id,url);
} finally { await pool.end(); }
