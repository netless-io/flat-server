import { isValid } from "date-fns/fp";
import { validate as uuidValidate, version as uuidVersion } from "uuid";
import Ajv, { FormatDefinition } from "ajv";
import path from "path";
import { CloudStorage } from "../Constants";

// link: https://github.com/ajv-validator/ajv/blob/cd7c6a8385464f818814ebb1e84cc703dc7ef02c/docs/api.md#ajvaddformatname-string-format-format-ajv
// link: https://github.com/ajv-validator/ajv-formats/blob/ce49433448384b4c0b2407adafc345e43b85f8ea/src/formats.ts#L38
const unixTimestamp: FormatDefinition<number> = {
    type: "number",
    validate: date => {
        // must be a millisecond timestamp
        if (String(date).length !== 13) {
            return false;
        }

        return isValid(date);
    },
};

const uuidV4: FormatDefinition<string> = {
    validate: uuid => {
        return uuidValidate(uuid) && uuidVersion(uuid) === 4;
    },
};

const fileSuffix: FormatDefinition<string> = {
    validate: fileName => {
        const suffix = path.extname(fileName).substr(1);

        return CloudStorage.ALLOW_FILE_SUFFIX.includes(suffix);
    },
};

export const ajvSelfPlugin = (ajv: Ajv): void => {
    ajv.addFormat("unix-timestamp", unixTimestamp);
    ajv.addFormat("uuid-v4", uuidV4);
    ajv.addFormat("file-suffix", fileSuffix);
};
