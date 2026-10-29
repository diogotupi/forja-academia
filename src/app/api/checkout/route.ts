import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { assertSameOrigin, checkRateLimit } from "@/lib/security";
import { getStripe } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validation";

type Offer = { id: string; slug: string; stripe_price_id: string; payment_mode: "payment" | "subscription"; resource_type: string; resource_id: string | null };
export async function POST(request: NextRequest) {
  try { assertSameOrigin(request); } catch { return NextResponse.json({error:"Origem não permitida"},{status:403}); }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({error:"Entre na sua conta para assinar."},{status:401});
  const parsed = checkoutSchema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Oferta inválida"},{status:400});
  try { checkRateLimit('checkout:'+user.id,10,300_000); } catch { return NextResponse.json({error:"Aguarde antes de tentar novamente."},{status:429}); }
  try {
    const offer = (await query<Offer>("SELECT * FROM offers WHERE slug=$1 AND active=true",[parsed.data.offerId])).rows[0];
    if (!offer) return NextResponse.json({error:"Oferta indisponível"},{status:404});
    const existing = await query("SELECT id FROM subscriptions WHERE user_id=$1 AND resource_type=$2 AND resource_id IS NOT DISTINCT FROM $3 AND status IN ('ACTIVE','PAST_DUE','INCOMPLETE')",[user.id,offer.resource_type,offer.resource_id]);
    if (offer.payment_mode === 'subscription' && existing.rowCount) return NextResponse.json({error:"Você já tem uma assinatura deste plano. Gerencie-a em Minha conta."},{status:409});
    const appUrl = process.env.APP_URL?.replace(/\/$/,'');
    if (!appUrl) throw new Error('Missing APP_URL');
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(offer.stripe_price_id);
    if (!price.active || (Boolean(price.recurring) !== (offer.payment_mode === 'subscription'))) throw new Error('Invalid price configuration');
    const metadata = {offerId:offer.id,offerSlug:offer.slug,userId:user.id,integration:'academia_2630'};
    const session = await stripe.checkout.sessions.create({
      mode:offer.payment_mode,line_items:[{price:price.id,quantity:1}],
      success_url:appUrl+'/pagamento?session_id={CHECKOUT_SESSION_ID}',cancel_url:appUrl+'/catalogo',
      customer_email:user.email,client_reference_id:user.id,metadata,
      subscription_data:offer.payment_mode==='subscription'?{metadata}:undefined,
      locale:'pt-BR',
    },{idempotencyKey:'checkout:'+user.id+':'+offer.id+':'+Math.floor(Date.now()/300_000)});
    await query("INSERT INTO purchases(user_id,offer_id,stripe_checkout_session_id,status,customer_email) VALUES($1,$2,$3,'PENDING',$4) ON CONFLICT(stripe_checkout_session_id) DO NOTHING",[user.id,offer.id,session.id,user.email]);
    return NextResponse.json({url:session.url});
  } catch { console.error('Checkout could not be created'); return NextResponse.json({error:"Não foi possível abrir o pagamento. Tente novamente em instantes."},{status:503}); }
}
