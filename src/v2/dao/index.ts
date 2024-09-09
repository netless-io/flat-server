import { Model } from "../../model";
import { EntityTarget } from "typeorm";
import { UserModel } from "../../model/user/User";
import { FindOptionsWhere } from "typeorm/find-options/FindOptionsWhere";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { UserWeChatModel } from "../../model/user/WeChat";
import { UserAppleModel } from "../../model/user/Apple";
import { UserGithubModel } from "../../model/user/Github";
import { UserAgoraModel } from "../../model/user/Agora";
import { UserGoogleModel } from "../../model/user/Google";
import { UserPhoneModel } from "../../model/user/Phone";
import { UserEmailModel } from "../../model/user/Email";
import { UserSensitiveModel } from "../../model/user/Sensitive";
import { UserPmiModel } from "../../model/user/Pmi";
import { UserAgreementModel } from "../../model/user/Agreement";
import { RoomModel } from "../../model/room/Room";
import { RoomUserModel } from "../../model/room/RoomUser";
import { RoomPeriodicConfigModel } from "../../model/room/RoomPeriodicConfig";
import { RoomPeriodicModel } from "../../model/room/RoomPeriodic";
import { RoomPeriodicUserModel } from "../../model/room/RoomPeriodicUser";
import { RoomRecordModel } from "../../model/room/RoomRecord";
import { CloudStorageUserFilesModel } from "../../model/cloudStorage/CloudStorageUserFiles";
import { CloudStorageFilesModel } from "../../model/cloudStorage/CloudStorageFiles";
import { CloudStorageConfigsModel } from "../../model/cloudStorage/CloudStorageConfigs";
import { OAuthInfosModel } from "../../model/oauth/oauth-infos";
import { OAuthSecretsModel } from "../../model/oauth/oauth-secrets";
import { OAuthUsersModel } from "../../model/oauth/oauth-users";
import { PartnerModel } from "../../model/partner/Partner";
import { PartnerRoomModel } from "../../model/partner/PartnerRoom";
import { dataSource } from "../../thirdPartyService/TypeORMService";

export class DAO<M extends Model> {
    public constructor(private readonly model: EntityTarget<M>) {}

    public async findOne<T extends keyof M>(
        t: EntityManager,
        select: T,
        where: FindOptionsWhere<M>,
        order?: [keyof M & string, "ASC" | "DESC"],
    ): Promise<Partial<Pick<M, T>>>;
    public async findOne<T extends keyof M>(
        t: EntityManager,
        select: T[],
        where: FindOptionsWhere<M>,
        order?: [keyof M & string, "ASC" | "DESC"],
    ): Promise<Pick<M, T> | null>;
    public async findOne<T extends keyof M>(
        t: EntityManager,
        select: T | T[],
        where: FindOptionsWhere<M>,
        order?: [keyof M & string, "ASC" | "DESC"],
    ): Promise<Pick<M, T>> {
        let sql = t
            .getRepository(this.model)
            .createQueryBuilder()
            .select(DAOUtils.select(select))
            .where(DAOUtils.softDelete(where));

        if (order) {
            sql = sql.orderBy(...order);
        }

        const result = await sql.getRawOne();
        if (Array.isArray(select)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return result || null;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result || {};
    }

    public async find<T extends keyof M>(
        t: EntityManager,
        select: T | T[],
        where: FindOptionsWhere<M>,
        config?: {
            order?: [keyof M & string, "ASC" | "DESC"];
            distinct?: boolean;
            limit?: number;
            offset?: number;
        },
    ): Promise<Pick<M, T>[]> {
        let sql = t
            .getRepository(this.model)
            .createQueryBuilder()
            .select(DAOUtils.select(select))
            .where(DAOUtils.softDelete(where))
            .limit(config?.limit)
            .offset(config?.offset);

        if (config?.distinct) {
            sql = sql.distinct(config.distinct);
        }

        if (config?.order) {
            sql = sql.orderBy(...config.order);
        }

        return await sql.getRawMany();
    }

    public async insert<D extends QueryDeepPartialEntity<M>>(
        t: EntityManager,
        data: D | D[],
        config?: {
            orUpdate?: (keyof D & string)[];
            orIgnore?: boolean;
        },
    ): Promise<void> {
        let sql = t
            .createQueryBuilder()
            .insert()
            .into(this.model)
            .values(data)
            .orIgnore(config?.orIgnore);

        if (config?.orUpdate) {
            sql = sql.orUpdate(config.orUpdate);
        }

        await sql.execute();
    }

    public async update(
        t: EntityManager | null,
        updateData: QueryDeepPartialEntity<M>,
        where: FindOptionsWhere<M>,
        config?: {
            order?: [keyof M & string, "ASC" | "DESC"];
            limit?: number;
        },
    ): Promise<void> {
        let sql = (t ? t.createQueryBuilder() : dataSource.createQueryBuilder())
            .update(this.model)
            .set(updateData)
            .where(DAOUtils.softDelete(where))
            .limit(config?.limit);

        if (config?.order) {
            sql = sql.orderBy(...config.order);
        }

        await sql.execute();
    }

    public async delete(t: EntityManager, where: FindOptionsWhere<M>): Promise<void> {
        await this.update(
            t,
            // @ts-ignore
            {
                is_delete: true,
            },
            where,
        );
    }

    public async count(t: EntityManager, where: FindOptionsWhere<M>): Promise<number> {
        return await t.getRepository(this.model).count({
            where: DAOUtils.softDelete(where),
        });
    }

    public async deleteHard(t: EntityManager, where: FindOptionsWhere<M>): Promise<void> {
        await t.createQueryBuilder().delete().from(this.model).where(where).execute();
    }
}

class DAOUtils {
    public static softDelete<T>(where: T): T {
        return {
            ...where,
            is_delete: false,
        };
    }

    public static select<T>(s: T | T[]): (T & string)[] {
        return (Array.isArray(s) ? s : [s]) as (T & string)[];
    }
}

export const userDAO = new DAO(UserModel);
export const userWeChatDAO = new DAO(UserWeChatModel);
export const userGithubDAO = new DAO(UserGithubModel);
export const userAppleDAO = new DAO(UserAppleModel);
export const userAgoraDAO = new DAO(UserAgoraModel);
export const userGoogleDAO = new DAO(UserGoogleModel);
export const userPhoneDAO = new DAO(UserPhoneModel);
export const userEmailDAO = new DAO(UserEmailModel);
export const userSensitiveDAO = new DAO(UserSensitiveModel);
export const userPmiDAO = new DAO(UserPmiModel);
export const userAgreementDAO = new DAO(UserAgreementModel);
export const roomDAO = new DAO(RoomModel);
export const roomUserDAO = new DAO(RoomUserModel);
export const roomPeriodicConfigDAO = new DAO(RoomPeriodicConfigModel);
export const roomPeriodicDAO = new DAO(RoomPeriodicModel);
export const roomPeriodicUserDAO = new DAO(RoomPeriodicUserModel);
export const roomRecordDAO = new DAO(RoomRecordModel);
export const cloudStorageUserFilesDAO = new DAO(CloudStorageUserFilesModel);
export const cloudStorageFilesDAO = new DAO(CloudStorageFilesModel);
export const cloudStorageConfigsDAO = new DAO(CloudStorageConfigsModel);
export const oauthInfosDAO = new DAO(OAuthInfosModel);
export const oauthSecretsDAO = new DAO(OAuthSecretsModel);
export const oauthUsersDAO = new DAO(OAuthUsersModel);
export const partnerDAO = new DAO(PartnerModel);
export const partnerRoomDAO = new DAO(PartnerRoomModel);
