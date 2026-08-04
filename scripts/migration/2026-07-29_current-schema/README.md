# Current flat-server schema

`schema.sql` is generated from the current TypeORM entities and includes the
classroom-resource dual-channel fields, indexes, and confirmation outbox.

Run it only after selecting a newly created, empty flat-server database:

```sql
SOURCE /absolute/path/to/schema.sql;
```

If legacy room data is imported after schema initialization, rerun
`../2026-07-28_classroom-resource-profiles/migration.sql` after the data import.
That resumable migration backfills immutable resource bindings to
`channel_a_v1`.

Regenerate after changing an entity:

```bash
npx ts-node --transpile-only scripts/migration/generate-current-schema.ts \
  > scripts/migration/2026-07-29_current-schema/schema.sql
```
