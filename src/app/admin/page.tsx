import { query } from "@/lib/db";
type Metrics={users:number;active_subscribers:number;individual_subscribers:number;all_access_subscribers:number;published_courses:number;workshop_benefits:number;admin_grants:number;new_users:number};
export default async function AdminDashboard(){const metrics=(await query<Metrics>(`SELECT
 (SELECT count(*)::int FROM users) users,
 (SELECT count(DISTINCT user_id)::int FROM subscriptions WHERE status='ACTIVE') active_subscribers,
 (SELECT count(*)::int FROM subscriptions WHERE status='ACTIVE' AND resource_type='COURSE') individual_subscribers,
 (SELECT count(*)::int FROM subscriptions WHERE status='ACTIVE' AND resource_type='ALL_ACCESS') all_access_subscribers,
 (SELECT count(*)::int FROM courses WHERE status='PUBLISHED') published_courses,
 (SELECT count(*)::int FROM campaign_benefits WHERE status='PENDING') workshop_benefits,
 (SELECT count(*)::int FROM access_grants WHERE source='ADMIN' AND status='ACTIVE') admin_grants,
 (SELECT count(*)::int FROM users WHERE created_at>now()-interval '30 days') new_users`)).rows[0];const items=[['USUÁRIOS CADASTRADOS',metrics.users],['ASSINANTES ATIVOS',metrics.active_subscribers],['ASSINATURAS INDIVIDUAIS',metrics.individual_subscribers],['LIDERFLIX COMPLETO',metrics.all_access_subscribers],['CURSOS PUBLICADOS',metrics.published_courses],['BENEFÍCIOS PENDENTES',metrics.workshop_benefits],['ACESSOS MANUAIS',metrics.admin_grants],['NOVOS USUÁRIOS · 30D',metrics.new_users]];return <><div className="admin-title"><p>PAINEL ADMINISTRATIVO</p><h1>VISÃO GERAL</h1></div><section className="metric-grid">{items.map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section></>}
