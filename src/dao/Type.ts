import { UpdateResult } from "typeorm/query-builder/result/UpdateResult";
import { DeleteResult, FindOperator } from "typeorm";
import { InsertResult } from "typeorm/query-builder/result/InsertResult";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { EntityTarget } from "typeorm/common/EntityTarget";
import { Model } from "../model";

export type Where<M> = {
    [key in keyof M]?: M[key] | FindOperator<M[key]>;
};

type Find<M> = <T extends keyof M>(
    select: T[],
    where: Where<M>,
    config?: {
        order?: [T, "ASC" | "DESC"];
        distinct?: boolean;
        limit?: number;
    },
) => Promise<Pick<M, T>[]>;

type FindOne<M> = <T extends keyof M>(
    select: T[],
    where: Where<M>,
    order?: [T, "ASC" | "DESC"],
) => Promise<Pick<M, T> | undefined>;

type Insert<M> = (
    data: QueryDeepPartialEntity<M> | QueryDeepPartialEntity<M>[],
    config?: {
        orUpdate?: {
            [key in keyof M]?: M[key];
        };
        orIgnore?: boolean;
    },
) => Promise<InsertResult>;

type Update<M> = (
    setData: QueryDeepPartialEntity<M>,
    where: Where<M>,
    order?: [keyof M, "ASC" | "DESC"],
    limit?: number,
) => Promise<UpdateResult>;

type Remove<M> = (where: Where<M>) => Promise<UpdateResult>;

type Count<M> = (where: Where<M>) => Promise<number>;

type PhysicalDeletion<M> = (where: Where<M>) => Promise<DeleteResult>;

export type DAO<T extends Model> = (model: EntityTarget<T>) => (transaction?: EntityManager) => {
    find: Find<T>;
    findOne: FindOne<T>;
    remove: Remove<T>;
    update: Update<T>;
    insert: Insert<T>;
    count: Count<T>;
    physicalDeletion: PhysicalDeletion<T>;
};
