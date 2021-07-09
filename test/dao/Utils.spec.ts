import { describe } from "mocha";
import { expect } from "chai";
import { noDelete } from "../../src/dao/Utils";

describe("DAO Utils", () => {
    it("noDelete", () => {
        const result = noDelete({
            test: 1,
        });

        expect(result).deep.eq({
            test: 1,
            is_delete: false,
        });
    });
});
