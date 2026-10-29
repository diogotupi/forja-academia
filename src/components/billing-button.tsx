"use client";
import { useState } from 'react';
export function BillingButton({customerId}:{customerId:string}) {
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  return <div><button type="button" className="button outline" disabled={busy} onClick={async()=>{
    setBusy(true);setError('');
    try { const response=await fetch((process.env.NEXT_PUBLIC_BASE_PATH??'/liderflix')+'/api/billing/portal',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({customerId})});const data=await response.json();if(!response.ok)throw new Error(data.error);window.location.assign(data.url); }
    catch { setError('Não foi possível abrir o gerenciamento. Tente novamente.');setBusy(false); }
  }}>{busy?'Abrindo…':'Gerenciar assinatura'}</button>{error&&<p role="alert">{error}</p>}</div>;
}
