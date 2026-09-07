"use client";
import { useState } from "react";
const basePath=process.env.NEXT_PUBLIC_BASE_PATH??"/liderflix";
export function ProgressButton({lessonId,completed}:{lessonId:string;completed:boolean}){const[done,setDone]=useState(completed);const[loading,setLoading]=useState(false);return <button className={`button ${done?"outline":"red"}`} disabled={loading} onClick={async()=>{setLoading(true);const response=await fetch(`${basePath}/api/lessons/${lessonId}/progress`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({positionSeconds:0,completed:!done})});if(response.ok)setDone(!done);setLoading(false)}}>{loading?"SALVANDO...":done?"✓ AULA CONCLUÍDA":"MARCAR COMO CONCLUÍDA"}</button>}
