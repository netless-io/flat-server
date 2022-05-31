import path from "path";
import { getConfig } from "./utils/getConfig";
import { getConnection } from "./utils/mysql";
import {
    generatorFindData,
    SQLCount,
    SQLCreateAffiliationField,
    SQLCreatePayloadField,
    SQLDeleteUnlessColumns,
    SQLFindData,
    SQLUpdate,
} from "./utils/sql";
import { transformData } from "./utils/transform";

const main = async () => {
    const config = getConfig(path.join(__dirname, ".env.yaml"));

    const connection = await getConnection(config);

    console.log(`create payload field`);
    await SQLCreatePayloadField(connection);

    console.log(`create affiliation field`);
    await SQLCreateAffiliationField(connection);

    const count = await SQLCount(connection);
    console.log(`cloud_storage_files count is: ${count}`);

    const it = await generatorFindData(SQLFindData(connection), count, 500);

    for await (const items of it) {
        const newItems = items.map(transformData);
        await SQLUpdate(connection, newItems);
        console.log(`${newItems.length} data have been successfully updated`);
    }

    await SQLDeleteUnlessColumns(connection);
    console.log("Done");

    await connection.end();
    connection.destroy();
};

main().catch(console.error);
