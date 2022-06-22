import { IFindData, IFindDataPacket, ITransformData } from "../type";
import { dataSource } from "./mysql";

// find count in cloud_storage_files
export const SQLCount = async () => {
    const [rows] = await dataSource.query(`SELECT COUNT(1) as count FROM cloud_storage_files;`);
    return rows[0].count;
};

// create payload field in cloud_storage_files
export const SQLCreatePayloadField = async () => {
    await dataSource.query(
        `ALTER TABLE cloud_storage_files ADD COLUMN payload json DEFAULT (_utf8mb4'{}') NOT NULL AFTER file_url;`,
    );
};

// create resource_type field in cloud_storage_files
export const SQLCreateResourceTypeField = async () => {
    await dataSource.query(
        `ALTER TABLE cloud_storage_files ADD COLUMN resource_type varchar(20) NOT NULL AFTER payload;`,
    );
    await dataSource.query(
        `CREATE INDEX cloud_storage_files_resource_type_index ON cloud_storage_files (resource_type);`,
    );
};

// find cloud_storage_files data by limit and offset
export const SQLFindData = () => {
    return async (limit: number, offset: number) => {
        const [rows] = (await dataSource.query(
            `SELECT * FROM cloud_storage_files LIMIT ${limit} OFFSET ${offset};`,
        )) as [IFindDataPacket[]];

        return rows.map(item => {
            return {
                id: item.id,
                file_name: item.file_name,
                file_url: item.file_url,
                convert_step: item.convert_step,
                task_uuid: item.task_uuid,
                task_token: item.task_token,
                region: item.region,
            };
        });
    };
};

export function* generatorFindData(
    fn: (limit: number, offset: number) => Promise<IFindData[]>,
    count: number,
    limit: number,
) {
    let loopCount = Math.ceil(count / limit);

    for (let i = 0; i < loopCount; i++) {
        yield fn(limit, i * limit);
    }
}

// update payload and resource_type in cloud_storage_files
export const SQLUpdate = async (items: ITransformData[]) => {
    const sqlList = items
        .map(item => {
            return `UPDATE cloud_storage_files SET payload='${JSON.stringify(
                item.payload,
            )}', resource_type='${item.resourceType}' where id=${item.id};`;
        })
        .join("\n");

    await dataSource.query(sqlList);
};

export const SQLDeleteUnlessColumns = async () => {
    await dataSource.query(
        "ALTER TABLE cloud_storage_files DROP COLUMN convert_step, DROP COLUMN task_uuid, DROP COLUMN task_token, DROP COLUMN region;",
    );
};
