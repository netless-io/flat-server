import { describe } from "mocha";
import { expect } from "chai";
import { DAOImplement } from "../../src/dao/Implement";
import { Connection } from "typeorm";
import { orm } from "../../src/thirdPartyService/TypeORMService";
import { CloudStorageUserFilesModel } from "../../src/model/cloudStorage/CloudStorageUserFiles";
import { v4 } from "uuid";
import { DAO } from "../../src/dao/Type";

describe("DAO Implement", () => {
    const CloudStorageUserFilesDAO = DAOImplement(CloudStorageUserFilesModel) as ReturnType<
        DAO<CloudStorageUserFilesModel>
    >;

    let connection: Connection;
    before(async () => {
        connection = await orm();
        await connection.synchronize(true);
    });
    after(() => connection.close());

    it("keys length", () => {
        const daoKeys = Object.keys(CloudStorageUserFilesDAO()).sort();

        expect(daoKeys).members(["count", "find", "findOne", "insert", "remove", "update"]);
    });

    it("insert normal and findOne for normal", async () => {
        const [userUUID, fileUUID] = [v4(), v4()];

        await CloudStorageUserFilesDAO().insert({
            user_uuid: userUUID,
            file_uuid: fileUUID,
        });

        const result = await CloudStorageUserFilesDAO().findOne(["file_uuid"], {
            user_uuid: userUUID,
        });

        expect(result!.file_uuid).eq(fileUUID);
    });

    it("insert orUpdate", async () => {
        const [userUUID, fileUUID, newFileUUID] = [v4(), v4(), v4()];

        await CloudStorageUserFilesDAO().insert({
            user_uuid: userUUID,
            file_uuid: fileUUID,
        });

        await CloudStorageUserFilesDAO().insert(
            {
                user_uuid: userUUID,
                file_uuid: fileUUID,
            },
            {
                orUpdate: {
                    file_uuid: newFileUUID,
                },
            },
        );

        const result = await CloudStorageUserFilesDAO().findOne(["file_uuid"], {
            user_uuid: userUUID,
        });

        expect(result!.file_uuid).eq(newFileUUID);
    });

    it("insert orIgnore", async () => {
        const [userUUID, fileUUID] = [v4(), v4(), v4()];

        await CloudStorageUserFilesDAO().insert({
            user_uuid: userUUID,
            file_uuid: fileUUID,
        });

        await CloudStorageUserFilesDAO().insert(
            {
                user_uuid: userUUID,
                file_uuid: fileUUID,
                is_delete: true,
            },
            {
                orIgnore: true,
            },
        );

        const result = await CloudStorageUserFilesDAO().findOne(["file_uuid"], {
            user_uuid: userUUID,
        });

        expect(result!.file_uuid).eq(fileUUID);
    });

    it("insert multiple data and find for normal", async () => {
        const [userUUID, fileUUID1, fileUUID2] = [v4(), v4(), v4()];

        await CloudStorageUserFilesDAO().insert([
            {
                user_uuid: userUUID,
                file_uuid: fileUUID1,
            },
            {
                user_uuid: userUUID,
                file_uuid: fileUUID2,
            },
            {
                user_uuid: v4(),
                file_uuid: v4(),
            },
        ]);

        const result = (
            await CloudStorageUserFilesDAO().find(["file_uuid"], {
                user_uuid: userUUID,
            })
        ).map(data => data.file_uuid);

        expect(result).an("array").length(2).include(fileUUID1).include(fileUUID2);
    });

    it("findOne order", async () => {
        const [userUUID, fileUUID1, fileUUID2] = [v4(), "aaa", "bbb"];

        await CloudStorageUserFilesDAO().insert([
            {
                user_uuid: userUUID,
                file_uuid: fileUUID1,
            },
            {
                user_uuid: userUUID,
                file_uuid: fileUUID2,
            },
        ]);

        const result = await CloudStorageUserFilesDAO().findOne(
            ["file_uuid"],
            {
                user_uuid: userUUID,
            },
            ["file_uuid", "DESC"],
        );

        expect(result!.file_uuid).eq(fileUUID2);
    });

    it("find order", async () => {
        const [userUUID, fileUUID1, fileUUID2] = [v4(), "ccc", "ddd"];

        await CloudStorageUserFilesDAO().insert([
            {
                user_uuid: userUUID,
                file_uuid: fileUUID1,
            },
            {
                user_uuid: userUUID,
                file_uuid: fileUUID2,
            },
        ]);

        const result = (
            await CloudStorageUserFilesDAO().find(
                ["file_uuid"],
                {
                    user_uuid: userUUID,
                },
                {
                    order: ["file_uuid", "DESC"],
                },
            )
        ).map(data => data.file_uuid);

        expect(result).deep.eq([fileUUID2, fileUUID1]);
    });

    it("find distinct", async () => {
        const [userUUID, fileUUID1, fileUUID2] = [v4(), v4(), v4()];

        await CloudStorageUserFilesDAO().insert([
            {
                user_uuid: userUUID,
                file_uuid: fileUUID1,
                version: 1,
            },
            {
                user_uuid: userUUID,
                file_uuid: fileUUID2,
                version: 1,
            },
        ]);

        const result = await CloudStorageUserFilesDAO().find(
            ["version"],
            {
                user_uuid: userUUID,
            },
            {
                distinct: true,
            },
        );

        expect(result)
            .length(1)
            .deep.eq([
                {
                    version: 1,
                },
            ]);
    });

    it("count", async () => {
        const userUUID = v4();

        await CloudStorageUserFilesDAO().insert([
            {
                user_uuid: userUUID,
                file_uuid: v4(),
            },
            {
                user_uuid: userUUID,
                file_uuid: v4(),
            },
            {
                user_uuid: v4(),
                file_uuid: v4(),
            },
        ]);

        const result = await CloudStorageUserFilesDAO().count({
            user_uuid: userUUID,
        });

        expect(result).eq(2);
    });

    it("remove", async () => {
        const userUUID = v4();

        await CloudStorageUserFilesDAO().insert([
            {
                user_uuid: userUUID,
                file_uuid: v4(),
            },
            {
                user_uuid: userUUID,
                file_uuid: v4(),
            },
        ]);

        await CloudStorageUserFilesDAO().remove({
            user_uuid: userUUID,
        });

        const result = await CloudStorageUserFilesDAO().count({
            user_uuid: userUUID,
        });

        expect(result).eq(0);
    });

    it("update normal", async () => {
        const userUUID = v4();
        const fileUUID = v4();

        await CloudStorageUserFilesDAO().insert([
            {
                user_uuid: userUUID,
                file_uuid: v4(),
            },
        ]);

        await CloudStorageUserFilesDAO().update(
            {
                file_uuid: fileUUID,
            },
            {
                user_uuid: userUUID,
            },
        );

        const result = await CloudStorageUserFilesDAO().findOne(["file_uuid"], {
            user_uuid: userUUID,
        });

        expect(result!.file_uuid).eq(fileUUID);
    });

    it("update order and limit", async () => {
        const [userUUID, fileUUID1, fileUUID2, newFileUUID] = [v4(), "eee", "fff", "ggg"];

        await CloudStorageUserFilesDAO().insert([
            {
                user_uuid: userUUID,
                file_uuid: fileUUID1,
            },
            {
                user_uuid: userUUID,
                file_uuid: fileUUID2,
            },
        ]);

        await CloudStorageUserFilesDAO().update(
            {
                file_uuid: newFileUUID,
            },
            {
                user_uuid: userUUID,
            },
            ["file_uuid", "DESC"],
            1,
        );

        const result = await CloudStorageUserFilesDAO().findOne(
            ["file_uuid"],
            {
                user_uuid: userUUID,
            },
            ["file_uuid", "DESC"],
        );

        expect(result!.file_uuid).eq(newFileUUID);
    });
});
