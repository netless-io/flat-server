import { Connection } from "mysql2/promise";
import { ICount, IFindData, IFindDataPacket, ITransformData } from "../type";

// find count in cloud_storage_files
export const SQLCount = async (connection: Connection) => {
    const [rows] = await connection.query<[ICount]>(
        `SELECT COUNT(1) as count FROM cloud_storage_files;`,
    );
    return rows[0].count;
};

// create payload field in cloud_storage_files
export const SQLCreatePayloadField = async (connection: Connection) => {
    await connection.query(
        `ALTER TABLE cloud_storage_files ADD COLUMN payload json DEFAULT (_utf8mb4'{}') NOT NULL AFTER file_url;`,
    );
};

// create affiliation field in cloud_storage_files
export const SQLCreateAffiliationField = async (connection: Connection) => {
    await connection.query(
        `ALTER TABLE cloud_storage_files ADD COLUMN affiliation varchar(20) NOT NULL AFTER payload;`,
    );
    await connection.query(
        `CREATE INDEX cloud_storage_files_affiliation_index ON cloud_storage_files (affiliation);`,
    );
};

// find cloud_storage_files data by limit and offset
export const SQLFindData = (connection: Connection) => {
    return async (limit: number, offset: number) => {
        const [rows] = await connection.query<[IFindDataPacket]>(
            `SELECT * FROM cloud_storage_files LIMIT ${limit} OFFSET ${offset};`,
        );

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

// update payload and affiliation in cloud_storage_files
export const SQLUpdate = async (connection: Connection, items: ITransformData[]) => {
    const sqlList = items
        .map(item => {
            return `UPDATE cloud_storage_files SET payload='${JSON.stringify(
                item.payload,
            )}', affiliation='${item.affiliation}' where id=${item.id};`;
        })
        .join("\n");

    await connection.query<[IFindDataPacket]>(sqlList);
};

export const SQLDeleteUnlessColumns = async (connection: Connection) => {
    await connection.query(
        "ALTER TABLE cloud_storage_files DROP COLUMN convert_step, DROP COLUMN task_uuid, DROP COLUMN task_token, DROP COLUMN region;",
    );
};
