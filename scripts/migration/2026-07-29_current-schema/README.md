# Current flat-server schema

`schema.sql` is generated from the current TypeORM entities and includes the
classroom-resource dual-channel fields, indexes, and confirmation outbox.

Run it only after selecting a newly created, empty flat-server database:

```sql
SOURCE /absolute/path/to/schema.sql;
```

If legacy room data is imported after schema initialization, explicitly set
the profile that contains the original Agora/Netless credentials, then rerun
the migration. There is intentionally no implicit/default legacy profile:

```sql
SET @legacy_classroom_resource_profile_key = 'agora-a-v1';
SOURCE ../2026-07-28_classroom-resource-profiles/migration.sql;
```

The migration pins that operator decision, refuses a different key on later
runs, and fails unless every room, periodic template/instance, and recording
has a consistent immutable binding. The server repeats the same binding audit
at startup and also rejects keys that are absent from runtime configuration.

Regenerate after changing an entity:

```bash
npx ts-node --transpile-only scripts/migration/generate-current-schema.ts \
  > scripts/migration/2026-07-29_current-schema/schema.sql
```

# 历史迁移说明

当前全新 Flat Server 不需要导入旧房间数据；如果未来演练或切换明确要求导入，必须执行上面的显式绑定和完整性校验。迁移脚本不是双通道运行时默认逻辑，也不会从 profile key、白板 region 或默认 profile 猜测历史账号。
