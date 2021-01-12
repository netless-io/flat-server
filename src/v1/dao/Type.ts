import { UpdateResult } from "typeorm/query-builder/result/UpdateResult";
import { FindOperator } from "typeorm";
import { InsertResult } from "typeorm/query-builder/result/InsertResult";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { RoomModel } from "../model/room/Room";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { EntityTarget } from "typeorm/common/EntityTarget";
import { RoomUserModel } from "../model/room/RoomUser";
import { UserModel } from "../model/user/User";
import { UserWeChatModel } from "../model/user/WeChat";
import { RoomPeriodicConfigModel } from "../model/room/RoomPeriodicConfig";
import { RoomPeriodicModel } from "../model/room/RoomPeriodic";
import { RoomDocModel } from "../model/room/RoomDoc";
import { RoomPeriodicUserModel } from "../model/room/RoomPeriodicUser";

export type Where<M> = {
    [key in keyof M]?: M[key] | FindOperator<M[key]>;
};

type Find<M> = <T extends keyof M>(
    select: T[],
    where: Where<M>,
    order?: [T, "ASC" | "DESC"],
) => Promise<Pick<M, T>[]>;

type FindOne<M> = <T extends keyof M>(
    select: T[],
    where: Where<M>,
    order?: [T, "ASC" | "DESC"],
) => Promise<Pick<M, T> | undefined>;

type Insert<M> = (
    data: QueryDeepPartialEntity<M> | QueryDeepPartialEntity<M>[],
    flag?:
        | true
        | {
              [key in keyof M]?: M[key];
          },
) => Promise<InsertResult>;

type Update<M> = (setData: QueryDeepPartialEntity<M>, where: Where<M>) => Promise<UpdateResult>;

type Remove<M> = (where: Where<M>) => Promise<UpdateResult>;

export type Model =
    | UserModel
    | UserWeChatModel
    | RoomModel
    | RoomUserModel
    | RoomPeriodicConfigModel
    | RoomPeriodicModel
    | RoomDocModel
    | RoomPeriodicUserModel;

export type DAO<T extends Model> = (
    model: EntityTarget<T>,
) => (
    transaction?: EntityManager,
) => {
    find: Find<T>;
    findOne: FindOne<T>;
    remove: Remove<T>;
    update: Update<T>;
    insert: Insert<T>;
};
