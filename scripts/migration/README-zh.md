## 2022-05-31

我们在 2022 年 5 月 31 日重新调整了数据库中的 cloud_storage_files 表。如果你在这个日期之前部署了这个项目，并且想升级到最新的代码。请遵循这些指示。

1. 基于 `scripts/migration/2022-05-31_db_cloud-storage-files/.env.example.yaml`
   文件格式，创建 `scripts/migration/2022-05-31_db_cloud-storage-files/.env.yaml` 文件。
2. 填写你需要进行迁移的数据库连接的配置。
3. 在真正开始之前，请保证 flat-server 没有任何流量进来，即：关闭服务，进行维护阶段。
4. 运行 `npx ts-node ./scripts/migration/2022-05-26_db_cloud-storage-files/index.ts`
5. 同步 flat-server 代码，并重新部署发布。
