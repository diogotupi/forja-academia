CREATE UNIQUE INDEX grants_source_resource_unique
ON access_grants(user_id, source, source_reference, resource_type, COALESCE(resource_id, '00000000-0000-0000-0000-000000000000'::uuid))
WHERE source_reference IS NOT NULL AND status <> 'REVOKED';
