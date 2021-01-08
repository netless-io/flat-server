import { DAO, Model } from "./Type";
import { getRepository } from "typeorm";
import { noDelete } from "./Utils";

export const DAOImplement: DAO<Model> = model => {
    return transaction => {
        const managerOrRepo = transaction || getRepository(model);

        return {
            find: (select, where, order) => {
                if (order) {
                    return getRepository(model)
                        .createQueryBuilder()
                        .select(select)
                        .where(where)
                        .orderBy(order[0], order[1])
                        .getRawMany();
                }

                return getRepository(model).find({
                    select,
                    where: noDelete(where),
                });
            },
            findOne: (select, where, order) => {
                if (order) {
                    return getRepository(model)
                        .createQueryBuilder()
                        .select(select)
                        .where(where)
                        .orderBy(order[0], order[1])
                        .getRawOne();
                }
                return getRepository(model).findOne({
                    select,
                    where: noDelete(where),
                });
            },
            insert: (data, ignore) => {
                if (ignore) {
                    return managerOrRepo
                        .createQueryBuilder()
                        .insert()
                        .into(model)
                        .orIgnore()
                        .values(data)
                        .execute();
                }

                return managerOrRepo.insert(model, data);
            },
            update: (setData, where) => {
                return managerOrRepo
                    .createQueryBuilder()
                    .update(model)
                    .set(setData)
                    .where(noDelete(where))
                    .execute();
            },
            remove: where => {
                return managerOrRepo
                    .createQueryBuilder()
                    .update(model)
                    .set({
                        is_delete: true,
                    })
                    .where(noDelete(where))
                    .execute();
            },
        };
    };
};
