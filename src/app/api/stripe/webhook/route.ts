import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { processStripeEvent } from "@/lib/stripe-events";
export const runtime = 'nodejs';
export async function POST(request:NextRequest) {
  const secret=process.env.STRIPE_WEBHOOK_SECRET;
  if(!secret) return NextResponse.json({error:'Webhook indisponível'},{status:503});
  const signature=request.headers.get('stripe-signature');
  if(!signature) return NextResponse.json({error:'Assinatura ausente'},{status:400});
  const payload=await request.text();
  let event;
  try { event=getStripe().webhooks.constructEvent(payload,signature,secret); }
  catch { return NextResponse.json({error:'Assinatura inválida'},{status:400}); }
  try {
    await transaction(async client=>{
      const inserted=await client.query('INSERT INTO processed_webhook_events(stripe_event_id,event_type,payload_sha256) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING stripe_event_id',[event.id,event.type,createHash('sha256').update(payload).digest('hex')]);
      if(!inserted.rowCount)return;
      await processStripeEvent(client,getStripe(),event);
    });
    return NextResponse.json({received:true});
  } catch { console.error('Stripe webhook retry required',event.id,event.type);return NextResponse.json({error:'Falha ao processar evento'},{status:500}); }
}
