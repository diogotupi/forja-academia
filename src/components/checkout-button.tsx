"use client";
import { useState } from 'react';
export function CheckoutButton({offerId,label}:{offerId:string;label:string}) {
 const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 return <div><button type="button" className="button red" disabled={loading} onClick={async()=>{setLoading(true);setError('');try{const response=await fetch((process.env.NEXT_PUBLIC_BASE_PATH??'/liderflix')+'/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({offerId})});const result=await response.json();if(!response.ok)throw new Error(result.error??'Não foi possível iniciar o checkout');window.location.assign(result.url);}catch(error){setError(error instanceof Error?error.message:'Falha de conexão. Tente novamente.');setLoading(false);}}}>{loading?'ABRINDO CHECKOUT…':label}</button>{error&&<p className="form-error" role="alert">{error}</p>}</div>;
}