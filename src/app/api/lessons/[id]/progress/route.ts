import { NextRequest, NextResponse } from "next/server";
import { canAccess } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";
import { progressSchema } from "@/lib/validation";

export async function PUT(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{assertSameOrigin(request);const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Não autenticado"},{status:401});const{id}=await params;const lesson=(await query<{course_id:string;included_in_all_access:boolean;is_preview:boolean}>("SELECT l.course_id,l.is_preview,c.included_in_all_access FROM lessons l JOIN courses c ON c.id=l.course_id WHERE l.id=$1 AND l.status='PUBLISHED'",[id])).rows[0];if(!lesson)return NextResponse.json({error:"Aula não encontrada"},{status:404});if(!lesson.is_preview&&!await canAccess(user.id,{type:"COURSE",id:lesson.course_id,includedInAllAccess:lesson.included_in_all_access}))return NextResponse.json({error:"Sem acesso"},{status:403});const data=progressSchema.parse(await request.json());await query(`INSERT INTO lesson_progress(user_id,lesson_id,position_seconds,completed_at) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,lesson_id) DO UPDATE SET position_seconds=$3,completed_at=$4,updated_at=now()`,[user.id,id,data.positionSeconds,data.completed?new Date():null]);return NextResponse.json({ok:true})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Falha ao salvar progresso"},{status:400})}}
