import { dataSource } from "../../../../thirdPartyService/TypeORMService";

export const useTransaction = async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    return {
        queryRunner,
        t: queryRunner.manager,
        startTransaction: async () => {
            await queryRunner.startTransaction();
        },
        commitTransaction: async () => {
            await queryRunner.commitTransaction();
        },
        rollbackTransaction: async () => {
            await queryRunner.rollbackTransaction();
        },
        releaseRunner: async () => {
            if (queryRunner.isTransactionActive) {
                await queryRunner.commitTransaction();
            }

            await queryRunner.release();
        },
    };
};
