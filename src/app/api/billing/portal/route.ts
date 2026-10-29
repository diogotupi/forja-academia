import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { assertSameOrigin } from '@/lib/security';
export async function POST(request: NextRequest) {
  try { assertSameOrigin(request); } catch { return NextResponse.json({error:'Origem não permitida'},{status:403}); }
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:'Entre na sua conta'},{status:401});
  const customers=(await query<{stripe_customer_id:string}>('SELECT DISTINCT stripe_customer_id FROM subscriptions WHERE user_id=$1',[user.id])).rows;
  const body=await request.json().catch(()=>({}));
  const customer=customers.find(c=>c.stripe_customer_id===body.customerId) || (customers.length===1?customers[0]:null);
  if(!customer) return NextResponse.json({error:'Assinatura não encontrada'},{status:404});
  try {
    const stripe=getStripe();
    const configs=await stripe.billingPortal.configurations.list({active:true,limit:100});
    const config=configs.data.find(c=>c.metadata?.integration==='academia_2630');
    if(!config || !process.env.APP_URL) throw new Error('Portal not configured');
    const session=await stripe.billingPortal.sessions.create({customer:customer.stripe_customer_id,configuration:config.id,return_url:process.env.APP_URL+'/perfil'});
    return NextResponse.json({url:session.url});
  } catch { return NextResponse.json({error:'Não foi possível abrir o gerenciamento agora.'},{status:503}); }
}
