import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { AppHeader } from '@/components/app-header';
export const dynamic='force-dynamic';
export default async function PaymentPage({searchParams}:{searchParams:Promise<{session_id?:string}>}) {
  const user=await requireUser();const {session_id}=await searchParams;
  const purchase=(await query<{status:string}>('SELECT status FROM purchases WHERE user_id=$1 AND stripe_checkout_session_id=$2',[user.id,session_id??''])).rows[0];
  const paid=purchase?.status==='PAID';
  return <main className="profile-page"><AppHeader user={user}/><section><p className="eyebrow">SUA ASSINATURA</p><h1>{paid?'PAGAMENTO CONFIRMADO':'AGUARDANDO CONFIRMAÇÃO'}</h1><p>{paid?'Seu pagamento foi confirmado. Acesse o catálogo para começar.':'A confirmação pode levar alguns instantes. Seu acesso será liberado após a confirmação do pagamento.'}</p><div className="actions"><Link className="button red" href="/catalogo">Ir para o catálogo</Link>{!paid&&<a className="button outline" href={'?session_id='+encodeURIComponent(session_id??'')}>Atualizar confirmação</a>}</div></section></main>;
}
