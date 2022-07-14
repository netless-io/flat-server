import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import type { TestFn } from "ava";

export const initializeDataSource = (test: TestFn, namespace: string) => {
    test.before(`${namespace} - initialize dataSource`, async () => {
        await dataSource.initialize();
    });

    test.after(`${namespace} - destroy dataSource`, async () => {
        await dataSource.destroy();
    });
};
