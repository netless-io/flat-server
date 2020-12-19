import { isValid } from "date-fns/fp";
import Ajv, { FormatDefinition } from "ajv";

// link: https://github.com/ajv-validator/ajv/blob/cd7c6a8385464f818814ebb1e84cc703dc7ef02c/docs/api.md#ajvaddformatname-string-format-format-ajv
// link: https://github.com/ajv-validator/ajv-formats/blob/ce49433448384b4c0b2407adafc345e43b85f8ea/src/formats.ts#L38
const unixTimestamp: FormatDefinition<number> = {
    validate: data => {
        return isValid(data);
    },
};

export const ajvSelfPlugin = (ajv: Ajv) => {
    ajv.addFormat("unix-timestamp", unixTimestamp);
};
