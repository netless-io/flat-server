import { dataSource } from "../../../../thirdPartyService/TypeORMService";

export const useTransaction = async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    return {
        queryRunner,
        t: queryRunner.manager,
        commitTransaction: async () => {
            await queryRunner.commitTransaction();
        },
        rollbackTransaction: async () => {
            await queryRunner.rollbackTransaction();
        },
        releaseRunner: async () => {
            await queryRunner.release();
        },
    };
};
