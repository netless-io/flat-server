import { dataSource } from "./utils/mysql";
import {
    generatorFindData,
    SQLCount,
    SQLCreatePayloadField,
    SQLCreateResourceTypeField,
    SQLDeleteUnlessColumns,
    SQLFindData,
    SQLUpdate,
} from "./utils/sql";
import { transformData } from "./utils/transform";

const main = async () => {
    await dataSource.initialize();

    console.log(`create payload field`);
    await SQLCreatePayloadField();

    console.log(`create resource_type field`);
    await SQLCreateResourceTypeField();

    const count = await SQLCount();
    console.log(`cloud_storage_files count is: ${count}`);

    const it = await generatorFindData(SQLFindData(), count, 500);

    for await (const items of it) {
        const newItems = items.map(transformData);
        await SQLUpdate(newItems);
        console.log(`${newItems.length} data have been successfully updated`);
    }

    await SQLDeleteUnlessColumns();
    console.log("Done");

    await dataSource.destroy();
};

main().catch(console.error);
