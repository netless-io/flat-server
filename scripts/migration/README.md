## 2022-08-25

We restructured our database cloud_storage_files on 25 Aug 2022. If you have deployed this project before this date and
would like to upgrade to the latest code. Please follow these instructions.

1. Create `scripts/migration/2022-08-25_db_cloud-storage-files/.env.yaml` files based on
   the `scripts/migration/2022-08-25_db_cloud-storage-files/.env.example.yaml` file format.
2. Fill in the configuration of the database connections you need to perform the migration.
3. Make sure there is no traffic coming in to the flat-server before you actually start, i.e.: shut down the service and
   let it go into the maintenance phase
4. Run `npx ts-node ./scripts/migration/2022-08-25_db_cloud-storage-files/index.ts`
5. Synchronise the flat-server code and redeploy the release.

## 2022-05-31

We restructured our database cloud_storage_files on 31 May 2022. If you have deployed this project before this date and
would like to upgrade to the latest code. Please follow these instructions.

1. Create `scripts/migration/2022-05-31_db_cloud-storage-files/.env.yaml` files based on
   the `scripts/migration/2022-05-31_db_cloud-storage-files/.env.example.yaml` file format.
2. Fill in the configuration of the database connections you need to perform the migration.
3. Make sure there is no traffic coming in to the flat-server before you actually start, i.e.: shut down the service and
   let it go into the maintenance phase
4. Run `npx ts-node ./scripts/migration/2022-05-26_db_cloud-storage-files/index.ts`
5. Synchronise the flat-server code and redeploy the release.
