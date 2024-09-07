import { UserAgreementDAO } from "../../../dao";
import { DeleteResult, EntityManager, InsertResult } from "typeorm";
import { UpdateResult } from "typeorm/query-builder/result/UpdateResult";

export class ServiceUserAgreement {
    constructor(private readonly userUUID: string) {}
    public async isAgreeCollectData(): Promise<boolean> {
        const bol = await ServiceUserAgreement.hasCollectData(this.userUUID);
        if (bol) {
            const isAgree = await ServiceUserAgreement.isAgreeCollectData(this.userUUID);
            return isAgree;
        }
        return true;
    }
    public async hasCollectData(): Promise<boolean> {
        return await ServiceUserAgreement.hasCollectData(this.userUUID);
    }
    public static async isAgreeCollectData(userUUID: string): Promise<boolean> {
        const result = await UserAgreementDAO().findOne(["is_agree_collect_data"], {
            user_uuid: userUUID,
        });
        return Boolean(result && result.is_agree_collect_data);
    }
    public static async hasCollectData(userUUID: string): Promise<boolean> {
        const result = await UserAgreementDAO().findOne(["user_uuid"], {
            user_uuid: userUUID,
        });
        return Boolean(result);
    }
    public async set(
        is_agree_collect_data: boolean,
        t?: EntityManager,
    ): Promise<InsertResult|UpdateResult> {
        const has = await this.hasCollectData();
        if (!has) {
            return await this.create(is_agree_collect_data, t);
        }
        return await this.update(is_agree_collect_data, t);
    }
    public async create(
        is_agree_collect_data: boolean,
        t?: EntityManager,
    ): Promise<InsertResult> {
        return await UserAgreementDAO(t).insert({
            user_uuid: this.userUUID,
            is_agree_collect_data,
        });
    }
    public async update(is_agree_collect_data: boolean, t?: EntityManager): Promise<UpdateResult> {
        return await UserAgreementDAO(t).update(
            {
                is_agree_collect_data,
            },
            {
                user_uuid: this.userUUID,
            },
        );
    }

    public async physicalDeletion(t?: EntityManager): Promise<DeleteResult> {
        return await UserAgreementDAO(t).physicalDeletion({
            user_uuid: this.userUUID,
        });
    }
}
