import { DAO, Model } from "./Type";
import { getRepository } from "typeorm";
import { noDelete } from "./Utils";

export const DAOImplement: DAO<Model> = model => {
    return transaction => {
        const managerOrRepo = transaction || getRepository(model);

        return {
            find: (select, where, config) => {
                if (config?.order || config?.distinct) {
                    let result = getRepository(model)
                        .createQueryBuilder()
                        .select(select)
                        .where({
                            ...noDelete(where),
                        });

                    if (config.distinct) {
                        result = result.distinct(true);
                    }

                    if (config.order) {
                        result = result.orderBy(config.order[0], config.order[1]);
                    }

                    return result.getRawMany();
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
                        .where({
                            ...noDelete(where),
                        })
                        .orderBy(order[0], order[1])
                        .getRawOne();
                }
                return getRepository(model).findOne({
                    select,
                    where: noDelete(where),
                });
            },
            insert: (data, flag) => {
                if (flag?.orUpdate) {
                    return managerOrRepo
                        .createQueryBuilder()
                        .insert()
                        .orUpdate({
                            columns: Object.keys(flag.orUpdate),
                        })
                        .setParameters(flag.orUpdate)
                        .into(model)
                        .values(data)
                        .execute();
                }

                if (flag?.orIgnore) {
                    return managerOrRepo
                        .createQueryBuilder()
                        .insert()
                        .into(model)
                        .orIgnore()
                        .values(data)
                        .execute();
                }

                return managerOrRepo
                    .createQueryBuilder()
                    .insert()
                    .into(model)
                    .values(data)
                    .execute();
            },
            update: (setData, where, order, limit) => {
                const result = managerOrRepo
                    .createQueryBuilder()
                    .update(model)
                    .set(setData)
                    .where(noDelete(where));

                if (order && limit) {
                    return result.orderBy(order[0], order[1]).limit(limit).execute();
                }

                return result.execute();
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
            count: where => {
                return getRepository(model).count({
                    where: noDelete(where),
                });
            },
        };
    };
};
