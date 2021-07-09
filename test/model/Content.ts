import { describe } from "mocha";
import { expect } from "chai";
import { Content } from "../../src/model/Content";
import { getMetadataArgsStorage } from "typeorm";

describe("ORM Model Content", () => {
    it("default value", () => {
        const dateField = getMetadataArgsStorage()
            .filterColumns(Content)
            .filter(data => {
                return ["created_at", "updated_at"].includes(data.propertyName);
            })
            .map(({ options }) => {
                return ((options.default as unknown) as () => string)();
            });

        expect(dateField).deep.eq(["CURRENT_TIMESTAMP(3)", "CURRENT_TIMESTAMP(3)"]);
    });
});
