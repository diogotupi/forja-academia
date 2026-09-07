"use client";
import { useState } from "react";
const basePath=process.env.NEXT_PUBLIC_BASE_PATH??"/liderflix";
export function CheckoutButton({offerId,label}:{offerId:string;label:string}){const[loading,setLoading]=useState(false);const[error,setError]=useState("");return <div><button className="button red" disabled={loading} onClick={async()=>{setLoading(true);setError("");const response=await fetch(`${basePath}/api/checkout`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({offerId})});const result=await response.json();if(!response.ok){setError(result.error??"Não foi possível iniciar o checkout");setLoading(false);return}window.location.href=result.url}}>{loading?"ABRINDO CHECKOUT...":label}</button>{error&&<p className="form-error">{error}</p>}</div>}
