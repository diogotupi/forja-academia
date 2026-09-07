import type { QueryResultRow } from "pg";
import { query } from "@/lib/db";

export type ProtectedResource = { type: "COURSE" | "EBOOK"; id: string; includedInAllAccess?: boolean; isFree?: boolean };
type Queryable = { query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<{ rows: T[] }> };

export async function canAccess(userId: string, resource: ProtectedResource, database: Queryable = { query }) {
  if (resource.isFree) return true;
  const result = await database.query<{ allowed: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM access_grants g
      WHERE g.user_id=$1 AND g.status='ACTIVE' AND g.starts_at<=now()
      AND (g.expires_at IS NULL OR g.expires_at>now())
      AND (
        (g.resource_type=$2 AND g.resource_id=$3)
        OR (g.resource_type='ALL_ACCESS' AND $4::boolean=true)
      )
    ) AS allowed`, [userId, resource.type, resource.id, resource.includedInAllAccess ?? false]);
  return result.rows[0]?.allowed ?? false;
}
