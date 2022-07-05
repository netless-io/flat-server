import test from "ava";
import { getMetadataArgsStorage } from "typeorm";
import { Content } from "./Content";

const namespace = "[orm][model]";

test(`${namespace} - default value`, ava => {
    const dateField = getMetadataArgsStorage()
        .filterColumns(Content)
        .filter(data => {
            return ["created_at", "updated_at"].includes(data.propertyName);
        })
        .map(({ options }) => {
            return (options.default as unknown as () => string)();
        });

    ava.deepEqual(dateField, ["CURRENT_TIMESTAMP(3)", "CURRENT_TIMESTAMP(3)"]);
});
