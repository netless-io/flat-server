import { describe } from "mocha";
import { expect } from "chai";
import { ORM } from "../../src/utils/ORM";
import { orm } from "../../src/thirdPartyService/TypeORMService";
import { Connection } from "typeorm";

describe("ORM Utils", () => {
    let connection: Connection;
    before(async () => {
        connection = await orm();
    });
    after(() => connection.close());

    it("transaction", async () => {
        const orm = new ORM();

        let queryResult = "";

        await orm.transaction(async t => {
            queryResult = (await t.query("select 'test';"))[0].test;
        });

        expect(queryResult).eq("test");
    });
});
