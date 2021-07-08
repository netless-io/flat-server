import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { getConnection } from "typeorm";

export class ORM implements ORMType {
    public transaction(runInTransaction: (t: EntityManager) => Promise<void>): Promise<void> {
        return getConnection().transaction(runInTransaction);
    }
}

export interface ORMType {
    transaction(runInTransaction: (t: EntityManager) => Promise<void>): Promise<void>;
}
