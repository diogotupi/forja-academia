import { query } from "./db";

export type CatalogCourse={id:string;slug:string;title:string;subtitle:string;description:string;thumbnail:string|null;instructor:string;category:string;level:string;included_in_all_access:boolean;monthly_price_cents:number|null;lesson_count:number;has_access:boolean;access_expires_at:Date|null;progress_percent:number};

export async function listCatalog(userId:string){
  const result=await query<CatalogCourse>(`SELECT c.id,c.slug,c.title,c.subtitle,c.description,c.thumbnail,c.instructor,c.category,c.level,c.included_in_all_access,c.monthly_price_cents,
    count(DISTINCT l.id)::int AS lesson_count,
    EXISTS(SELECT 1 FROM access_grants g WHERE g.user_id=$1 AND g.status='ACTIVE' AND g.starts_at<=now() AND (g.expires_at IS NULL OR g.expires_at>now()) AND ((g.resource_type='COURSE' AND g.resource_id=c.id) OR (g.resource_type='ALL_ACCESS' AND c.included_in_all_access))) AS has_access,
    (SELECT max(g.expires_at) FROM access_grants g WHERE g.user_id=$1 AND g.status='ACTIVE' AND g.resource_type='COURSE' AND g.resource_id=c.id) AS access_expires_at,
    CASE WHEN count(DISTINCT l.id)=0 THEN 0 ELSE round(100.0*count(DISTINCT lp.lesson_id) FILTER(WHERE lp.completed_at IS NOT NULL)/count(DISTINCT l.id))::int END AS progress_percent
    FROM courses c LEFT JOIN lessons l ON l.course_id=c.id AND l.status='PUBLISHED' LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$1
    WHERE c.status='PUBLISHED' GROUP BY c.id ORDER BY c.created_at DESC`,[userId]);
  return result.rows;
}
